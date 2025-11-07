import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IPlan, IPlanInput } from '../../pages/plans/plans.interface';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../../../shared/confirm-dialog/confirm-dialog';

// Importaciones de Material
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';

export interface PlanDialogData {
  plan?: IPlan;
  isViewOnly?: boolean;
}

@Component({
  selector: 'app-plan-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSlideToggleModule, 
    MatTooltipModule,
    MatButtonToggleModule,
    MatRadioModule
  ],
  templateUrl: './plan-dialog.html',
  styleUrls: ['./plan-dialog.scss']
})
export class PlanDialog implements OnInit {
  planForm!: FormGroup;
  isEditMode: boolean;
  isViewOnly: boolean;
  title: string;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PlanDialog>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: PlanDialogData | null
  ) {
    this.isEditMode = !!this.data?.plan;
    this.isViewOnly = this.data?.isViewOnly || false;

    if (this.isViewOnly) {
      this.title = 'Detalles del Plan';
    } else if (this.isEditMode) {
      this.title = 'Editar Plan';
    } else {
      this.title = 'Crear Nuevo Plan';
    }
  }

  ngOnInit(): void {
    this.planForm = this.fb.group({
      planName: ['', Validators.required],
      description: [''],
      pricingType: ['fijo', Validators.required],
      fixedCost: [0, [Validators.required, Validators.min(0)]],
      percentPerTransaction: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      operativeUsers: [1, [Validators.required, Validators.min(-1)]],
      locations: [1, [Validators.required, Validators.min(-1)]],
      tables: [-1, [Validators.required, Validators.min(-1)]],
      categories: [-1, [Validators.required, Validators.min(-1)]],
      products: [-1, [Validators.required, Validators.min(-1)]],
      kitchens: [1, [Validators.required, Validators.min(-1)]],
      metrics: [false],
      isPublic: [true],
      isActive: [true],
    });

    this.planForm.get('pricingType')?.valueChanges.subscribe(type => {
      this.togglePricingControls(type);
    });

    // Llenado de formulario en modo Edición/Ver
    if (this.isEditMode && this.data?.plan) {
      this.planForm.patchValue(this.data.plan);
      
      const loadedFixedCost = this.data.plan.fixedCost;
      const type = loadedFixedCost > 0 ? 'fijo' : 'porcentaje';
      this.planForm.get('pricingType')?.setValue(type);
      this.togglePricingControls(type);
    }

    if (this.isViewOnly) {
      this.planForm.disable();
    }
  }

  // Habilita/Deshabilita los campos de precio
  togglePricingControls(type: string): void {
    const fixedCostControl = this.planForm.get('fixedCost');
    const percentControl = this.planForm.get('percentPerTransaction');

    if (type === 'fijo') {
      fixedCostControl?.enable();
      percentControl?.disable();
      percentControl?.setValue(0);
    } else { // 'porcentaje'
      fixedCostControl?.disable();
      fixedCostControl?.setValue(0);
      percentControl?.enable();
    }
  }

  onSave(): void {
    if (this.planForm.valid) {
      const formValue = this.planForm.getRawValue();

      const {
        pricingType,
        fixedCost,
        percentPerTransaction,
        operativeUsers,
        locations,
        tables,
        categories,
        products,
        kitchens,
        ...rest
      } = formValue;

      const correctedData: IPlanInput = {
        ...rest,
        fixedCost: +fixedCost,
        percentPerTransaction: +percentPerTransaction,
        operativeUsers: +operativeUsers,
        locations: +locations,
        tables: +tables,
        categories: +categories,
        products: +products,
        kitchens: +kitchens
      };
      
      this.dialogRef.close(correctedData);
    }
  }

onDelete(): void {
    const confirmRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: '¿Borrar Plan?',
        message: 'Estás a punto de eliminar este plan de forma permanente. ¿Estás seguro?',
        confirmText: 'Sí, Borrar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    confirmRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.dialogRef.close({ isDeleteAction: true, planId: this.data?.plan?.id });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
