import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-client-data-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './client-data-step.component.html',
  styleUrls: ['./client-data-step.component.scss']
})
export class ClientDataStepComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() isEditMode = false;
  @Input() logoFile: File | null = null;
  @Input() logoPreview: string | null = null;
  @Input() isUploadingLogo = false;
  @Input() planOptions$!: Observable<any[]>;
  
  @Output() logoSelected = new EventEmitter<File>();
  @Output() logoRemoved = new EventEmitter<void>();

  personType = computed(() => 
    this.formGroup.get('customerType')?.value || 'PERSONA_FISICA'
  );

  hasLogoPreview = computed(() => !!this.logoPreview);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      // Emitir error - el padre manejará la notificación
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      // Emitir error - el padre manejará la notificación
      return;
    }

    this.logoSelected.emit(file);
    (event.target as HTMLInputElement).value = '';
  }

  onRemoveLogo(): void {
    this.logoRemoved.emit();
  }

  onColorChange(event: Event, isColorInput: boolean): void {
    const value = (event.target as HTMLInputElement).value;
    
    if (isColorInput) {
      // Si cambió el color picker, actualizar el text input
      this.formGroup.patchValue({ brandColor: value }, { emitEvent: false });
    } else {
      // Si cambió el text input, validar y actualizar el color picker
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        this.formGroup.patchValue({ brandColor: value }, { emitEvent: false });
      }
    }
  }
}

