import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  constructor() { }

  //TODO: método enviaría todos los datos a la API.
  submitOnboardingForm(formData: any): void {
    console.log('--- ENVIANDO FORMULARIO COMPLETO ---');
    console.log(formData);

  }
}