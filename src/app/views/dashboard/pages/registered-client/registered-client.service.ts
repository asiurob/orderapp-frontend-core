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
  tap,
  catchError,
  of
} from 'rxjs';
import {
  ILegalCustomer,
  IRegisteredClientDetails,
  ILegalCustomerWithProgress
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

const GET_ALL_LEGAL_CUSTOMERS = gql`
  query GetAllLegalCustomers { 
    getAllLegalCustomers(input: {}) { 
      success 
      message 
      data { 
        id 
        fullName 
        rfc 
        customerType 
        status 
        email 
        phone
      } 
      errors 
    } 
  }
`;

const CREATE_LEGAL_CUSTOMER = gql `
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

const GET_LOCATION_BY_POSTAL_CODE = gql`
  query GetLocationByPostalCode($code: String!) { 
    getLocationByPostalCode(code: $code) { 
      success 
      message 
      data { 
        zipCode { id value } 
        municipality { id value } 
        state { id value } 
        neighborhoods { id value } 
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
      data { id name code } 
      errors 
    } 
  }
`;

const GET_MUNICIPALITIES_BY_STATE = gql`
  query GetMunicipalitiesByState($stateId: ID!) { 
    getMunicipalitiesByState(stateId: $stateId) { 
      success 
      message 
      data { id name } 
      errors 
    } 
  }
`;

const SEARCH_STATES = gql`
  query SearchStates($search: String!) { 
    searchStates(search: $search) { 
      success 
      message 
      data { id name code } 
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

@Injectable({
  providedIn: 'root'
})
export class RegisteredClientsService {
  private _clients = signal<ILegalCustomer[]>([]);

  public searchTerm = signal < string > ('');
  public clientsWithProgress = computed(() => {
   const clients = this._clients();
   return clients.map(client => ({
     ...client,
     documentProgress: this.calculateProgress(client as any)
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
    private notification: NotificationService) {
    this.loadClients();
  }

  loadClients(): void {
   this.apollo.query< { getAllLegalCustomers: IGraphQLResponse<ILegalCustomer[]> } >({
      query: GET_ALL_LEGAL_CUSTOMERS,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.getAllLegalCustomers)
    ).subscribe(response => {
      if (response.success) {
        this._clients.set(response.data);
      } else {
        this.notification.error(response.errors?.[0] || response.message || 'Error al cargar clientes.');
      }
    });
 }

  private calculateProgress(client: ILegalCustomer): number {
    console.warn("¡La lógica de 'calculateProgress' está rota! El back no envía 'uploadedDocuments'.");
    if (client.status === 'ACTIVE') return 100;
    if (client.status === 'PENDING') return 30;
    return 0;
 }

  getClientDetailsById(id: string): Observable < IRegisteredClientDetails | undefined > {
    return this.http.get < IRegisteredClientDetails[] > ('assets/data/client-details.json')
      .pipe(
        map(clientsArray =>
          clientsArray.find(client => client.id === id)
        ),
        map(clientDetails => {
          if (clientDetails) {
            return clientDetails;
          }
          return undefined;
        }),
        tap(client => {
          if (!client) {
            console.warn(`Cliente con ID ${id} no encontrado en client-details.json`);
          }
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

  updateClient(id: string, updatedData: any): void {
    console.log(`Simulando actualización del cliente ${id}`, updatedData);
  }

  getLocationByPostalCode(code: string): Observable<IGraphQLResponse<any>> {
    return this.apollo.query< { getLocationByPostalCode: IGraphQLResponse<any> } >({
      query: GET_LOCATION_BY_POSTAL_CODE,
      variables: { code },
      fetchPolicy: 'no-cache'
    }).pipe(
      map(result => result.data.getLocationByPostalCode),
      catchError((err: any) => {
        console.error("Error de Apollo en getLocationByPostalCode:", err);
        this.notification.error('Error de red buscando C.P.');
        return of({ success: false, message: "Error de red", data: null, errors: [err.message] });
      })
    );
  }

  searchStates(search: string): Observable<any[]> {
    return this.apollo.query< { searchStates: IGraphQLResponse<any[]> } >({
      query: SEARCH_STATES,
      variables: { search },
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

  getMunicipalitiesByState(stateId: string): Observable<any[]> {
    return this.apollo.query< { getMunicipalitiesByState: IGraphQLResponse<any[]> } >({
      query: GET_MUNICIPALITIES_BY_STATE,
      variables: { stateId },
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

  getAllStates(): Observable<any[]> {
    return this.apollo.query< { getAllStates: IGraphQLResponse<any[]> } >({
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

  getNeighborhoodsByMunicipality(municipalityId: string): Observable<any[]> {
      return this.apollo.query< { getNeighborhoodsByMunicipality: IGraphQLResponse<any[]> } >({
        query: GET_NEIGHBORHOODS_BY_MUNICIPALITY,
        variables: { municipalityId },
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

createRestaurant(input: any): Observable<IGraphQLResponse<any>> {
    return this.apollo.mutate< { createRestaurant: IGraphQLResponse<any> } >({
      mutation: CREATE_RESTAURANT,
      variables: { input }
    }).pipe(
      map(result => result.data!.createRestaurant),
      catchError((err: any) => {
        console.error("Error de Apollo en createRestaurant:", err);
        this.notification.error('Error de conexión. No se pudo crear el restaurante.');
        return of({ success: false, message: "Error de red", data: null, errors: [err.message] });
      })
    );
  }

}


