import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SuccessInfoData {
  username: string;
  temporaryPassword: string;
  workspaceUrl: string;
}

@Component({
  selector: 'ord-core-success-info-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './success-info-dialog.html',
  styleUrls: ['./success-info-dialog.scss'],
})
export class SuccessInfoDialog {
  constructor(
    public dialogRef: MatDialogRef<SuccessInfoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessInfoData
  ) {}

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
}
