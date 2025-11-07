import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, find, tap } from 'rxjs';
import { IRegisteredClient, IRegisteredClientDetails, IRegisteredClientWithProgress } from './registered-client.interface';

const REQUIRED_DOCS_FISICA = ["INE", "CIF", "Comprobante Domicilio", "Estado Cuenta", "KYC"];
const REQUIRED_DOCS_MORAL = ["Acta Constitutiva", "RPC", "Poder Legal", "ID Rep Legal", "CIF Empresa", "Comprobante Domicilio", "Estado Cuenta", "KYC"];

@Injectable({
  providedIn: 'root'
})
export class RegisteredClientsService {
  // Signal interno con los datos base
  private _clients = signal<IRegisteredClient[]>([]); 
  
  // Signal para el término de búsqueda
  public searchTerm = signal<string>('');

  // Signal computado que añade el progreso calculado
  public clientsWithProgress = computed(() => {
      const clients = this._clients();
      return clients.map(client => ({
          ...client,
          documentProgress: this.calculateProgress(client) 
      }));
  });

  // Signal computado para la lista filtrada (usa la lista con progreso)
  public filteredClients = computed(() => {
    const clients = this.clientsWithProgress(); 
    const term = this.searchTerm().toLowerCase();

    if (!term) {
      return clients; 
    }

    return clients.filter(c => 
      c.restaurantName.toLowerCase().includes(term) ||
      c.clientName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  constructor(private http: HttpClient) {
    this.loadClients();
  }

  // Carga los datos iniciales (sin progreso)
  private loadClients(): void {
    this.http.get<IRegisteredClient[]>('assets/data/registered-client.json')
      .subscribe(data => {
        this._clients.set(data);
      });
  }

  // Calcula el porcentaje de documentos
  private calculateProgress(client: IRegisteredClient): number {
      const requiredDocs = client.personType === 'fisica' ? REQUIRED_DOCS_FISICA : REQUIRED_DOCS_MORAL;
      const uploadedCount = client.uploadedDocuments?.length || 0;
      
      if (!requiredDocs || requiredDocs.length === 0) {
          return 100; 
      }
      
      const progress = Math.round((uploadedCount / requiredDocs.length) * 100);
      return Math.min(progress, 100); 
  }

  // Obtiene detalles completos (incluyendo cálculo de progreso si es necesario)
  getClientDetailsById(id: string): Observable<IRegisteredClientDetails | undefined> {
    return this.http.get<IRegisteredClientDetails[]>('assets/data/client-details.json')
      .pipe(
        map(clientsArray => 
          clientsArray.find(client => client.id === id) 
        ),
        map(clientDetails => {
            // Si encontramos el cliente, recalculamos el progreso por si acaso
            if (clientDetails) {
                // Asumimos que clientDetails.clientData tiene personType y uploadedDocuments
                // Necesitamos asegurar que IRegisteredClientDetails incluya estos campos o adaptar
                // const progress = this.calculateProgress(clientDetails as any); // Adaptar tipo si es necesario
                // return { ...clientDetails, documentProgress: progress }; 
                return clientDetails; // Por ahora, devolvemos sin recalcular aquí
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

  // Método para añadir (simulado)
  addClient(client: IRegisteredClient): void {
     // Aquí deberías recibir los datos del formulario de onboarding
     // y construir el objeto IRegisteredClient antes de añadirlo
     this._clients.update(current => [client, ...current]);
  }

  // Método para actualizar (simulado)
  updateClient(id: string, updatedData: any): void {
      console.log(`Simulando actualización del cliente ${id}`, updatedData);
      // Aquí podrías implementar la lógica para actualizar el signal _clients
      // o recargar la lista con this.loadClients();
  }
}