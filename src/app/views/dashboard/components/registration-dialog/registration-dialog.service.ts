import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IGraphQLResponse } from '../../pages/plans/plans.interface';

const GET_CLIENT_LOGO_UPLOAD_CONFIG = gql`
  mutation GetClientLogoUploadConfig($file: FileInput!) {
    getClientLogoUploadConfig(file: $file) {
      signedUrl
      finalPath
      objectId
    }
  }
`;

const CREATE_LEGAL_CUSTOMER = gql`
  mutation CreateLegalCustomer($input: CreateLegalCustomerInput!) {
    createLegalCustomer(input: $input) {
      success
      message
      data {
        id
        fullName
        rfc
        status
      }
      errors
    }
  }
`;

const UPDATE_LEGAL_CUSTOMER = gql`
  mutation UpdateLegalCustomer($id: ID!, $input: UpdateLegalCustomerInput!) {
    updateLegalCustomer(id: $id, input: $input) {
      success
      message
      data {
        id
        fullName
        email
        phone
        status
      }
      errors
    }
  }
`;

const CREATE_RESTAURANT = gql`
  mutation CreateRestaurant($input: CreateRestaurantInput!) {
    createRestaurant(input: $input) {
      success
      message
      data {
        id
        commercialName
        branch
        workspaceSlug
      }
      ownerInfo {
        username
        temporaryPassword
        workspaceUrl
      }
      errors
    }
  }
`;

const UPDATE_RESTAURANT = gql`
  mutation UpdateRestaurant($id: ID!, $input: UpdateRestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      success
      message
      data {
        id
        commercialName
        status
      }
      errors
    }
  }
`;

const UPDATE_RESTAURANT_LOCATION_BY_CORE = gql`
  mutation UpdateRestaurantLocationByCore($id: ID!, $input: UpdateRestaurantLocationByCoreInput!) {
    updateRestaurantLocationByCore(id: $id, input: $input) {
      success
      message
      data {
        id
        commercialName
        status
      }
      errors
    }
  }
`;

const GET_ALL_STATES = gql`
  query GetAllStates {
    getAllStates {
      success
      message
      data {
        id
        name
        code
      }
      errors
    }
  }
`;

const GET_MUNICIPALITIES_BY_STATE = gql`
  query GetMunicipalitiesByState($stateId: ID!) {
    getMunicipalitiesByState(stateId: $stateId) {
      success
      message
      data {
        id
        name
      }
      errors
    }
  }
`;

const GET_NEIGHBORHOODS_BY_MUNICIPALITY = gql`
  query GetNeighborhoodsByMunicipality($municipalityId: ID!) {
    getNeighborhoodsByMunicipality(municipalityId: $municipalityId) {
      success
      message
      data {
        id
        name
        postalCode {
          id
          code
        }
      }
      errors
    }
  }
`;

const GET_LOCATION_BY_POSTAL_CODE = gql`
  query GetLocationByPostalCode($code: String!) {
    getLocationByPostalCode(code: $code) {
      success
      message
      data {
        zipCode {
          id
          value
        }
        municipality {
          id
          value
        }
        state {
          id
          value
        }
        neighborhoods {
          id
          value
        }
      }
      errors
    }
  }
`;

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

export interface FileInput {
  contentType: string;
  originalName: string;
}

export interface ClientLogoUploadConfig {
  signedUrl: string;
  finalPath: string;
  objectId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationDialogService {
  private apollo = inject(Apollo);

  /**
   * Obtiene la configuración de upload para el logo del cliente
   * @param file - Información del archivo (contentType y originalName)
   * @returns Observable con la configuración de upload (signedUrl, finalPath, objectId)
   */
  getClientLogoUploadConfig(file: FileInput): Observable<ClientLogoUploadConfig> {
    return this.apollo.mutate<{
      getClientLogoUploadConfig: ClientLogoUploadConfig;
    }>({
      mutation: GET_CLIENT_LOGO_UPLOAD_CONFIG,
      variables: {
        file: {
          contentType: file.contentType,
          originalName: file.originalName
        }
      }
    }).pipe(
      map(result => {
        if (!result?.data?.getClientLogoUploadConfig) {
          throw new Error('No se recibió la configuración de upload');
        }
        return result.data.getClientLogoUploadConfig;
      }),
      catchError(error => {
        return throwError(() => new Error(`Error al obtener configuración: ${error.message || 'Error desconocido'}`));
      })
    );
  }

  /**
   * Crea un nuevo cliente legal
   * @param input - Datos del cliente legal a crear (CreateLegalCustomerInput)
   * @returns Observable con la respuesta de la mutación GraphQL
   */
  createLegalCustomer(input: any): Observable<IGraphQLResponse<any>> {
    return this.apollo.mutate<{
      createLegalCustomer: IGraphQLResponse<any>;
    }>({
      mutation: CREATE_LEGAL_CUSTOMER,
      variables: { input }
    }).pipe(
      map(result => result.data!.createLegalCustomer),
      catchError((err: any) => {
        return of({
          success: false,
          message: 'Error de red',
          data: null,
          errors: [err.message]
        } as IGraphQLResponse<any>);
      })
    );
  }

  /**
   * Actualiza un cliente legal existente
   * @param id - ID del cliente legal a actualizar
   * @param input - Datos parciales a actualizar (UpdateLegalCustomerInput)
   * @returns Observable con la respuesta de la mutación GraphQL
   */
  updateLegalCustomer(id: string, input: any): Observable<IGraphQLResponse<any>> {
    return this.apollo.mutate<{
      updateLegalCustomer: IGraphQLResponse<any>;
    }>({
      mutation: UPDATE_LEGAL_CUSTOMER,
      variables: { id, input }
    }).pipe(
      map(result => result.data!.updateLegalCustomer),
      catchError((err: any) => {
        return of({
          success: false,
          message: 'Error de red',
          data: null,
          errors: [err.message]
        } as IGraphQLResponse<any>);
      })
    );
  }

  /**
   * Crea un nuevo restaurante
   * @param input - Datos del restaurante a crear (CreateRestaurantInput)
   * @returns Observable con la respuesta de la mutación GraphQL, incluyendo información del usuario OWNER creado
   */
  createRestaurant(input: any): Observable<IGraphQLResponse<any>> {
    return this.apollo.mutate<{
      createRestaurant: IGraphQLResponse<any>;
    }>({
      mutation: CREATE_RESTAURANT,
      variables: { input }
    }).pipe(
      map(result => result.data!.createRestaurant),
      catchError((err: any) => {
        return of({
          success: false,
          message: 'Error de red',
          data: null,
          errors: [err.message]
        } as IGraphQLResponse<any>);
      })
    );
  }

  /**
   * Actualiza un restaurante existente (desde risto con JWT)
   * @param id - ID del restaurante a actualizar
   * @param input - Datos parciales a actualizar (UpdateRestaurantInput)
   * @returns Observable con la respuesta de la mutación GraphQL
   */
  updateRestaurant(id: string, input: any): Observable<IGraphQLResponse<any>> {
    return this.apollo.mutate<{
      updateRestaurant: IGraphQLResponse<any>;
    }>({
      mutation: UPDATE_RESTAURANT,
      variables: { id, input }
    }).pipe(
      map(result => result.data!.updateRestaurant),
      catchError((err: any) => {
        return of({
          success: false,
          message: 'Error de red',
          data: null,
          errors: [err.message]
        } as IGraphQLResponse<any>);
      })
    );
  }

  /**
   * Actualiza solo la ubicación de un restaurante (desde core con Auth0)
   * Solo permite actualizar campos de ubicación (dirección, estado, municipio, colonia, código postal)
   * @param id - ID del restaurante a actualizar
   * @param input - Datos de ubicación a actualizar (UpdateRestaurantLocationByCoreInput)
   * @returns Observable con la respuesta de la mutación GraphQL
   */
  updateRestaurantLocationByCore(id: string, input: any): Observable<IGraphQLResponse<any>> {
    return this.apollo.mutate<{
      updateRestaurantLocationByCore: IGraphQLResponse<any>;
    }>({
      mutation: UPDATE_RESTAURANT_LOCATION_BY_CORE,
      variables: { id, input }
    }).pipe(
      map(result => result.data!.updateRestaurantLocationByCore),
      catchError((err: any) => {
        return of({
          success: false,
          message: 'Error de red',
          data: null,
          errors: [err.message]
        } as IGraphQLResponse<any>);
      })
    );
  }

  /**
   * Obtiene todos los estados de México
   * @returns Observable con array de estados (id, name, code)
   */
  getAllStates(): Observable<any[]> {
    return this.apollo.query<{
      getAllStates: IGraphQLResponse<any[]>;
    }>({
      query: GET_ALL_STATES,
      fetchPolicy: 'cache-first'
    }).pipe(
      map(result => result.data.getAllStates.success ? result.data.getAllStates.data : []),
      catchError((err: any) => {
        return of([]);
      })
    );
  }

  /**
   * Obtiene los municipios por estado
   * @param stateId - ID del estado
   * @returns Observable con array de municipios (id, name)
   */
  getMunicipalitiesByState(stateId: string): Observable<any[]> {
    return this.apollo.query<{
      getMunicipalitiesByState: IGraphQLResponse<any[]>;
    }>({
      query: GET_MUNICIPALITIES_BY_STATE,
      variables: { stateId },
      fetchPolicy: 'no-cache'
    }).pipe(
      map(result => result.data.getMunicipalitiesByState.success ? result.data.getMunicipalitiesByState.data : []),
      catchError((err: any) => {
        return of([]);
      })
    );
  }

  /**
   * Obtiene las colonias por municipio
   * @param municipalityId - ID del municipio
   * @returns Observable con array de colonias (id, name, postalCode)
   */
  getNeighborhoodsByMunicipality(municipalityId: string): Observable<any[]> {
    return this.apollo.query<{
      getNeighborhoodsByMunicipality: IGraphQLResponse<any[]>;
    }>({
      query: GET_NEIGHBORHOODS_BY_MUNICIPALITY,
      variables: { municipalityId },
      fetchPolicy: 'no-cache'
    }).pipe(
      map(result => result.data.getNeighborhoodsByMunicipality.success ? result.data.getNeighborhoodsByMunicipality.data : []),
      catchError((err: any) => {
        return of([]);
      })
    );
  }

  /**
   * Obtiene la ubicación completa (estado, municipio, colonias) por código postal
   * @param code - Código postal (5 dígitos)
   * @returns Observable con la respuesta GraphQL conteniendo estado, municipio y colonias
   */
  getLocationByPostalCode(code: string): Observable<IGraphQLResponse<any>> {
    return this.apollo.query<{
      getLocationByPostalCode: IGraphQLResponse<any>;
    }>({
      query: GET_LOCATION_BY_POSTAL_CODE,
      variables: { code }
    }).pipe(
      map(result => result.data.getLocationByPostalCode),
      catchError((err: any) => {
        return of({
          success: false,
          message: 'Error de red',
          data: null,
          errors: [err.message]
        } as IGraphQLResponse<any>);
      })
    );
  }

  /**
   * Obtiene los planes activos para el select
   * @returns Observable con array de planes activos (id, name)
   */
  getPlansForSelect(): Observable<{ id: string; name: string }[]> {
    return this.apollo.query<{
      getAllPlans: IGraphQLResponse<any[]>;
    }>({
      query: GET_ALL_PLANS,
      fetchPolicy: 'cache-first'
    }).pipe(
      map(result => {
        if (result.data?.getAllPlans.success) {
          return result.data.getAllPlans.data
            .filter(plan => plan.isActive === true)
            .map(plan => ({
              id: plan.id,
              name: plan.planName
            }));
        }
        return [];
      }),
      catchError((err) => {
        return of([]);
      })
    );
  }
}
