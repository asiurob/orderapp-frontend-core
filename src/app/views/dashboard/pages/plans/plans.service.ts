import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { IPlan, IPlanInput, IGraphQLResponse } from './plans.interface';
import { NotificationService } from 'src/app/shared/notification/notification.service';

const GET_ALL_PLANS = gql`
  query GetAllPlans {
    getAllPlans {
      success
      message
      data {
        id
        planName
        description
        fixedCost
        percentPerTransaction
        isPublic
        operativeUsers
        locations
        tables
        categories
        products
        kitchens
        metrics
        isActive
      }
    }
  }
`;

const GET_PLAN_BY_ID = gql`
  query GetPlan($id: ID!) {
    getPlan(id: $id) {
      success
      message
      data {
        id
        planName
        description
        fixedCost
        percentPerTransaction
        isPublic
        operativeUsers
        locations
        tables
        categories
        products
        kitchens
        metrics
        isActive

      }
    }
  }
`;

const CREATE_PLAN = gql`
  mutation CreatePlan($input: CreatePlanInput!) {
    createPlan(input: $input) {
      success
      message
      data { id planName }
      errors
    }
  }
`;

const UPDATE_PLAN = gql`
  mutation UpdatePlan($id: ID!, $input: UpdatePlanInput!) {
    updatePlan(id: $id, input: $input) {
      success
      message
      data { id planName }
      errors
    }
  }
`;

const DELETE_PLAN = gql`
  mutation DeletePlan($id: ID!) {
    deletePlan(id: $id) {
      success
      message
      data { id } # O lo que devuelva
    }
  }
`;


@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private _plans = signal<IPlan[]>([]);
  public searchTerm = signal<string>('');
  private notification = inject(NotificationService)

  constructor(private apollo: Apollo) {
    this.loadPlans();
  }

  public filteredPlans = computed(() => {
    const plans = this._plans();
    const term = this.searchTerm().toLowerCase();

    return plans
      .filter(plan => !plan.isDeleted)
      .filter(plan => 
        plan.planName.toLowerCase().includes(term) ||
        plan.description.toLowerCase().includes(term)
      );
  });

  public loadPlans(): void {
    this.apollo.watchQuery< { getAllPlans: IGraphQLResponse<IPlan[]> } >({
      query: GET_ALL_PLANS,
      fetchPolicy: 'network-only'
    })
    .valueChanges.pipe(
      map(result => result.data.getAllPlans)
    )
    .subscribe(response => {
      if (response.success) {
        this._plans.set(response.data);
      } else {
        console.error('Error al cargar planes:', response.message);
      }
    });
  }

  getPlanDetails(id: string) {
    return this.apollo.query< { getPlan: IGraphQLResponse<IPlan> } >({
      query: GET_PLAN_BY_ID,
      variables: { id: id }
    }).pipe(
      map(result => result.data.getPlan)
    );
  }

addPlan(planInput: IPlanInput) {
    this.apollo.mutate< { createPlan: IGraphQLResponse<{id: string}> } >({
      mutation: CREATE_PLAN,
      variables: { input: planInput }
    }).subscribe({
      next: (response) => {
        if (response.data?.createPlan.success) {
          this.notification.success(response.data.createPlan.message);
          this.loadPlans();
        } else {
          const errorMsg = response.data?.createPlan.errors?.[0] || response.data?.createPlan.message || 'Error desconocido al crear.';
          this.notification.error(errorMsg);
        }
      },
      error: (err) => {
        console.error('Error crítico al crear plan:', err);
        this.notification.error('Error de conexión. Intenta de nuevo.');
      }
    });
  }

  updatePlan(id: string, planInput: Partial<IPlanInput>) {
    this.apollo.mutate< { updatePlan: IGraphQLResponse<{id: string}> } >({
      mutation: UPDATE_PLAN,
      variables: { 
        id: id,
        input: planInput 
      }
    }).subscribe({
      next: (response) => {
        if (response.data?.updatePlan.success) {
          this.notification.success('Plan actualizado correctamente.');
          this.loadPlans();
        } else {
          const errorMsg = response.data?.updatePlan.errors?.[0] || response.data?.updatePlan.message || 'Error desconocido al actualizar.';
          this.notification.error(errorMsg);
        }
      },
      error: (err) => {
        console.error('Error crítico al actualizar plan:', err);
        this.notification.error('Error de conexión. No se pudo actualizar.');
      }
    });
  }

  deletePlan(id: string) {
    this.apollo.mutate< { deletePlan: IGraphQLResponse<{id: string}> } >({
      mutation: DELETE_PLAN,
      variables: { id }
    }).subscribe({
      next: (response) => {
        if (response.data?.deletePlan.success) {
          this.notification.success('Plan eliminado correctamente.');
          this.loadPlans();
        } else {
          const errorMsg = response.data?.deletePlan.errors?.[0] || response.data?.deletePlan.message || 'Error desconocido al eliminar.';
          this.notification.error(errorMsg);
        }
      },
      error: (err) => {
        console.error('Error crítico al eliminar plan:', err);
        this.notification.error('Error de conexión. No se pudo eliminar.');
      }
    });
  }
}