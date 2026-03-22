"""
CNN-BiLSTM architecture for respiratory sound classification.
Input:  (batch, 1, 168, time_frames)
Output: (batch, 3)  — healthy, tb, asthma
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class CNNBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel=3):
        super().__init__()
        self.conv = nn.Conv2d(in_ch, out_ch, kernel_size=kernel, padding=kernel//2, bias=False)
        self.bn   = nn.BatchNorm2d(out_ch)
        self.pool = nn.MaxPool2d(kernel_size=(2, 2))
        self.drop = nn.Dropout2d(0.25)

    def forward(self, x):
        return self.drop(self.pool(F.relu(self.bn(self.conv(x)))))


class CNNBiLSTM(nn.Module):
    def __init__(self, n_classes=3, freq_bins=168, lstm_hidden=128, lstm_layers=2):
        super().__init__()

        # CNN encoder — extract spatial features from spectrogram
        self.cnn = nn.Sequential(
            CNNBlock(1,   32, kernel=3),   # (B, 32, 84, T/2)
            CNNBlock(32,  64, kernel=3),   # (B, 64, 42, T/4)
            CNNBlock(64, 128, kernel=3),   # (B, 128, 21, T/8)
        )

        # After 3 x MaxPool(2,2): freq_bins // 8, time // 8
        self.cnn_out_freq = freq_bins // 8   # 168 → 21
        
        # Flatten freq dimension to feed into LSTM
        # BiLSTM input: (batch, time_steps, cnn_out_freq * 128)
        self.bilstm = nn.LSTM(
            input_size=self.cnn_out_freq * 128,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3 if lstm_layers > 1 else 0.0,
        )

        self.dropout = nn.Dropout(0.5)
        self.classifier = nn.Sequential(
            nn.Linear(lstm_hidden * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, n_classes),
        )

    def forward(self, x):
        # x: (B, 1, freq, time)
        x = self.cnn(x)                           # (B, 128, freq//8, time//8)
        B, C, F, T = x.shape
        
        # Rearrange for LSTM: (B, T, C*F)
        x = x.permute(0, 3, 1, 2)                 # (B, T, C, F)
        x = x.reshape(B, T, C * F)                # (B, T, C*F)
        
        # BiLSTM
        x, _ = self.bilstm(x)                     # (B, T, hidden*2)
        
        # Aggregate over time — use last timestep
        x = x[:, -1, :]                            # (B, hidden*2)
        
        x = self.dropout(x)
        return self.classifier(x)                  # (B, n_classes)


def count_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == "__main__":
    model = CNNBiLSTM()
    x = torch.randn(4, 1, 168, 128)  # batch of 4, 3sec audio
    out = model(x)
    print(f"Output shape: {out.shape}")  # (4, 3)
    print(f"Trainable parameters: {count_params(model):,}")
