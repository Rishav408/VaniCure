"""
Improved training loop for CNN-BiLSTM.
Features: class-weighted loss, early stopping, LR cosine schedule, training log.
Usage: python train.py
"""

import os
import json
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score, classification_report
import numpy as np
from pathlib import Path
from collections import Counter

from dataset import CoswaraDataset, get_splits
from model import CNNBiLSTM, count_params

# ─── Config ──────────────────────────────────────────────────────────────────
MANIFEST    = "../data/coswara_processed/manifest.json"
CKPT_DIR    = Path("../checkpoints")
LOG_PATH    = CKPT_DIR / "training_log.json"
BATCH_SIZE  = 32
EPOCHS      = 60
LR          = 1e-3
PATIENCE    = 12          # early stopping patience
DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES     = ["healthy", "tb", "asthma"]


# ─── Training ─────────────────────────────────────────────────────────────────

def compute_class_weights(manifest_path: str) -> torch.Tensor:
    """Compute inverse-frequency class weights to handle imbalance."""
    with open(manifest_path) as f:
        records = json.load(f)
    label_counts = Counter(r["label"] for r in records)
    total = sum(label_counts.values())
    weights = torch.FloatTensor([
        total / (len(CLASSES) * label_counts.get(i, 1))
        for i in range(len(CLASSES))
    ])
    print(f"[Train] Class weights: {[round(w.item(), 3) for w in weights]}")
    return weights


def train_epoch(model, loader, optimizer, criterion):
    model.train()
    total_loss, correct, total = 0, 0, 0
    for x, y in loader:
        x, y = x.to(DEVICE), y.to(DEVICE)
        optimizer.zero_grad()
        out = model(x)
        loss = criterion(out, y)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        total_loss += loss.item() * len(x)
        correct    += (out.argmax(1) == y).sum().item()
        total      += len(x)
    return total_loss / total, correct / total


@torch.no_grad()
def eval_epoch(model, loader, criterion):
    model.eval()
    total_loss, all_preds, all_labels = 0, [], []
    for x, y in loader:
        x, y = x.to(DEVICE), y.to(DEVICE)
        out = model(x)
        loss = criterion(out, y)
        total_loss += loss.item() * len(x)
        all_preds.extend(out.argmax(1).cpu().tolist())
        all_labels.extend(y.cpu().tolist())
    f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    return total_loss / len(loader.dataset), f1, all_preds, all_labels


def main():
    if not os.path.exists(MANIFEST):
        print(f"[Train] ❌ Manifest not found at {MANIFEST}")
        print("[Train]    Run: python preprocess.py first")
        return

    CKPT_DIR.mkdir(exist_ok=True)
    print(f"[Train] Device: {DEVICE}")

    # Data with class-weighted loss
    class_weights = compute_class_weights(MANIFEST).to(DEVICE)
    train_idx, val_idx = get_splits(MANIFEST)
    train_ds = CoswaraDataset(MANIFEST, train_idx)
    val_ds   = CoswaraDataset(MANIFEST, val_idx)
    print(f"[Train] Train: {len(train_ds)}  Val: {len(val_ds)}")

    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,
                          num_workers=2, pin_memory=True)
    val_dl   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False,
                          num_workers=2, pin_memory=True)

    # Model, loss, optimizer
    model     = CNNBiLSTM(n_classes=3).to(DEVICE)
    print(f"[Train] Parameters: {count_params(model):,}")

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-5)

    best_f1, best_epoch, no_improve = 0.0, 0, 0
    training_log = []

    print(f"\n{'='*70}")
    print(f"  {'Epoch':>5}  {'TrLoss':>8}  {'TrAcc':>7}  {'ValLoss':>8}  {'F1':>7}  {'LR':>8}  Status")
    print(f"{'='*70}")

    start_time = time.time()

    for epoch in range(1, EPOCHS + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_dl, optimizer, criterion)
        val_loss, val_f1, preds, labels = eval_epoch(model, val_dl, criterion)
        scheduler.step()

        lr_now = scheduler.get_last_lr()[0]
        epoch_time = time.time() - t0

        status = ""
        if val_f1 > best_f1:
            best_f1    = val_f1
            best_epoch = epoch
            no_improve = 0
            torch.save({
                "epoch":       epoch,
                "model_state": model.state_dict(),
                "val_f1":      val_f1,
                "classes":     CLASSES,
            }, CKPT_DIR / "cnn_bilstm.pth")
            status = "✅ Best"
        else:
            no_improve += 1
            if no_improve >= PATIENCE:
                print(f"\n[Train] ⏹  Early stopping at epoch {epoch} (no improvement for {PATIENCE} epochs).")
                break

        training_log.append({
            "epoch": epoch, "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4), "val_loss": round(val_loss, 4),
            "val_f1": round(val_f1, 4), "lr": round(lr_now, 6),
        })

        print(f"  {epoch:>5}  {train_loss:>8.4f}  {train_acc:>7.3f}  "
              f"{val_loss:>8.4f}  {val_f1:>7.3f}  {lr_now:>8.6f}  {status}")

    total_time = time.time() - start_time
    print(f"\n[Train] Best F1: {best_f1:.4f} at epoch {best_epoch}")
    print(f"[Train] Total time: {total_time/60:.1f} min")

    # Save training log
    with open(LOG_PATH, "w") as f:
        json.dump({"best_f1": best_f1, "best_epoch": best_epoch,
                   "classes": CLASSES, "history": training_log}, f, indent=2)
    print(f"[Train] Training log saved: {LOG_PATH}")

    # Final classification report
    best_ckpt = torch.load(CKPT_DIR / "cnn_bilstm.pth", map_location=DEVICE)
    model.load_state_dict(best_ckpt["model_state"])
    _, _, preds, labels = eval_epoch(model, val_dl, criterion)
    print("\n" + classification_report(labels, preds, target_names=CLASSES))

    print("[Train] ✅ Model saved to server/checkpoints/cnn_bilstm.pth")
    print("[Train]    Restart the server to activate CNN-BiLSTM live inference.")


if __name__ == "__main__":
    main()
