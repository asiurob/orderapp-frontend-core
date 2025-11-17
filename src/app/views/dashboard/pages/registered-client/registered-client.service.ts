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
  of
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
   data { id fullName rfc customerType status email phone } 
   errors 
  } 
 }
`;

// Para el Lápiz (Editar Step 1)
const GET_LEGAL_CUSTOMER_BY_ID = gql `
  query GetLegalCustomer($id: ID!) { 
    getLegalCustomer(id: $id) { 
      success message data { 
        id fullName rfc customerType status email phone 
        legalRepresentativeFirstName legalRepresentativeLastName 
        legalRepresentativeSecondLastName bankAccount bankInstitution fiscalIdCard
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
      success message data { id fullName email phone status } errors 
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
        this.notification.error(response.errors ?. [0] || response.message || 'Error al cargar clientes.');
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
    return this.apollo.query < {
      getLegalCustomer: IGraphQLResponse < ILegalCustomer >
    } > ({
      query: GET_LEGAL_CUSTOMER_BY_ID,
      variables: {
        id
      },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => {
        if (result.data ?.getLegalCustomer.success) {
          const customerData = result.data.getLegalCustomer.data;
          const details: IRegisteredClientDetails = {
            id: customerData.id,
            clientData: customerData, // Step 1
            restaurantData: null, // Step 2 (vacío)
            uploadedDocuments: [], // Step 3 (vacío)
            status: customerData.status
          };
          return details;
        }
        this.notification.error(result.data ?.getLegalCustomer.message || 'Error al cargar el cliente.');
        return undefined;
      }),
      catchError((err) => {
        this.notification.error('Error de red al cargar cliente.');
        console.error(err);
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
        console.error("Error de Apollo en createLegalCustomer:", err);
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
        console.error("Error de Apollo en updateLegalCustomer:", err);
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
        console.error("Error de Apollo en createRestaurant:", err);
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
        console.error("Error de Apollo en getAllStates:", err);
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
        console.error("Error de Apollo en getMunicipalitiesByState:", err);
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
        console.error("Error de Apollo en getNeighborhoodsByMunicipality:", err);
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
        console.error("Error de Apollo en getLocationByPostalCode:", err);
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
        console.error("Error de Apollo en searchStates:", err);
        this.notification.error('Error al buscar estados.');
        return of([]);
      })
    );
  }
}
