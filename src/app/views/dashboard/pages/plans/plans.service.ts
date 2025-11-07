import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { IPlan, IPlanInput, IGraphQLResponse } from './plans.interface';

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
        isDeleted
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
    }).subscribe(response => {
      if (response.data?.createPlan.success) {
        console.log('Plan creado:', response.data.createPlan.message);
        this.loadPlans();
      } else {
        console.error('Error al crear plan:', response.data?.createPlan.errors);
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
    }).subscribe(response => {
      if (response.data?.updatePlan.success) {
        console.log('Plan actualizado:', response.data.updatePlan.message);
        this.loadPlans();
      } else {
        console.error('Error al actualizar plan:', response.data?.updatePlan.errors);
      }
    });
  }

  deletePlan(id: string) {
    this.apollo.mutate< { deletePlan: IGraphQLResponse<{id: string}> } >({
      mutation: DELETE_PLAN,
      variables: { id }
    }).subscribe(response => {
      if (response.data?.deletePlan.success) {
        console.log('Plan borrado:', response.data.deletePlan.message);
        this.loadPlans();
      } else {
        console.error('Error al borrar plan:', response.data?.deletePlan.message);
      }
    });
  }
}