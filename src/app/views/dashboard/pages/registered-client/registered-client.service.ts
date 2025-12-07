import {
  Injectable,
  signal,
  computed
} from '@angular/core';
import {
  HttpClient
} from '@angular/common/http';
import {
  Observable,
  map,
  find,
  tap,
  catchError,
  of ,
  forkJoin
} from 'rxjs';
import {
  // ¡Asegúrate de tener TODAS las interfaces!
  IRegisteredClientDetails,
  ILegalCustomer // ¡Esta es la que usa la tabla!
} from './registered-client.interface';
import {
  NotificationService
} from '../../../../shared/notification/notification.service';
import {
  gql,
  Apollo
} from 'apollo-angular';
import {
  IGraphQLResponse
} from '../plans/plans.interface';

const REQUIRED_DOCS_FISICA = ["INE", "CIF", "Comprobante Domicilio", "Estado Cuenta", "KYC"];
const REQUIRED_DOCS_MORAL = ["Acta Constitutiva", "RPC", "Poder Legal", "ID Rep Legal", "CIF Empresa", "Comprobante Domicilio", "Estado Cuenta", "KYC"];

// Para la Tabla (Step 0)
const GET_ALL_LEGAL_CUSTOMERS = gql `
  query GetAllLegalCustomers { 
    getAllLegalCustomers(input: {}) { 
      success 
      message 
      data { 
        id fullName rfc customerType status email phone 
        ownerUser { id username firstName lastName } 
      } 
      errors 
    } 
  }
`;

// Para el Lápiz (Editar - solo campos necesarios)
const GET_LEGAL_CUSTOMER_BY_ID = gql `
  query GetLegalCustomer($id: ID!) { 
    getLegalCustomer(id: $id) { 
      success message data { 
        id 
        fullName 
        rfc 
        customerType 
        status 
        email 
        phone 
        legalRepresentativeFirstName 
        legalRepresentativeLastName 
        legalRepresentativeSecondLastName 
        fiscalIdCard
        logo
        brandColor
      } errors 
    } 
  }
`;

// Para el Modal (Crear Step 1)
const CREATE_LEGAL_CUSTOMER = gql `
 mutation CreateLegalCustomer($input: CreateLegalCustomerInput!) { 
  createLegalCustomer(input: $input) { 
   success message data { id fullName rfc status } errors 
  } 
 }
`;

// Para el Modal (Editar Step 1)
const UPDATE_LEGAL_CUSTOMER = gql `
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

// Para el Modal (Crear Step 2)
const CREATE_RESTAURANT = gql `
  mutation CreateRestaurant($input: CreateRestaurantInput!) { 
    createRestaurant(input: $input) { 
      success message 
      data { id commercialName branch workspaceSlug } 
      ownerInfo { username temporaryPassword workspaceUrl } 
      errors 
    } 
  }
`;

// Para el Modal (Step 2 - Direcciones)
const GET_LOCATION_BY_POSTAL_CODE = gql `
 query GetLocationByPostalCode($code: String!) { 
  getLocationByPostalCode(code: $code) { 
   success message data { 
    zipCode { id value } 
    municipality { id value } 
    state { id value } 
    neighborhoods { id value } 
   } errors 
  } 
 }
`;

const GET_ALL_STATES = gql `
 query GetAllStates { 
  getAllStates { success message data { id name code } errors } 
 }
`;

const GET_MUNICIPALITIES_BY_STATE = gql `
 query GetMunicipalitiesByState($stateId: ID!) { 
  getMunicipalitiesByState(stateId: $stateId) { 
      success message data { id name } errors 
    } 
 }
`;

const GET_NEIGHBORHOODS_BY_MUNICIPALITY = gql `
  query GetNeighborhoodsByMunicipality($municipalityId: ID!) { 
    getNeighborhoodsByMunicipality(municipalityId: $municipalityId) { 
      success message data { id name postalCode { id code } } errors 
    } 
  }
`;

// (¡Esta ya no la usamos porque precargamos, pero la dejamos por si las moscas!)
const SEARCH_STATES = gql `
 query SearchStates($search: String!) { 
  searchStates(search: $search) { success message data { id name code } errors } 
 }
`;

const GET_RESTAURANTS_BY_LEGAL_CUSTOMER = gql `
  query GetRestaurantsByLegalCustomer($input: GetRestaurantsByLegalCustomerInput!) {
    getRestaurantsByLegalCustomer(input: $input) {
      success
      message
      data {
        id
        commercialName
        branch
        street
        exteriorNumber
        interiorNumber
        stateId
        municipalityId
        neighborhoodId
        neighborhood {
          postalCode {
            id
            code
          }
        }
        plan {
          id
        }
        logo
      }
      errors
    }
  }
`;

const UPDATE_RESTAURANT = gql `
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

const RESET_PASSWORD_BY_ADMIN = gql `
  mutation ResetPasswordByAdmin($id: ID!) { 
    resetPasswordByAdmin(id: $id) { 
      success 
      message 
      data { 
        id 
        username 
        temporaryPassword 
        # No necesitamos más campos para el modal
      } 
      errors 
    } 
  }
`;


@Injectable({
  providedIn: 'root'
})
export class RegisteredClientsService {
  private _clients = signal < ILegalCustomer[] > ([]);
  public searchTerm = signal < string > ('');

  public clientsWithProgress = computed(() => {
    const clients = this._clients();
    return clients.map(client => ({
      ...client,
      documentProgress: this.calculateProgress(client)
    }));
  });

  public filteredClients = computed(() => {
    const clients = this.clientsWithProgress();
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return clients;
    }
    return clients.filter(c =>
      c.fullName.toLowerCase().includes(term) ||
      c.rfc.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  constructor(
    private http: HttpClient,
    private apollo: Apollo,
    private notification: NotificationService
  ) {
    this.loadClients();
  }

  // --- MÉTODOS PARA LA TABLA ---

  public loadClients(): void { // ¡Lo hacemos público para recargar!
    this.apollo.query < {
      getAllLegalCustomers: IGraphQLResponse < ILegalCustomer[] >
    } > ({
      query: GET_ALL_LEGAL_CUSTOMERS,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.getAllLegalCustomers)
    ).subscribe(response => {
      if (response.success) {
        this._clients.set(response.data);
      } else {
        this.notification.error(response.errors ?.[0] || response.message || 'Error al cargar clientes.');
      }
    });
  }

  private calculateProgress(client: ILegalCustomer): number {
    if (client.status === 'ACTIVE') return 100;
    if (client.status === 'PENDING') return 30;
    return 10;
  }

  // --- MÉTODOS PARA EL MODAL ---

  getClientDetailsById(id: string): Observable < IRegisteredClientDetails | undefined > {
    const customerRequest = this.apollo.query < {
      getLegalCustomer: IGraphQLResponse < ILegalCustomer >
    } > ({
      query: GET_LEGAL_CUSTOMER_BY_ID,
      variables: {
        id
      },
      fetchPolicy: 'network-only'
    });
    const restaurantRequest = this.apollo.query < {
      getRestaurantsByLegalCustomer: IGraphQLResponse < any[] >
    } > ({
      query: GET_RESTAURANTS_BY_LEGAL_CUSTOMER,
      variables: {
        input: {
          legalCustomerId: id
        }
      },
      fetchPolicy: 'network-only'
    });
    return forkJoin([customerRequest, restaurantRequest]).pipe(
      map(([customerRes, restaurantRes]) => {

        if (!customerRes.data ?.getLegalCustomer.success) {
          this.notification.error(customerRes.data ?.getLegalCustomer.message || 'Error al cargar cliente.');
          return undefined;
        }
        const customerData = customerRes.data.getLegalCustomer.data;

        let restaurantData = null;
        if (restaurantRes.data ?.getRestaurantsByLegalCustomer.success) {
          const restaurants = restaurantRes.data.getRestaurantsByLegalCustomer.data;
          if (restaurants && restaurants.length > 0) {
            restaurantData = restaurants[0];
          }
        }

        const details: IRegisteredClientDetails = {
          id: customerData.id,
          clientData: customerData,
          restaurantData: restaurantData,
          uploadedDocuments: [],
          status: customerData.status
        };

        return details;
      }),
      catchError((err) => {
        this.notification.error('Error de red al cargar detalles.');
        return of(undefined);
      })
    );
  }

  createLegalCustomer(input: any): Observable < IGraphQLResponse < any >> {
    return this.apollo.mutate < {
      createLegalCustomer: IGraphQLResponse < any >
    } > ({
      mutation: CREATE_LEGAL_CUSTOMER,
      variables: {
        input
      }
    }).pipe(
      map(result => result.data!.createLegalCustomer),
      catchError((err: any) => {
        this.notification.error('Error de conexión. No se pudo guardar el cliente.');
        return of({
          success: false,
          message: "Error de red",
          data: null,
          errors: [err.message]
        });
      })
    );
  }

  updateLegalCustomer(id: string, input: any): Observable < IGraphQLResponse < any >> {
    return this.apollo.mutate < {
      updateLegalCustomer: IGraphQLResponse < any >
    } > ({
      mutation: UPDATE_LEGAL_CUSTOMER,
      variables: {
        id: id,
        input: input
      }
    }).pipe(
      map(result => result.data!.updateLegalCustomer),
      catchError((err: any) => {
        this.notification.error('Error de conexión. No se pudo actualizar el cliente.');
        return of({
          success: false,
          message: "Error de red",
          data: null,
          errors: [err.message]
        });
      })
    );
  }

  createRestaurant(input: any): Observable < IGraphQLResponse < any >> {
    return this.apollo.mutate < {
      createRestaurant: IGraphQLResponse < any >
    } > ({
      mutation: CREATE_RESTAURANT,
      variables: {
        input
      }
    }).pipe(
      map(result => result.data!.createRestaurant),
      catchError((err: any) => {
        this.notification.error('Error de conexión. No se pudo crear el restaurante.');
        return of({
          success: false,
          message: "Error de red",
          data: null,
          errors: [err.message]
        });
      })
    );
  }

  // --- MÉTODOS DE DIRECCIÓN ---

  getAllStates(): Observable < any[] > {
    return this.apollo.query < {
      getAllStates: IGraphQLResponse < any[] >
    } > ({
      query: GET_ALL_STATES,
      fetchPolicy: 'cache-first'
    }).pipe(
      map(result => (result.data.getAllStates.success ? result.data.getAllStates.data : [])),
      catchError((err: any) => {
        this.notification.error('Error al cargar la lista de estados.');
        return of([]);
      })
    );
  }

  getMunicipalitiesByState(stateId: string): Observable < any[] > {
    return this.apollo.query < {
      getMunicipalitiesByState: IGraphQLResponse < any[] >
    } > ({
      query: GET_MUNICIPALITIES_BY_STATE,
      variables: {
        stateId
      },
      fetchPolicy: 'no-cache'
    }).pipe(
      map(result => (result.data.getMunicipalitiesByState.success ? result.data.getMunicipalitiesByState.data : [])),
      catchError((err: any) => {
        this.notification.error('Error al cargar municipios.');
        return of([]);
      })
    );
  }

  getNeighborhoodsByMunicipality(municipalityId: string): Observable < any[] > {
    return this.apollo.query < {
      getNeighborhoodsByMunicipality: IGraphQLResponse < any[] >
    } > ({
      query: GET_NEIGHBORHOODS_BY_MUNICIPALITY,
      variables: {
        municipalityId
      },
      fetchPolicy: 'no-cache'
    }).pipe(
      map(result => (result.data.getNeighborhoodsByMunicipality.success ? result.data.getNeighborhoodsByMunicipality.data : [])),
      catchError((err: any) => {
        this.notification.error('Error al cargar colonias.');
        return of([]);
      })
    );
  }

  getLocationByPostalCode(code: string): Observable < IGraphQLResponse < any >> {
    return this.apollo.query < {
      getLocationByPostalCode: IGraphQLResponse < any >
    } > ({
      query: GET_LOCATION_BY_POSTAL_CODE,
      variables: {
        code
      },
      fetchPolicy: 'no-cache'
    }).pipe(
      map(result => result.data.getLocationByPostalCode),
      catchError((err: any) => {
        this.notification.error('Error de red buscando C.P.');
        return of({
          success: false,
          message: "Error de red",
          data: null,
          errors: [err.message]
        });
      })
    );
  }

  searchStates(search: string): Observable < any[] > {
    return this.apollo.query < {
      searchStates: IGraphQLResponse < any[] >
    } > ({
      query: SEARCH_STATES,
      variables: {
        search
      },
      fetchPolicy: 'no-cache'
    }).pipe(
      map(result => (result.data.searchStates.success ? result.data.searchStates.data : [])),
      catchError((err: any) => {
        this.notification.error('Error al buscar estados.');
        return of([]);
      })
    );
  }

  updateRestaurant(id: string, input: any): Observable < IGraphQLResponse < any >> {
    return this.apollo.mutate < {
      updateRestaurant: IGraphQLResponse < any >
    } > ({
      mutation: UPDATE_RESTAURANT,
      variables: {
        id: id,
        input: input
      }
    }).pipe(
      map(result => result.data!.updateRestaurant),
      catchError((err: any) => {
        this.notification.error('Error de conexión. No se pudo actualizar el restaurante.');
        return of({
          success: false,
          message: "Error de red",
          data: null,
          errors: [err.message]
        });
      })
    );
  }

  resetPassword(userId: string): Observable < IGraphQLResponse < any >> {
    return this.apollo.mutate < {
      resetPasswordByAdmin: IGraphQLResponse < any >
    } > ({
      mutation: RESET_PASSWORD_BY_ADMIN,
      variables: {
        id: userId
      }
    }).pipe(
      map(result => result.data!.resetPasswordByAdmin),
      catchError((err: any) => {
        this.notification.error('Error de conexión. No se pudo resetear la contraseña.');
        return of({
          success: false,
          message: "Error de red",
          data: null,
          errors: [err.message]
        });
      })
    );
  }
}
