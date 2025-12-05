import {
  Component,
  OnInit,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import {
  MatButtonModule
} from '@angular/material/button';
import {
  MatProgressBarModule
} from '@angular/material/progress-bar';
import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';
import {
  Observable,
  of,
  BehaviorSubject
} from 'rxjs';
import {
  startWith,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  filter,
  tap,
  finalize,
  catchError
} from 'rxjs/operators';
import {
  NotificationService
} from 'src/app/shared/notification/notification.service';
import {
  SuccessInfoDialog
} from 'src/app/shared/success-info-dialog/success-info-dialog';
import { ClientDataStepComponent } from './steps/client-data-step.component';
import { RestaurantDataStepComponent } from './steps/restaurant-data-step.component';
import { DocumentsStepComponent, FileUploadState } from './steps/documents-step.component';
import { RegistrationDialogService } from './registration-dialog.service';
import { GcsUploadService } from 'src/app/shared/services/gcs-upload.service';
type RegistrationData = any;

@Component({
  selector: 'ord-core-registration-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ClientDataStepComponent,
    RestaurantDataStepComponent,
    DocumentsStepComponent
  ],
  standalone: true,
  templateUrl: './registration-dialog.html',
  styleUrls: ['./registration-dialog.scss']
})
export class RegistrationDialog implements OnInit {
  // ========== INJECTIONS (Angular 20) ==========
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RegistrationDialog>);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private registrationService = inject(RegistrationDialogService);
  private gcsUploadService = inject(GcsUploadService);
  private data = inject(MAT_DIALOG_DATA, { optional: true });

  // ========== VIEW CHILDREN ==========
  @ViewChild('stepper') private stepper!: MatStepper;

  // ========== SIGNALS (Angular 20) ==========
  currentStep = signal(0);
  totalSteps = signal(3); // Sin Feenicia
  stepProgress = computed(() => (this.currentStep() + 1) / this.totalSteps() * 100);

  isEditMode = signal(false);
  isSaving = signal(false);
  savingStep = signal<number | null>(null);

  personType = signal<'PERSONA_FISICA' | 'PERSONA_MORAL'>('PERSONA_FISICA');
  newCustomerId = signal<string | null>(null);
  newRestaurantInfo = signal<any>(null);

  // Logo
  logoFile = signal<File | null>(null);
  logoPreview = signal<string | null>(null);
  isUploadingLogo = signal(false);
  logoUrl = signal<string | null>(null);
  initialLogoUrl = signal<string | null>(null); // Logo inicial en modo edición

  // Archivos
  uploadedFiles = signal<Map<string, FileUploadState>>(new Map());
  
  // Valores iniciales para detectar cambios en modo edición
  private initialStep1Values: any = null;
  private initialStep2Values: any = null;

  // Location data
  private stateListSource = new BehaviorSubject<any[]>([]);
  stateOptions$: Observable<any[]> = new Observable<any[]>();
  private municipalityListSource = new BehaviorSubject<any[]>([]);
  municipalityOptions$: Observable<any[]> = new Observable<any[]>();
  private neighborhoodListSource = new BehaviorSubject<any[]>([]);
  neighborhoodOptions$: Observable<any[]> = new Observable<any[]>();
  planOptions$: Observable<any[]> = new Observable<any[]>();

  // ========== FORMS ==========
  step1Group!: FormGroup;
  step2Group!: FormGroup;
  step3Group!: FormGroup;

  // Signals para reactividad de formularios
  private step1Valid = signal(false);
  private step2Valid = signal(false);

  // ========== COMPUTED SIGNALS ==========
  canGoNext = computed(() => {
    const step = this.currentStep();
    if (step === 0) {
      return this.step1Valid();
    }
    if (step === 1) {
      return this.step2Valid();
    }
    return true; // Step 3 (documentos) es opcional
  });

  isLastStep = computed(() => this.currentStep() === this.totalSteps() - 1);
  isFirstStep = computed(() => this.currentStep() === 0);

  buttonLabel = computed(() => {
    if (this.isLastStep()) return 'Finalizar Registro';
    return 'Siguiente';
  });

  dialogTitle = computed(() => {
    if (!this.isEditMode()) {
      return 'Nuevo Cliente';
    }
    const clientName = this.data?.clientData?.fullName || '';
    const restaurantName = this.data?.restaurantData?.commercialName || '';
    if (clientName && restaurantName) {
      return `Editando a ${clientName} (${restaurantName})`;
    }
    return 'Editar Registro';
  });

  constructor() {
    this.isEditMode.set(!!this.data);

    // Effect para auto-navegación en modo creación
    effect(() => {
      if (!this.isEditMode() && this.canGoNext() && !this.isSaving()) {
        // Auto-avance se maneja manualmente por ahora
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
    
    if (this.isEditMode() && this.data) {
      this.loadEditData();
    }

    this.setupFormListeners();
    this.cdr.markForCheck();
  }

  // ========== INITIALIZATION ==========
  private initializeForms(): void {
    this.step1Group = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      email: ['', [Validators.required, Validators.email]],
      rfc: ['', Validators.required],
      status: ['PENDING', Validators.required],
      customerType: ['PERSONA_FISICA', Validators.required],
      legalRepresentativeFirstName: ['', Validators.required],
      legalRepresentativeLastName: ['', Validators.required],
      legalRepresentativeSecondLastName: ['', Validators.required],
      fiscalIdCard: [''],
      planId: ['', Validators.required],
      stateId: [null]
    });

    this.step2Group = this.fb.group({
      postalCodeId: [null],
      municipalityId: [null],
      neighborhoodId: [null],
      commercialName: ['', Validators.required],
      branch: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      state: [null, Validators.required],
      municipality: [null, Validators.required],
      neighborhood: [null, Validators.required],
      street: ['', Validators.required],
      exteriorNumber: ['', Validators.required],
      interiorNumber: ['']
    });

    this.step3Group = this.fb.group({});
  }

  private loadInitialData(): void {
    this.planOptions$ = this.registrationService.getPlansForSelect();
    this.loadAllStates();
    this.setupPostalCodeListener();
    this.setupStateListener();
    this.setupMunicipalityListener();
    this.setupNeighborhoodListener();
  }

  private loadEditData(): void {
    if (this.data?.clientData) {
      const clientData = { ...this.data.clientData };
      this.step1Group.patchValue(clientData);
      this.personType.set(this.step1Group.get('customerType')?.value || 'PERSONA_FISICA');
      
      // Guardar valores iniciales para detectar cambios
      this.initialStep1Values = { ...clientData };
      
      // Cargar logo si existe
      if (this.data.clientData.logoUrl) {
        this.logoUrl.set(this.data.clientData.logoUrl);
        this.initialLogoUrl.set(this.data.clientData.logoUrl);
      }
    }

    if (this.data?.restaurantData) {
      const r = this.data.restaurantData;
      
      // Mover planId y stateId al step1Group
      if (r.plan?.id) {
        this.step1Group.patchValue({ planId: r.plan.id });
        if (!this.initialStep1Values) this.initialStep1Values = {};
        this.initialStep1Values.planId = r.plan.id;
      }
      if (r.stateId) {
        this.step1Group.patchValue({ stateId: r.stateId });
        if (!this.initialStep1Values) this.initialStep1Values = {};
        this.initialStep1Values.stateId = r.stateId;
      }
      
      // Obtener código postal desde neighborhood o postalCode directo
      const postalCodeValue = r.neighborhood?.postalCode?.code || '';
      
      // Preparar valores para patchValue, usando IDs directamente para los selects
      const restaurantValues: any = {
        commercialName: r.commercialName || '',
        branch: r.branch || '',
        street: r.street || '',
        exteriorNumber: r.exteriorNumber || '',
        interiorNumber: r.interiorNumber || '',
        postalCode: postalCodeValue,
        state: r.stateId || null, // Para mat-select usamos el ID directamente
        municipality: r.municipalityId || null, // Para mat-select usamos el ID directamente
        neighborhood: r.neighborhoodId || null, // Para mat-select usamos el ID directamente
        postalCodeId: r.neighborhood?.postalCode?.id || null,
        municipalityId: r.municipalityId || null,
        neighborhoodId: r.neighborhoodId || null
      };
      
      // Guardar valores iniciales para detectar cambios
      this.initialStep2Values = { ...restaurantValues };
      
      // Deshabilitar campos no editables en modo edición
      this.step2Group.get('commercialName')?.disable();
      this.step2Group.get('branch')?.disable();
      
      // Primero cargar estados para que el select funcione
      this.loadAllStates();
      
      // Cargar municipios si hay stateId
      if (r.stateId) {
        this.step2Group.get('municipality')?.enable();
        this.registrationService.getMunicipalitiesByState(r.stateId).subscribe(munis => {
          this.municipalityListSource.next(munis);
          
          // Cargar colonias si hay municipalityId
          if (r.municipalityId) {
            this.step2Group.get('neighborhood')?.enable();
            this.registrationService.getNeighborhoodsByMunicipality(r.municipalityId).subscribe(cols => {
              this.neighborhoodListSource.next(cols);
              
              // Ahora sí hacer patchValue cuando todas las listas estén cargadas
              this.step2Group.patchValue(restaurantValues, { emitEvent: false });
              
              // Deshabilitar código postal si viene de la colonia
              if (postalCodeValue) {
                this.step2Group.get('postalCode')?.disable({ emitEvent: false });
              }
            });
          } else {
            // Si no hay municipalityId, hacer patchValue de todos modos
            this.step2Group.patchValue(restaurantValues, { emitEvent: false });
          }
        });
      } else {
        // Si no hay stateId, hacer patchValue de todos modos
        this.step2Group.patchValue(restaurantValues, { emitEvent: false });
      }
      
      // Cargar logo si viene en el restaurante
      if (r.logo) {
        this.logoUrl.set(r.logo);
        this.logoPreview.set(r.logo);
        this.initialLogoUrl.set(r.logo);
      }
    }
  }

  private setupFormListeners(): void {
    this.step1Group.get('customerType')?.valueChanges.subscribe(value => {
      this.personType.set(value);
      this.updateValidators(value);
    });

    // Escuchar cambios en los formularios para actualizar canGoNext
    this.step1Group.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.step1Valid.set(this.step1Group.valid);
        this.cdr.markForCheck();
      });

    this.step2Group.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.step2Valid.set(this.step2Group.valid);
        this.cdr.markForCheck();
      });

    // Inicializar valores
    this.step1Valid.set(this.step1Group.valid);
    this.step2Valid.set(this.step2Group.valid);
  }

  // ========== NAVIGATION ==========
  handleStepAction(): void {
    if (this.isLastStep()) {
      this.finalizeRegistration();
      return;
    }

    if (this.isEditMode() && this.currentStep() < 2) {
      this.saveAndContinue(this.currentStep());
    } else {
      this.goToNextStep();
    }
  }

  goToNextStep(): void {
    if (!this.canGoNext()) {
      this.markCurrentStepAsTouched();
      return;
    }

    const nextStep = Math.min(this.currentStep() + 1, this.totalSteps() - 1);
    this.currentStep.set(nextStep);
    
    if (this.stepper) {
      this.stepper.selectedIndex = nextStep;
    }
    this.cdr.markForCheck();
  }

  goToPreviousStep(): void {
    const prevStep = Math.max(0, this.currentStep() - 1);
    this.currentStep.set(prevStep);
    
    if (this.stepper) {
      this.stepper.selectedIndex = prevStep;
    }
    this.cdr.markForCheck();
  }

  onStepChange(selectedIndex: number): void {
    this.currentStep.set(selectedIndex);
    this.cdr.markForCheck();
  }

  private markCurrentStepAsTouched(): void {
    const step = this.currentStep();
    if (step === 0) {
      this.step1Group.markAllAsTouched();
      this.notification.error('Por favor, completa todos los campos requeridos del paso 1.');
    } else if (step === 1) {
      this.step2Group.markAllAsTouched();
      this.notification.error('Por favor, completa todos los campos requeridos del paso 2.');
    }
  }

  // ========== LOGO HANDLING ==========
  onLogoSelected(file: File): void {
    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.notification.error('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notification.error('El logo no debe exceder 5MB');
      return;
    }

    // Solo guardar el archivo y mostrar preview (NO obtener config todavía)
    this.logoFile.set(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onLogoRemoved(): void {
    this.logoFile.set(null);
    this.logoPreview.set(null);
    this.logoUrl.set(null);
  }

  // ========== FILE HANDLING ==========
  onFileSelected(event: { file: File; docName: string }): void {
    const { file, docName } = event;
    
    const fileState: FileUploadState = {
      file,
      uploadProgress: 0,
      docName
    };

    this.uploadedFiles.update(files => {
      const newMap = new Map(files);
      newMap.set(docName, fileState);
      return newMap;
    });

    // TODO: Implementar upload usando Signed URLs
    // Por ahora solo guardamos la referencia
    this.notification.success(`Archivo "${file.name}" seleccionado para ${docName}`);
  }

  // ========== STEP ACTIONS ==========
  private saveAndContinue(step: number): void {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    this.savingStep.set(step);

    if (step === 0) {
      this.saveStep1();
    } else if (step === 1) {
      this.saveStep2();
    }
  }

  private saveStep1(): void {
    // En ambos modos (creación y edición), solo validar y continuar
    // La actualización se hará en finalizeRegistration
    if (this.step1Group.valid) {
      this.goToNextStep();
    } else {
      this.markCurrentStepAsTouched();
    }
  }

  private saveStep2(): void {
    const formValues = this.step2Group.getRawValue();
    
    // Validar selects (ahora usan IDs directamente) solo en modo creación
    if (!this.isEditMode()) {
      if (!formValues.state) {
        this.isSaving.set(false);
        this.savingStep.set(null);
        this.notification.error('Por favor, selecciona un Estado válido de la lista.');
        return;
      }
      if (!formValues.municipality) {
        this.isSaving.set(false);
        this.savingStep.set(null);
        this.notification.error('Por favor, selecciona un Municipio válido de la lista.');
        return;
      }
    }

    // En ambos modos (creación y edición), solo validar y continuar
    // La actualización se hará en finalizeRegistration
    if (this.step2Group.valid || this.isEditMode()) {
      this.goToNextStep();
    } else {
      this.markCurrentStepAsTouched();
    }
  }

  private finalizeRegistration(): void {
    // En modo edición, detectar cambios y actualizar solo lo modificado
    if (this.isEditMode()) {
      // Verificar si hay cambios
      const step1Changes = this.getStep1Changes(this.transformStep1ToPayload());
      const step2Changes = this.getStep2Changes(this.transformStep2ToPayload(this.step2Group.getRawValue()));
      const logoChanged = this.hasLogoChanged();
      
      // Si no hay cambios, solo cerrar
      if (Object.keys(step1Changes).length === 0 && 
          Object.keys(step2Changes).length === 0 && 
          !logoChanged) {
        this.dialogRef.close(true);
        return;
      }
      
      // Si hay cambios, actualizar encadenado (igual que creación)
      this.isSaving.set(true);
      this.savingStep.set(null);
      
      // Paso 1: Subir logo si cambió (ignorar ID, ya existe)
      let logoUploadObservable: Observable<string | null> = of(null);
      
      if (logoChanged) {
        const logoFile = this.logoFile();
        const initialLogo = this.initialLogoUrl();
        const currentLogo = this.logoUrl();
        
        if (logoFile) {
          // Logo nuevo seleccionado - subir
          this.isUploadingLogo.set(true);
          logoUploadObservable = this.registrationService.getClientLogoUploadConfig({
            contentType: logoFile.type,
            originalName: logoFile.name
          }).pipe(
            switchMap((uploadConfig) => {
              return this.gcsUploadService.uploadFile(uploadConfig.signedUrl, logoFile).pipe(
                filter((progress): progress is null => progress === null),
                map(() => {
                  const bucketName = 'orderapp-public-assets';
                  return `https://storage.googleapis.com/${bucketName}/${uploadConfig.finalPath}`;
                })
              );
            }),
            catchError((error) => {
              this.isUploadingLogo.set(false);
              throw new Error(`Error al subir el logo: ${error.message || 'Error desconocido'}`);
            }),
            finalize(() => {
              this.isUploadingLogo.set(false);
            })
          );
        } else if (initialLogo && !currentLogo) {
          // Logo fue removido, enviar null
          step1Changes.logo = null;
        }
      }
      
      // Paso 2: Encadenar actualizaciones
      logoUploadObservable.pipe(
        switchMap((logoUrl) => {
          // Agregar logo URL a los cambios si existe
          if (logoUrl) {
            step1Changes.logo = logoUrl;
          }
          
          // Actualizar cliente solo si hay cambios
          let clientUpdate$: Observable<any> = of({ success: true });
          if (Object.keys(step1Changes).length > 0 && this.data?.id) {
            clientUpdate$ = this.registrationService.updateLegalCustomer(this.data.id, step1Changes);
          }
          
          return clientUpdate$.pipe(
            switchMap((clientResponse: any) => {
              if (clientResponse.success === false) {
                throw new Error(clientResponse.errors?.[0] || clientResponse.message || 'Error al actualizar cliente');
              }
              
              // Actualizar valores iniciales después de guardar
              if (Object.keys(step1Changes).length > 0) {
                this.initialStep1Values = { ...this.initialStep1Values, ...step1Changes };
              }
              
              // Actualizar restaurante solo si hay cambios (usar mutation específica para core)
              let restaurantUpdate$: Observable<any> = of({ success: true });
              if (Object.keys(step2Changes).length > 0 && this.data?.restaurantData?.id) {
                // Filtrar solo campos de ubicación para la mutation de core
                const locationChanges: any = {};
                if (step2Changes.street !== undefined) locationChanges.street = step2Changes.street;
                if (step2Changes.exteriorNumber !== undefined) locationChanges.exteriorNumber = step2Changes.exteriorNumber;
                if (step2Changes.interiorNumber !== undefined) locationChanges.interiorNumber = step2Changes.interiorNumber;
                if (step2Changes.neighborhoodId !== undefined) locationChanges.neighborhoodId = step2Changes.neighborhoodId;
                if (step2Changes.municipalityId !== undefined) locationChanges.municipalityId = step2Changes.municipalityId;
                if (step2Changes.stateId !== undefined) locationChanges.stateId = step2Changes.stateId;
                if (step2Changes.postalCodeId !== undefined) locationChanges.postalCodeId = step2Changes.postalCodeId;
                
                if (Object.keys(locationChanges).length > 0) {
                  restaurantUpdate$ = this.registrationService.updateRestaurantLocationByCore(this.data.restaurantData.id, locationChanges);
                }
              }
              
              return restaurantUpdate$;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSaving.set(false);
          this.savingStep.set(null);
        })
      ).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Actualizar valores iniciales
            if (Object.keys(step2Changes).length > 0) {
              this.initialStep2Values = { ...this.initialStep2Values, ...step2Changes };
            }
            this.notification.success('Cambios guardados exitosamente.');
            this.dialogRef.close(true);
          } else {
            this.notification.error(response.errors?.[0] || response.message || 'Error al actualizar.');
          }
        },
        error: (err) => {
          this.notification.error(err.message || 'Error al completar la actualización.');
        }
      });
      
      return;
    }

    // En modo creación, crear cliente y restaurante en secuencia
    if (this.isSaving()) return;

    this.isSaving.set(true);
    this.savingStep.set(null);

    const clientPayload = this.transformStep1ToPayload();
    const formValues = this.step2Group.getRawValue();
    
    // Validar que step2 esté completo
    if (!this.step2Group.valid) {
      this.isSaving.set(false);
      this.notification.error('Por favor, completa todos los campos requeridos del paso 2.');
      return;
    }

    // Validar selects (ahora usan IDs directamente)
    if (!formValues.state) {
      this.isSaving.set(false);
      this.notification.error('Por favor, selecciona un Estado válido de la lista.');
      return;
    }
    if (!formValues.municipality) {
      this.isSaving.set(false);
      this.notification.error('Por favor, selecciona un Municipio válido de la lista.');
      return;
    }

    const restaurantPayload = this.transformStep2ToPayload(formValues);
    const logoFile = this.logoFile();

    // Encadenar: 1) Obtener config y subir logo (si existe) → 2) Crear cliente → 3) Crear restaurante
    let logoUploadObservable: Observable<string | null>;

    if (logoFile) {
      // Si hay logo, obtener config de upload y luego subirlo
      this.isUploadingLogo.set(true);
      logoUploadObservable = this.registrationService.getClientLogoUploadConfig({
        contentType: logoFile.type,
        originalName: logoFile.name
      }).pipe(
        switchMap((uploadConfig) => {
          // Subir el archivo usando la signed URL
          return this.gcsUploadService.uploadFile(uploadConfig.signedUrl, logoFile).pipe(
            filter((progress): progress is null => progress === null), // Solo cuando termine
            map(() => {
              // Construir URL pública del logo
              const bucketName = 'orderapp-public-assets';
              return `https://storage.googleapis.com/${bucketName}/${uploadConfig.finalPath}`;
            })
          );
        }),
        catchError((error) => {
          this.isUploadingLogo.set(false);
          throw new Error(`Error al subir el logo: ${error.message || 'Error desconocido'}`);
        }),
        finalize(() => {
          this.isUploadingLogo.set(false);
        })
      );
    } else {
      // Si no hay logo, continuar con null (el backend creará el cliente sin logo)
      logoUploadObservable = of(null);
    }

    logoUploadObservable.pipe(
      switchMap((logoUrl) => {
        // Agregar logo URL al payload del cliente si existe
        if (logoUrl) {
          clientPayload.logo = logoUrl;
        }

        // Crear cliente legal (con o sin logo, el backend lo maneja)
        return this.registrationService.createLegalCustomer(clientPayload).pipe(
          switchMap((clientResponse: any) => {
            if (!clientResponse.success || !clientResponse.data?.id) {
              throw new Error(clientResponse.errors?.[0] || clientResponse.message || 'Error al crear cliente');
            }
            
            // Guardar el ID del cliente creado
            this.newCustomerId.set(clientResponse.data.id);
            
            // Crear restaurante con el ID del cliente
            return this.registrationService.createRestaurant({ 
              ...restaurantPayload, 
              legalCustomerId: clientResponse.data.id 
            });
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSaving.set(false);
        this.savingStep.set(null);
      })
    ).subscribe({
      next: (restaurantResponse: any) => {
        if (restaurantResponse.success && restaurantResponse.data && restaurantResponse.ownerInfo) {
          this.notification.success('¡Cliente y Restaurante creados exitosamente!');
          this.newRestaurantInfo.set(restaurantResponse);
          
          const successDialogRef = this.dialog.open(SuccessInfoDialog, {
            width: '500px',
            disableClose: true,
            data: {
              title: '¡Registro Completado Exitosamente!',
              message: 'El cliente y restaurante han sido registrados. Estos son los datos de acceso para el dueño.',
              icon: 'store',
              username: restaurantResponse.ownerInfo.username,
              temporaryPassword: restaurantResponse.ownerInfo.temporaryPassword,
              workspaceUrl: restaurantResponse.ownerInfo.workspaceUrl
            }
          });

          successDialogRef.afterClosed().subscribe(() => {
            this.dialogRef.close(true);
          });
        } else {
          this.notification.error(restaurantResponse.errors?.[0] || restaurantResponse.message || 'Error al crear restaurante.');
        }
      },
      error: (err) => {
        this.notification.error(err.message || 'Error al completar el registro.');
      }
    });
  }

  // ========== PAYLOAD TRANSFORMERS ==========
  private transformStep1ToPayload(): any {
    const payload = { ...this.step1Group.value };
    if (payload.customerType === 'PERSONA_FISICA') {
      delete payload.fiscalIdCard;
    }
    
    // Construir fullName concatenando nombre + apellido paterno + apellido materno
    const firstName = (payload.legalRepresentativeFirstName || '').trim();
    const lastName = (payload.legalRepresentativeLastName || '').trim();
    const secondLastName = (payload.legalRepresentativeSecondLastName || '').trim();
    payload.fullName = [firstName, lastName, secondLastName]
      .filter(name => name.length > 0)
      .join(' ');
    
    // Remover planId y stateId del payload del cliente (van en el restaurante)
    delete payload.planId;
    delete payload.stateId;
    
    // El logo se agregará en finalizeRegistration después de subirlo
    
    return payload;
  }

  private transformStep2ToPayload(formValues: any): any {
    const payload = {
      ...formValues,
      planId: this.step1Group.get('planId')?.value, // Tomar planId del step1Group
      stateId: formValues.state, // Ahora state es directamente el ID
      municipalityId: formValues.municipality, // Ahora municipality es directamente el ID
    };
    
    // Limpiar campos que ya no necesitamos
    delete payload.state;
    delete payload.municipality;
    delete payload.neighborhood;
    delete payload.postalCode;
    
    return payload;
  }

  // ========== LOCATION HANDLERS ==========
  onStateSelected(stateId: string): void {
    if (stateId) {
      this.step2Group.patchValue({
        stateId: stateId,
        municipality: null,
        neighborhood: null,
        municipalityId: null,
        neighborhoodId: null,
        postalCode: null
      });
      this.step2Group.get('municipality')?.enable();

      this.registrationService.getMunicipalitiesByState(stateId).subscribe(munis => {
        this.municipalityListSource.next(munis);
      });
    } else {
      this.municipalityListSource.next([]);
    }
  }

  onMunicipalitySelected(municipalityId: string): void {
    if (municipalityId) {
      this.step2Group.patchValue({
        municipalityId: municipalityId,
        neighborhood: null,
        neighborhoodId: null,
        postalCode: null
      });
      this.step2Group.get('neighborhood')?.enable();

      this.registrationService.getNeighborhoodsByMunicipality(municipalityId).subscribe(colonias => {
        this.neighborhoodListSource.next(colonias);
      });
    } else {
      this.step2Group.patchValue({
        neighborhood: null,
        neighborhoodId: null
      });
    }
  }

  onNeighborhoodSelected(neighborhoodId: string): void {
    if (neighborhoodId) {
      this.step2Group.patchValue({
        neighborhoodId: neighborhoodId
      });
      
      // Obtener el código postal desde el neighborhoodId usando el servicio
      // Primero intentar obtenerlo desde las opciones actuales
      this.neighborhoodOptions$.pipe(
        takeUntilDestroyed(this.destroyRef),
        map(neighborhoods => neighborhoods.find((n: any) => n.id === neighborhoodId))
      ).subscribe(selectedNeighborhood => {
        if (selectedNeighborhood?.postalCode?.code) {
          const cpControl = this.step2Group.get('postalCode');
          if (cpControl && cpControl.value !== selectedNeighborhood.postalCode.code) {
            cpControl.patchValue(selectedNeighborhood.postalCode.code, { emitEvent: false });
            if (selectedNeighborhood.postalCode.id) {
              this.step2Group.get('postalCodeId')?.setValue(selectedNeighborhood.postalCode.id);
            }
            cpControl.disable({ emitEvent: false });
          }
        }
      });
    }
  }

  // ========== LOCATION SETUP ==========
  private loadAllStates(): void {
    this.registrationService.getAllStates()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(states => states.map(s => ({ id: s.id, name: s.name })))
      )
      .subscribe(mappedStates => {
        if (mappedStates && mappedStates.length > 0) {
          this.stateListSource.next(mappedStates);
        }
      });
  }

  private setupPostalCodeListener(): void {
    const cpControl = this.step2Group.get('postalCode');
    if (!cpControl) return;

    cpControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(cpValue => {
        if (cpValue && cpValue.length === 5) {
          this.step2Group.get('state')?.disable();
          this.step2Group.get('municipality')?.disable();
          this.step2Group.get('neighborhood')?.disable();
          return this.registrationService.getLocationByPostalCode(cpValue);
        } else {
          return of({ success: false, message: 'Modo Manual', data: null, errors: [] });
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response.success && response.data) {
        const data = response.data;
        const stateId = data.state?.id;
        const municipalityId = data.municipality?.id;
        
        if (!stateId || !municipalityId) {
          this.notification.error('Error al obtener la ubicación. Por favor, selecciona manualmente.');
          return;
        }

        // Primero cargar los municipios del estado para que el select tenga las opciones
        this.registrationService.getMunicipalitiesByState(stateId)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            map(municipalities => municipalities.map(m => ({ id: m.id, name: m.name })))
          )
          .subscribe(municipalities => {
            // Actualizar las opciones de municipios
            this.municipalityListSource.next(municipalities);
            
            // Ahora sí podemos hacer el patchValue
            this.step2Group.get('neighborhood')?.enable();
            this.step2Group.patchValue({
              state: stateId,
              municipality: municipalityId,
              postalCodeId: data.zipCode?.id,
              stateId: stateId,
              municipalityId: municipalityId,
              neighborhood: null,
              neighborhoodId: null,
              street: '',
              exteriorNumber: '',
              interiorNumber: ''
            }, { emitEvent: false });
            
            // Mapear las colonias al formato esperado
            const neighborhoods = (data.neighborhoods || []).map((n: any) => ({
              id: n.id,
              name: n.value || n.name
            }));
            this.neighborhoodOptions$ = of(neighborhoods);
            
            this.step2Group.get('state')?.disable({ emitEvent: false });
            this.step2Group.get('municipality')?.disable({ emitEvent: false });
            this.cdr.markForCheck();
          });
      } else {
        this.step2Group.get('state')?.enable();
        this.step2Group.get('municipality')?.enable();
        this.step2Group.get('neighborhood')?.enable();

        if (response.message !== 'Modo Manual') {
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
          this.neighborhoodOptions$ = of([]);
        }
      }
    });
  }

  private setupStateListener(): void {
    // Para mat-select, simplemente retornamos la lista completa de estados
    this.stateOptions$ = this.stateListSource.asObservable();
  }

  private setupMunicipalityListener(): void {
    // Para mat-select, simplemente retornamos la lista completa de municipios
    this.municipalityOptions$ = this.municipalityListSource.asObservable();
  }

  private setupNeighborhoodListener(): void {
    // Para mat-select, simplemente retornamos la lista completa de colonias
    this.neighborhoodOptions$ = this.neighborhoodListSource.asObservable();
  }

  // ========== VALIDATORS ==========
  private updateValidators(customerType: 'PERSONA_FISICA' | 'PERSONA_MORAL'): void {
    const fiscalIdCard = this.step1Group.get('fiscalIdCard');
    if (customerType === 'PERSONA_MORAL') {
      fiscalIdCard?.setValidators([Validators.required]);
    } else {
      fiscalIdCard?.clearValidators();
    }
    fiscalIdCard?.updateValueAndValidity();
  }

  // ========== CHANGE DETECTION ==========
  /**
   * Detecta cambios en step1 comparando valores actuales con iniciales
   */
  private getStep1Changes(currentValues: any): any {
    if (!this.initialStep1Values) return currentValues;
    
    const changes: any = {};
    const current = { ...currentValues };
    const initial = { ...this.initialStep1Values };
    
    // Comparar cada campo
    Object.keys(current).forEach(key => {
      // Comparar valores, manejando null/undefined
      const currentVal = current[key];
      const initialVal = initial[key];
      
      // Normalizar para comparación
      const currentNormalized = currentVal === null || currentVal === undefined ? '' : String(currentVal).trim();
      const initialNormalized = initialVal === null || initialVal === undefined ? '' : String(initialVal).trim();
      
      if (currentNormalized !== initialNormalized) {
        changes[key] = currentVal;
      }
    });
    
    return changes;
  }

  /**
   * Detecta cambios en step2 comparando valores actuales con iniciales
   */
  private getStep2Changes(currentValues: any): any {
    if (!this.initialStep2Values) return currentValues;
    
    const changes: any = {};
    const current = { ...currentValues };
    const initial = { ...this.initialStep2Values };
    
    // Excluir campos no editables
    delete current.commercialName;
    delete current.branch;
    delete initial.commercialName;
    delete initial.branch;
    
    // Comparar cada campo
    Object.keys(current).forEach(key => {
      // Comparar valores, manejando null/undefined
      const currentVal = current[key];
      const initialVal = initial[key];
      
      // Normalizar para comparación
      const currentNormalized = currentVal === null || currentVal === undefined ? '' : String(currentVal).trim();
      const initialNormalized = initialVal === null || initialVal === undefined ? '' : String(initialVal).trim();
      
      if (currentNormalized !== initialNormalized) {
        changes[key] = currentVal;
      }
    });
    
    return changes;
  }

  /**
   * Detecta si el logo cambió
   */
  private hasLogoChanged(): boolean {
    const currentLogo = this.logoUrl();
    const initialLogo = this.initialLogoUrl();
    
    // Si hay un nuevo archivo seleccionado, cambió
    if (this.logoFile()) {
      return true;
    }
    
    // Si se removió el logo (había uno y ahora no)
    if (initialLogo && !currentLogo) {
      return true;
    }
    
    // Si el URL cambió
    if (currentLogo !== initialLogo) {
      return true;
    }
    
    return false;
  }

  // ========== DIALOG ACTIONS ==========
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
