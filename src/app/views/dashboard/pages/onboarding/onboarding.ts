import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { OnboardingService } from './onboarding.service';

import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ord-core-onboarding',
  imports: [CommonModule, ReactiveFormsModule, MatStepperModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatRadioModule, MatIconModule],
  standalone: true,
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.scss']
})
export class Onboarding implements OnInit {

  step1Group!: FormGroup;
  step2Group!: FormGroup;
  step3Group!: FormGroup;

  // Signal para controlar los documentos a mostrar
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
    private onboardingService: OnboardingService
  ) {}

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
      // Usamos un FormArray para manejar múltiples sucursales
      branches: this.fb.array([this.createBranchGroup()])
    });
    
    this.step3Group = this.fb.group({
        // TODO: para documentos
    });

    this.step1Group.get('personType')?.valueChanges.subscribe(value => {
      this.personType.set(value);
      this.updateValidators(value);
    });
  }

  // Helper para manejar el FormArray de sucursales
  get branches(): FormArray {
    return this.step2Group.get('branches') as FormArray;
  }
  createBranchGroup(): FormGroup {
    return this.fb.group({
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
  }
  addBranch(): void {
    this.branches.push(this.createBranchGroup());
  }
  removeBranch(index: number): void {
    this.branches.removeAt(index);
  }

  // Actualiza validadores según el tipo de persona
  updateValidators(personType: 'fisica' | 'moral'): void {
      const legalRepControl = this.step1Group.get('legalRepresentative');
      if (personType === 'moral') {
          legalRepControl?.setValidators([Validators.required]);
      } else {
          legalRepControl?.clearValidators();
      }
      legalRepControl?.updateValueAndValidity();
  }
  
  onFileSelected(event: Event, docName: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      console.log(`Archivo para '${docName}':`, file.name);
      // TODO: Logica para subir archivos
    }
  }

  submitForm(): void {
    if (this.step1Group.valid && this.step2Group.valid && this.step3Group.valid) {
      const finalData = {
        clientData: this.step1Group.value,
        restaurantData: this.step2Group.value,
        // TODO: añadir archivos del paso 3
      };
      this.onboardingService.submitOnboardingForm(finalData);
    }
  }
}
