import {
  Component,
  Inject,
  OnInit,
  signal,
  ViewChildren,
  QueryList,
  ElementRef,
  ViewChild,
  DestroyRef,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatStepper,
  MatStepperModule
} from '@angular/material/stepper';
import {
  MatAutocompleteModule
} from '@angular/material/autocomplete';
import {
  MatSelectModule
} from '@angular/material/select';
import {
  MatFormFieldModule
} from '@angular/material/form-field';
import {
  MatInputModule
} from '@angular/material/input';
import {
  MatButtonModule
} from '@angular/material/button';
import {
  MatRadioModule
} from '@angular/material/radio';
import {
  MatIconModule
} from '@angular/material/icon';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import {
  MatTooltipModule
} from '@angular/material/tooltip';
import {
  RegisteredClientsService
} from '../../pages/registered-client/registered-client.service';
import {
  NotificationService
} from 'src/app/shared/notification/notification.service';
import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';
import {
  Observable,
  of ,
  BehaviorSubject,
  combineLatestWith
} from 'rxjs';
import {
  startWith,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  tap,
  filter
} from 'rxjs/operators';
import {
  PlansService
} from '../../pages/plans/plans.service';
import { SuccessInfoDialog } from 'src/app/shared/success-info-dialog/success-info-dialog';

type RegistrationData = any;

@Component({
  selector: 'ord-core-registration-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatStepperModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatRadioModule, MatIconModule, MatDialogModule, MatTooltipModule, MatAutocompleteModule, MatSelectModule
  ],
  standalone: true,
  templateUrl: './registration-dialog.html',
  styleUrls: ['./registration-dialog.scss']
})
export class RegistrationDialog implements OnInit {
  @ViewChild('stepper') private stepper!: MatStepper;
  private destroyRef = inject(DestroyRef);
  @ViewChildren('fileInputFisica') fileInputsFisica!: QueryList < ElementRef < HTMLInputElement >> ;
  @ViewChildren('fileInputMoral') fileInputsMoral!: QueryList < ElementRef < HTMLInputElement >> ;

  step1Group!: FormGroup;
  step2Group!: FormGroup;
  step3Group!: FormGroup;

  isEditMode: boolean = false;
  personType = signal < 'PERSONA_FISICA' | 'PERSONA_MORAL' > ('PERSONA_FISICA');
  private newCustomerId: string | null = null;
  public isSavingStep1 = signal(false);
  private stateListSource = new BehaviorSubject < any[] > ([]);
  stateOptions$: Observable < any[] > = new Observable < any[] > ();
  private municipalityListSource = new BehaviorSubject < any[] > ([]);
  municipalityOptions$: Observable < any[] > = new Observable < any[] > ();
  private neighborhoodListSource = new BehaviorSubject < any[] > ([]);
  neighborhoodOptions$: Observable < any[] > = new Observable < any[] > ();
  planOptions$: Observable < any[] > = new Observable < any[] > ();

  public isSavingStep2 = signal(false);
  public newRestaurantInfo: any = null;

  // Mocks
  docsFisica = ['Identificación oficial vigente (INE)', 'CIF actualizado (Menos de un mes)', 'Comprobante de domicilio (Máx. 2 meses)', 'Carátula del estado de cuenta (Máx. 2 meses)', 'KYC'];
  docsMoral = ['Acta Constitutiva', 'Registro Público de la Propiedad y Comercio', 'Poder del representante legal', 'Identificación oficial vigente del representante legal', 'CIF de la empresa (Menos de un mes)', 'Comprobante de domicilio (Máx. 2 meses)', 'Carátula del estado de cuenta (Máx. 2 meses)', 'KYC'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef < RegistrationDialog > ,
    private clientService: RegisteredClientsService,
    private plansService: PlansService,
    private notification: NotificationService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: RegistrationData | null
  ) {
    this.isEditMode = !!this.data;
  }

  ngOnInit(): void {
    // --- STEP 1 ---
    this.step1Group = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rfc: ['', Validators.required],
      customerType: ['PERSONA_FISICA', Validators.required],
      bankAccount: ['', [Validators.required, Validators.maxLength(18)]],
      bankInstitution: ['', Validators.required],
      legalRepresentativeFirstName: ['', Validators.required],
      legalRepresentativeLastName: ['', Validators.required],
      legalRepresentativeSecondLastName: ['', Validators.required],
      fiscalIdCard: ['']
    });

    // --- STEP 2 ---
    this.step2Group = this.fb.group({
      postalCodeId: [null],
      stateId: [null],
      municipalityId: [null],
      neighborhoodId: [null],
      planId: ['', Validators.required],
      commercialName: ['', Validators.required],
      branch: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      state: [null, Validators.required],
      municipality: [null, Validators.required],
      neighborhood: [null, Validators.required],
      street: ['', Validators.required],
      exteriorNumber: ['', Validators.required],
      interiorNumber: [''],
      notes: ['']
    });

    // --- STEP 3 ---
    this.step3Group = this.fb.group({});
    if (this.isEditMode && this.data) {
      if (this.data.clientData) {
        this.step1Group.patchValue(this.data.clientData);
        this.personType.set(this.step1Group.get('customerType') ?.value || 'PERSONA_FISICA');
      }
      if (this.data.restaurantData) {
        this.step2Group.patchValue(this.data.restaurantData);
      }
    }

    this.step1Group.get('customerType') ?.valueChanges.subscribe(value => {
      this.personType.set(value);
      this.updateValidators(value);
    });
    this.planOptions$ = this.plansService.getPlansForSelect();

    this.loadAllStates();
    this.setupStateListener();
    this.setupPostalCodeListener();
    this.setupMunicipalityListener();
    this.setupNeighborhoodListener();

    this.cdr.markForCheck();
   } 

  onCancel(): void {
    this.dialogRef.close();
  }

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

  updateValidators(customerType: 'PERSONA_FISICA' | 'PERSONA_MORAL'): void {
    const fiscalIdCard = this.step1Group.get('fiscalIdCard');
    if (customerType === 'PERSONA_MORAL') {
      fiscalIdCard ?.setValidators([Validators.required]);
    } else {
      fiscalIdCard ?.clearValidators();
    }
    fiscalIdCard ?.updateValueAndValidity();
  }

  triggerFileInput(type: 'fisica' | 'moral', index: number): void {
    const inputs = type === 'fisica' ? this.fileInputsFisica : this.fileInputsMoral;
    const inputElement = inputs.toArray()[index] ?.nativeElement;
    if (inputElement) {
      inputElement.click();
    }
  }

  onFileSelected(event: Event, docName: string): void {
    const file = (event.target as HTMLInputElement).files ?. [0];
    if (file) {
      console.log(`Archivo para '${docName}':`, file.name);
    }
    (event.target as HTMLInputElement).value = '';
  }

  onStep1Next(): void {
    if (this.step1Group.invalid) {
      this.step1Group.markAllAsTouched();
      this.notification.error('Por favor, completa todos los campos requeridos.');
      return;
    }
    if (this.isSavingStep1()) return;
    this.isSavingStep1.set(true);
    const payload = this.step1Group.value;
    if (payload.customerType === 'PERSONA_FISICA') {
      delete payload.fiscalIdCard;
    }
    this.clientService.createLegalCustomer(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSavingStep1.set(false);
          if (response.success && response.data ?.id) {
            this.notification.success(response.message);
            this.newCustomerId = response.data.id;
            this.stepper.next();
          } else {
            const errorMsg = response.errors ?. [0] || response.message || 'Error al guardar.';
            this.notification.error(errorMsg);
          }
        },
        error: (err) => {
          this.isSavingStep1.set(false);
          this.notification.error('Error crítico. Revisa la consola.');
          console.error(err);
        }
      });
  }

  setupPostalCodeListener(): void {
    const cpControl = this.step2Group.get('postalCode');
    if (!cpControl) return;
    cpControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(cpValue => {
        if (cpValue && cpValue.length === 5) {
          this.step2Group.get('state') ?.disable();
          this.step2Group.get('municipality') ?.disable();
          this.step2Group.get('neighborhood') ?.disable();
          return this.clientService.getLocationByPostalCode(cpValue);
        } else {
          this.step2Group.get('state') ?.enable();
          this.step2Group.get('municipality') ?.enable();
          this.step2Group.get('neighborhood') ?.enable();
          return of({
            success: false,
            message: 'Modo Manual',
            data: null,
            errors: []
          });
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.step2Group.get('state') ?.enable();
      this.step2Group.get('municipality') ?.enable();
      this.step2Group.get('neighborhood') ?.enable();
      if (response.success && response.data) {
        const data = response.data;
        this.step2Group.patchValue({
          state: data.state,
          municipality: data.municipality,
          postalCodeId: data.zipCode.id,
          stateId: data.state.id,
          municipalityId: data.municipality.id,
          neighborhood: null,
          neighborhoodId: null,
          street: '',
          exteriorNumber: '',
          interiorNumber: ''
        });
        this.neighborhoodOptions$ = of (data.neighborhoods);
      } else if (response.message !== 'Modo Manual') {
        this.notification.error(response.message || 'Código Postal no encontrado.');
        this.step2Group.patchValue({
          state: null,
          municipality: null,
          neighborhood: null,
          postalCodeId: null,
          stateId: null,
          municipalityId: null,
          neighborhoodId: null,
          street: '',
          exteriorNumber: '',
          interiorNumber: ''
        });
        this.neighborhoodOptions$ = of ([]);
      }
    });
  }

  displayLocation(location: {
    id: string,
    name ? : string,
    value ? : string
  }): string {
    return location ? (location.name || location.value || '') : '';
  }

  loadAllStates(): void {
    this.clientService.getAllStates()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(states => states.map(s => ({
          id: s.id,
          name: s.name
        })))
      )
      .subscribe(mappedStates => {
        console.log('✅ ESTADOS CARGADOS EN LA "CAJITA":', mappedStates);

        if (mappedStates && mappedStates.length > 0) {
          this.stateListSource.next(mappedStates);
        } else {
          console.error('¡El servicio de Estados regresó un array vacío!');
        }
      });
  }

  setupStateListener(): void {

    this.stateOptions$ = this.step2Group.get('state') !.valueChanges.pipe(
      startWith(''),

      combineLatestWith(this.stateListSource),

      map(([searchText, states]) => {
        if (!states || states.length === 0) {
          return [];
        }

        if (!searchText || typeof searchText !== 'string') {
          return states;
        }

        const filterValue = searchText.toLowerCase();
        return states.filter(s => s.name.toLowerCase().includes(filterValue));
      })
    );
  }

  setupMunicipalityListener(): void {
    this.municipalityOptions$ = this.step2Group.get('municipality') !.valueChanges.pipe(
      startWith(''),
      combineLatestWith(this.municipalityListSource),
      map(([searchText, munis]) => {
        if (!munis || munis.length === 0) return [];
        if (!searchText || typeof searchText !== 'string') return munis;
        const filterValue = searchText.toLowerCase();
        return munis.filter(m => m.name.toLowerCase().includes(filterValue));
      })
    );
  }

  // Cuando seleccionan un Estado
  onStateSelected(state: {
    id: string,
    name: string
  }): void {
    if (state && state.id) {
      this.step2Group.patchValue({
        stateId: state.id,
        municipality: null,
        neighborhood: null,
        municipalityId: null,
        neighborhoodId: null
      });
      this.step2Group.get('municipality') ?.enable();

      this.clientService.getMunicipalitiesByState(state.id).subscribe(munis => {
        this.municipalityListSource.next(munis);
      });
    } else {
      this.municipalityListSource.next([]);
    }
  }

  // Cuando seleccionan un Municipio
  onMunicipalitySelected(municipality: {
    id: string,
    name: string
  }): void {
    if (municipality && municipality.id) {
      this.step2Group.patchValue({
        municipalityId: municipality.id,
        neighborhood: null,
        neighborhoodId: null
      });
      this.step2Group.get('neighborhood') ?.enable();

      this.notification.info('¡Falta Query de Colonias!');
      this.clientService.getNeighborhoodsByMunicipality(municipality.id).subscribe(colonias => {
        this.neighborhoodListSource.next(colonias);
      });
    } else {
      this.step2Group.patchValue({
        neighborhood: null,
        neighborhoodId: null
      });
    }
  }

  onNeighborhoodSelected(neighborhood: {
    id: string,
    name: string,
    postalCode: {
      id: string,
      code: string
    }
  }): void {
    if (neighborhood && neighborhood.id) {

      this.step2Group.get('neighborhoodId') ?.setValue(neighborhood.id);
      const cpControl = this.step2Group.get('postalCode');
      if (cpControl && cpControl.value !== neighborhood.postalCode.code) {
        cpControl.patchValue(
          neighborhood.postalCode.code, {
            emitEvent: false
          }
        );
        this.step2Group.get('postalCodeId') ?.setValue(neighborhood.postalCode.id);
        cpControl.disable({
          emitEvent: false
        });
      }
    }
  }

  setupNeighborhoodListener(): void {
    this.neighborhoodOptions$ = this.step2Group.get('neighborhood') !.valueChanges.pipe(
      startWith(''),
      combineLatestWith(this.neighborhoodListSource),
      map(([searchText, colonias]) => {
        if (!colonias || colonias.length === 0) return [];
        if (!searchText || typeof searchText !== 'string') return colonias;
        const filterValue = searchText.toLowerCase();
        return colonias.filter(c => c.name.toLowerCase().includes(filterValue));
      })
    );
  }

  onStep2Next(): void {
      if (this.step2Group.invalid) {
         this.step2Group.markAllAsTouched();
         this.notification.error('Por favor, completa todos los campos del restaurante y la dirección.');
         return;
      }

    if (this.isSavingStep2()) return;
    this.isSavingStep2.set(true);

      const formValues = this.step2Group.getRawValue();

    if (typeof formValues.state !== 'object' || !formValues.state?.id) {
      this.notification.error('Por favor, selecciona un Estado válido de la lista.');
      this.isSavingStep2.set(false);
      return;
    }
    if (typeof formValues.municipality !== 'object' || !formValues.municipality?.id) {
      this.notification.error('Por favor, selecciona un Municipio válido de la lista.');
      this.isSavingStep2.set(false);
      return;
    }

      const payload = {
         ...formValues,
         legalCustomerId: this.newCustomerId,
         stateId: formValues.state.id,
         municipalityId: formValues.municipality.id,

         state: undefined, 
         municipality: undefined,
         neighborhood: undefined,
      postalCode: undefined 
      };
      
   	delete payload.state;
      delete payload.municipality;
      delete payload.neighborhood;
    delete payload.postalCode;

    this.clientService.createRestaurant(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => { 
          this.isSavingStep2.set(false); 

          if (response.success && response.data && response.ownerInfo) {
            this.notification.success(response.message);
            
            console.log('✅ ¡Respuesta de CreateRestaurant (el "loot")!', response);
            this.newRestaurantInfo = response; 
            
            const successDialogRef = this.dialog.open(SuccessInfoDialog, {
              width: '500px',
              disableClose: true,
              data: response.ownerInfo 
            });

            successDialogRef.afterClosed().subscribe(() => {
              this.stepper.next();
            });
            
          } else {
            this.notification.error(response.errors?.[0] || response.message || 'Error al crear restaurante.');
          }
        },
        error: (err) => {
          this.isSavingStep2.set(false);
          this.notification.error('Error crítico de red. Revisa la consola.');
          console.error(err);
        }
      });
   }

   handleStep1Next(): void {
    if (this.isEditMode) {
      if (this.step1Group.invalid) {
        this.step1Group.markAllAsTouched();
        this.notification.error('Por favor, completa todos los campos requeridos.');
        return;
      }

      if (this.isSavingStep1()) return;
      this.isSavingStep1.set(true);

      const payload = this.step1Group.value;
      if (payload.customerType === 'PERSONA_FISICA') {
        delete payload.fiscalIdCard; 
      }
      this.clientService.updateLegalCustomer(this.data.id, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.isSavingStep1.set(false);

            if (response.success) {
              this.notification.success(response.message || 'Cliente actualizado.');
              this.stepper.selectedIndex = 2;
              this.cdr.markForCheck();
            
            } else {
              this.notification.error(response.errors?.[0] || response.message || 'Error al actualizar.');
            }
          },
          error: (err) => {
            this.isSavingStep1.set(false);
            console.error(err);
          }
        });

    } 
    else {
      this.onStep1Next();
    }
  }


}