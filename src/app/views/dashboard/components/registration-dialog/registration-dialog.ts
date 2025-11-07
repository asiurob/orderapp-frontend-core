import { Component, Inject, OnInit, signal, ViewChildren, QueryList, ElementRef } from '@angular/core'; // Añadir ViewChildren, QueryList, ElementRef
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Tipo básico para datos recibidos (simplificado)
type RegistrationData = any;

@Component({
  selector: 'ord-core-registration-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatStepperModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatRadioModule, MatIconModule, MatDialogModule],
  standalone: true,
  templateUrl: './registration-dialog.html',
  styleUrls: ['./registration-dialog.scss']
})
export class RegistrationDialog implements OnInit {
  // Referencias a los inputs de archivo
  @ViewChildren('fileInputFisica') fileInputsFisica!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('fileInputMoral') fileInputsMoral!: QueryList<ElementRef<HTMLInputElement>>;

  step1Group!: FormGroup;
  step2Group!: FormGroup;
  step3Group!: FormGroup;

  isEditMode: boolean;
  personType = signal<'fisica' | 'moral'>('fisica');

  docsFisica = [
    'Identificación oficial vigente (INE)',
    'CIF actualizado (Menos de un mes)',
    'Comprobante de domicilio (Máx. 2 meses)',
    'Carátula del estado de cuenta (Máx. 2 meses)',
    'KYC'
  ];
  docsMoral = [
    'Acta Constitutiva',
    'Registro Público de la Propiedad y Comercio',
    'Poder del representante legal',
    'Identificación oficial vigente del representante legal',
    'CIF de la empresa (Menos de un mes)',
    'Comprobante de domicilio (Máx. 2 meses)',
    'Carátula del estado de cuenta (Máx. 2 meses)',
    'KYC'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegistrationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RegistrationData | null
  ) {
    this.isEditMode = !!this.data;
  }

  ngOnInit(): void {
    this.step1Group = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      legalRepresentative: [''],
      personType: ['fisica', Validators.required],
      rfc: ['', Validators.required],
      taxId: [''],
      bankClabe: ['', Validators.required],
      bankName: ['', Validators.required]
    });

    this.step2Group = this.fb.group({
      tradeName: ['', Validators.required],
      businessName: [''],
      branches: this.fb.array([])
    });

    this.step3Group = this.fb.group({
    });


    if (this.isEditMode && this.data) {
      if (this.data.clientData) {
        this.step1Group.patchValue(this.data.clientData);
        this.personType.set(this.step1Group.get('personType')?.value || 'fisica');
      }
      if (this.data.restaurantData) {
        this.step2Group.patchValue({
            tradeName: this.data.restaurantData.tradeName,
            businessName: this.data.restaurantData.businessName
        });
        if (this.data.restaurantData.branches && Array.isArray(this.data.restaurantData.branches)) {
           this.data.restaurantData.branches.forEach((branch: any) => {
              this.branches.push(this.createBranchGroup(branch));
           });
        } else {
            this.addBranch();
        }
      } else {
          this.addBranch();
      }
    } else {
      this.addBranch();
    }

    this.step1Group.get('personType')?.valueChanges.subscribe(value => {
      this.personType.set(value);
      this.updateValidators(value);
    });
  }

  onCancel(): void { this.dialogRef.close(); }

  submitForm(): void {
    if (this.step1Group.valid && this.step2Group.valid && this.step3Group.valid) {
      const finalData = {
        clientData: this.step1Group.value,
        restaurantData: this.step2Group.value,
      };
      this.dialogRef.close(finalData);
    } else {
        this.step1Group.markAllAsTouched();
        this.step2Group.markAllAsTouched();
        this.step3Group.markAllAsTouched();
        console.error("Formulario inválido");
    }
  }

  get branches(): FormArray {
    return this.step2Group.get('branches') as FormArray;
  }

  createBranchGroup(branchData: any = null): FormGroup {
    const group = this.fb.group({
      street: ['', Validators.required],
      extNum: ['', Validators.required],
      intNum: [''],
      colony: ['', Validators.required],
      municipality: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      contact: ['', Validators.required], 
      phone: ['', Validators.required]
    });
    if (branchData) {
      group.patchValue(branchData);
    }
    return group;
  }
  addBranch(): void { this.branches.push(this.createBranchGroup()); }
  removeBranch(index: number): void { this.branches.removeAt(index); }
  updateValidators(personType: 'fisica' | 'moral'): void {
      const legalRepControl = this.step1Group.get('legalRepresentative');
      if (personType === 'moral') {
          legalRepControl?.setValidators([Validators.required]);
      } else {
          legalRepControl?.clearValidators();
      }
      legalRepControl?.updateValueAndValidity();
  }

  triggerFileInput(type: 'fisica' | 'moral', index: number): void {
      const inputs = type === 'fisica' ? this.fileInputsFisica : this.fileInputsMoral;
      const inputElement = inputs.toArray()[index]?.nativeElement;
      if (inputElement) {
          inputElement.click();
      }
  }

  onFileSelected(event: Event, docName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      console.log(`Archivo para '${docName}':`, file.name);
      // TODO: Lógica para subir archivos
    }
    (event.target as HTMLInputElement).value = '';
  }
}