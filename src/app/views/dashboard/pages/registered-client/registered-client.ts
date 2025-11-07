import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectionStrategy, computed, signal, effect, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisteredClientsService,  } from './registered-client.service';
import { IRegisteredClient, IRegisteredClientDetails, IRegisteredClientWithProgress } from './registered-client.interface';

// Importaciones de Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RegistrationDialog } from '../../components/registration-dialog/registration-dialog';

@Component({
  selector: 'ord-core-registered-client',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatTableModule, MatPaginatorModule, MatProgressBarModule,
    MatChipsModule],
  standalone: true,
  templateUrl: './registered-client.html',
  styleUrls: ['./registered-client.scss']
})
export class RegisteredClient implements AfterViewInit {
private clientsSignal: Signal<IRegisteredClientWithProgress[]>;

  displayedColumns: string[] = ['restaurant', 'branchCount', 'client', 'emailPhone', 'docProgress', 'status', 'actions'];
  dataSource = new MatTableDataSource<IRegisteredClientWithProgress>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
      private registeredClientsService: RegisteredClientsService, 
      private dialog: MatDialog
    ) {
    // Conecta al signal filtrado que ya incluye el progreso
    this.clientsSignal = this.registeredClientsService.filteredClients;

    // Reacciona a los cambios en los datos filtrados
    effect(() => {
      this.dataSource.data = this.clientsSignal();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage(); // Reinicia el paginador si los datos cambian
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.registeredClientsService.searchTerm.set(term);
  }

  // Abre el modal para registrar un nuevo cliente
  startOnboarding(): void {
    const dialogRef = this.dialog.open(RegistrationDialog, {
      panelClass: 'registration-dialog-container', // Clase para estilos globales
      width: '90vw',      
      maxWidth: '1400px', 
      height: '85vh',     
      maxHeight: '85vh',  
      disableClose: true,
      data: null // Modo Crear
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Datos recibidos del modal (Crear):', result);
        // TODO: Mapear 'result' (que tiene clientData y restaurantData)
        // a la estructura IRegisteredClient y llamar a addClient del servicio.
        // const newClient: IRegisteredClient = mapResultToClient(result);
        // this.registeredClientsService.addClient(newClient);
      }
    });
  }

  // Abre el modal para editar un cliente existente
  editClient(clientSummary: IRegisteredClientWithProgress): void { 
    this.registeredClientsService.getClientDetailsById(clientSummary.id)
      .subscribe({
        next: (clientDetails: IRegisteredClientDetails | undefined) => { 
          if (!clientDetails) {
            console.error(`Detalles no encontrados para el cliente con ID: ${clientSummary.id}`);
            alert(`Error: No se pudieron cargar los detalles completos para ${clientSummary.restaurantName}.`);
            return; 
          }

          const dialogRef = this.dialog.open(RegistrationDialog, {
            panelClass: 'registration-dialog-container',
            width: '90vw',      
            maxWidth: '1400px', 
            height: '85vh',     
            maxHeight: '85vh',  
            disableClose: true,
            data: clientDetails // Modo Editar, pasa los detalles
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              console.log('Datos guardados desde modal (Editar):', result);
              this.registeredClientsService.updateClient(clientSummary.id, result);
            }
          });
        },
        error: (err) => {
          console.error('Error al obtener detalles del cliente:', err);
          alert(`Error al cargar los detalles para ${clientSummary.restaurantName}. Intenta de nuevo.`);
        }
      });
  }

  // Placeholder para ver detalles (podría abrir el mismo modal en modo solo lectura)
  viewClient(client: IRegisteredClientWithProgress): void { 
    console.log('Ver:', client);
    // Podrías llamar a editClient aquí, y en el modal añadir lógica para deshabilitar campos
  }

  // Devuelve la clase CSS para la barra de progreso
  getProgressClass(client: IRegisteredClientWithProgress): string {
    const progress = client.documentProgress; 
    if (progress >= 90) return 'progress-high';
    else if (progress >= 50) return 'progress-medium';
    else return 'progress-low';
  }
}