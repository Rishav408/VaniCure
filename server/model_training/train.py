"""
Training loop for CNN-BiLSTM.
Usage: python train.py
"""
import os, json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score, classification_report
import numpy as np
from pathlib import Path

from dataset import CoswaraDataset, get_splits
from model import CNNBiLSTM, count_params

# ─── Config ──────────────────────────────────────────────────────────────────
MANIFEST    = "../data/coswara_processed/manifest.json"
CKPT_DIR    = Path("../checkpoints")
BATCH_SIZE  = 32
EPOCHS      = 40
LR          = 1e-3
DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES     = ["healthy", "tb", "asthma"]


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
    CKPT_DIR.mkdir(exist_ok=True)
    print(f"[Train] Device: {DEVICE}")

    # Data
    train_idx, val_idx = get_splits(MANIFEST)
    train_ds = CoswaraDataset(MANIFEST, train_idx)
    val_ds   = CoswaraDataset(MANIFEST, val_idx)

    print(f"[Train] Train: {len(train_ds)}, Val: {len(val_ds)}")

    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=2, pin_memory=True)
    val_dl   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)

    # Model
    model = CNNBiLSTM(n_classes=3).to(DEVICE)
    print(f"[Train] Parameters: {count_params(model):,}")

    # Loss with class weights to handle imbalance
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_f1, best_epoch = 0.0, 0

    for epoch in range(1, EPOCHS + 1):
        train_loss, train_acc = train_epoch(model, train_dl, optimizer, criterion)
        val_loss, val_f1, preds, labels = eval_epoch(model, val_dl, criterion)
        scheduler.step()

        print(f"Epoch {epoch:02d}/{EPOCHS} | "
              f"Train Loss: {train_loss:.4f}  Acc: {train_acc:.3f} | "
              f"Val Loss: {val_loss:.4f}  F1: {val_f1:.3f}")

        if val_f1 > best_f1:
            best_f1 = val_f1
            best_epoch = epoch
            torch.save({
                "epoch": epoch,
                "model_state": model.state_dict(),
                "val_f1": val_f1,
                "classes": CLASSES,
            }, CKPT_DIR / "cnn_bilstm.pth")
            print(f"  ✅ Saved best model (F1: {best_f1:.4f})")

    print(f"\n[Train] Best F1: {best_f1:.4f} at epoch {best_epoch}")

    # Final report on best model
    model.load_state_dict(torch.load(CKPT_DIR / "cnn_bilstm.pth")["model_state"])
    _, _, preds, labels = eval_epoch(model, val_dl, criterion)
    print("\n" + classification_report(labels, preds, target_names=CLASSES))


if __name__ == "__main__":
    main()
