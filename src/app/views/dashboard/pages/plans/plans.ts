import { Component, ChangeDetectionStrategy, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlansService } from './plans.service';
import { IPlan } from './plans.interface';
import { MatDialog } from '@angular/material/dialog';
import { PlanDialog, PlanDialogData } from '../../components/plan-dialog/plan-dialog';

// Importaciones de Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [
    CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCardModule, MatChipsModule, MatListModule, MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './plans.html',
  styleUrls: ['./plans.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans {
  public plans: Signal<IPlan[]>;

  constructor(
    private plansService: PlansService,
    private dialog: MatDialog
  ) {
    this.plans = this.plansService.filteredPlans;
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.plansService.searchTerm.set(term);
  }

  // Función para formatear los límites (ej. 10, 5, o "Ilimitados")
  formatLimit(limit: number): string {
    if (limit === -1) {
      return 'Ilimitados';
    }
    return limit.toString();
  }
    
  openPlanDialog(plan?: IPlan): void {
      if (plan) {
        this._openDialog({ plan: plan, isViewOnly: false });
      } else {
        // --- MODO CREAR ---
        this._openDialog({ isViewOnly: false });
      }
    }

    viewPlanDialog(plan: IPlan): void {
      this.plansService.getPlanDetails(plan.id).subscribe(response => {
          if (response.success) {
            this._openDialog({ plan: response.data, isViewOnly: true });
          }
        });
    }

    private _openDialog(data: PlanDialogData): void {
      const dialogRef = this.dialog.open(PlanDialog, {
        width: '800px',
        disableClose: true,
        data: data 
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          if (result.isDeleteAction) {

            this.plansService.deletePlan(result.planId);
          } 

          else if (data.plan) { 
            this.plansService.updatePlan(data.plan.id, result);
          } else { 
            this.plansService.addPlan(result);
          }
          }
        });
      }
  }