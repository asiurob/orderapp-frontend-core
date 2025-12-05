import { Component, Input, Output, EventEmitter, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

export interface FileUploadState {
  file: File;
  uploadProgress: number;
  uploadedUrl?: string;
  error?: string;
  docName: string;
}

@Component({
  selector: 'app-documents-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './documents-step.component.html',
  styleUrls: ['./documents-step.component.scss']
})
export class DocumentsStepComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() personType: 'PERSONA_FISICA' | 'PERSONA_MORAL' = 'PERSONA_FISICA';
  @Input() uploadedFiles!: Map<string, FileUploadState>;
  
  @ViewChildren('fileInputFisica') fileInputsFisica!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('fileInputMoral') fileInputsMoral!: QueryList<ElementRef<HTMLInputElement>>;
  
  @Output() fileSelected = new EventEmitter<{ file: File; docName: string }>();

  docsFisica = [
    'Identificación oficial vigente (INE)',
    'CIF actualizado (Menos de un mes)',
    'Comprobante de domicilio (Máx. 2 meses)',
    'Carátula del estado de cuenta (Máx. 2 meses)'
  ];

  docsMoral = [
    'Acta Constitutiva',
    'Registro Público de la Propiedad y Comercio',
    'Poder del representante legal',
    'Identificación oficial vigente del representante legal',
    'CIF de la empresa (Menos de un mes)',
    'Comprobante de domicilio (Máx. 2 meses)',
    'Carátula del estado de cuenta (Máx. 2 meses)'
  ];

  get documents(): string[] {
    return this.personType === 'PERSONA_FISICA' ? this.docsFisica : this.docsMoral;
  }

  getDocTitle(docName: string): string {
    const match = docName.match(/^([^(]+)/);
    return match ? match[1].trim() : docName;
  }

  getDocSubtitle(docName: string): string {
    const match = docName.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : '';
  }

  getFileState(docName: string): FileUploadState | undefined {
    return this.uploadedFiles?.get(docName);
  }

  hasFile(docName: string): boolean {
    return this.uploadedFiles?.has(docName) ?? false;
  }

  onFileSelected(event: Event, docName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.fileSelected.emit({ file, docName });
    }
    (event.target as HTMLInputElement).value = '';
  }

  triggerFileInput(type: 'fisica' | 'moral', index: number): void {
    const inputs = type === 'fisica' ? this.fileInputsFisica : this.fileInputsMoral;
    const inputElement = inputs.toArray()[index]?.nativeElement;
    if (inputElement) {
      inputElement.click();
    }
  }
}

