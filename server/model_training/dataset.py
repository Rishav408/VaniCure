import json
import numpy as np
import torch
from torch.utils.data import Dataset
from pathlib import Path

class CoswaraDataset(Dataset):
    def __init__(self, manifest_path: str, indices=None):
        with open(manifest_path) as f:
            all_records = json.load(f)
        
        if indices is not None:
            self.records = [all_records[i] for i in indices]
        else:
            self.records = all_records

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        record = self.records[idx]
        features = np.load(record["path"])  # (168, time)
        
        # Normalize per sample
        features = (features - features.mean()) / (features.std() + 1e-8)
        
        # Shape for CNN: (1, freq, time) — add channel dim
        x = torch.FloatTensor(features).unsqueeze(0)
        y = torch.LongTensor([record["label"]])[0]
        return x, y


def get_splits(manifest_path: str, val_ratio=0.2, seed=42):
    """Stratified train/val split."""
    with open(manifest_path) as f:
        records = json.load(f)
    
    from collections import defaultdict
    import random
    random.seed(seed)
    
    by_class = defaultdict(list)
    for i, r in enumerate(records):
        by_class[r["label"]].append(i)
    
    train_idx, val_idx = [], []
    for indices in by_class.values():
        random.shuffle(indices)
        split = int(len(indices) * (1 - val_ratio))
        train_idx.extend(indices[:split])
        val_idx.extend(indices[split:])
    
    return train_idx, val_idx
