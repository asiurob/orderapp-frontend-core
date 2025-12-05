import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-restaurant-data-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './restaurant-data-step.component.html',
  styleUrls: ['./restaurant-data-step.component.scss']
})
export class RestaurantDataStepComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() isEditMode = false;
  @Input() planOptions$!: Observable<any[]>;
  @Input() stateOptions$!: Observable<any[]>;
  @Input() municipalityOptions$!: Observable<any[]>;
  @Input() neighborhoodOptions$!: Observable<any[]>;
  
  @Output() stateSelected = new EventEmitter<string>();
  @Output() municipalitySelected = new EventEmitter<string>();
  @Output() neighborhoodSelected = new EventEmitter<string>();

  onStateChange(event: any): void {
    const stateId = event.value;
    if (stateId) {
      this.stateSelected.emit(stateId);
    }
  }

  onMunicipalityChange(event: any): void {
    const municipalityId = event.value;
    if (municipalityId) {
      this.municipalitySelected.emit(municipalityId);
    }
  }

  onNeighborhoodChange(event: any): void {
    const neighborhoodId = event.value;
    if (neighborhoodId) {
      this.neighborhoodSelected.emit(neighborhoodId);
    }
  }
}

