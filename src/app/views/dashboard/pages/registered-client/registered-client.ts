import {
  Component,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  computed,
  signal,
  effect,
  Signal
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  RegisteredClientsService
} from './registered-client.service';
import {
  ILegalCustomer,
  IRegisteredClientDetails
} from './registered-client.interface';
import {
  MatFormFieldModule
} from '@angular/material/form-field';
import {
  MatInputModule
} from '@angular/material/input';
import {
  MatButtonModule
} from '@angular/material/button';
import {
  MatIconModule
} from '@angular/material/icon';
import {
  MatTableDataSource,
  MatTableModule
} from '@angular/material/table';
import {
  MatPaginator,
  MatPaginatorModule
} from '@angular/material/paginator';
import {
  MatProgressBarModule
} from '@angular/material/progress-bar';
import {
  MatChipsModule
} from '@angular/material/chips';
import {
  MatDialog
} from '@angular/material/dialog';
import {
  MatTooltipModule
} from '@angular/material/tooltip';
import {
  RegistrationDialog
} from '../../components/registration-dialog/registration-dialog';
import {
  NotificationService
} from 'src/app/shared/notification/notification.service';

@Component({
  selector: 'ord-core-registered-client',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  standalone: true,
  templateUrl: './registered-client.html',
  styleUrls: ['./registered-client.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisteredClient implements AfterViewInit {

  private clientsSignal: Signal < ILegalCustomer[] > ;
  displayedColumns: string[] = ['cliente', 'contacto', 'status', 'actions'];
  dataSource = new MatTableDataSource < ILegalCustomer > ();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private registeredClientsService: RegisteredClientsService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {
    this.clientsSignal = this.registeredClientsService.clientsWithProgress;
    effect(() => {
      this.dataSource.data = this.clientsSignal();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = (data: ILegalCustomer, filter: string) => {
      const dataStr = (
        data.fullName +
        data.rfc +
        data.email +
        data.phone +
        data.status
      ).toLowerCase();
      return dataStr.includes(filter);
    };
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.dataSource.filter = term.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  startOnboarding(): void {
    const dialogRef = this.dialog.open(RegistrationDialog, {
      panelClass: 'registration-dialog-container',
      width: '90vw',
      maxWidth: '1400px',
      height: '85vh',
      maxHeight: '85vh',
      disableClose: true,
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.registeredClientsService.loadClients();
      }
    });
  }

  editClient(clientSummary: ILegalCustomer): void {
    this.registeredClientsService.getClientDetailsById(clientSummary.id)
      .subscribe({
        next: (clientDetails: IRegisteredClientDetails | undefined) => {
          if (!clientDetails) {
            console.error(`Detalles no encontrados para el cliente con ID: ${clientSummary.id}`);
            this.notification.error(`Error: No se pudieron cargar los detalles para ${clientSummary.fullName}.`);
            return;
          }

          const dialogRef = this.dialog.open(RegistrationDialog, {
            panelClass: 'registration-dialog-container',
            width: '90vw',
            maxWidth: '1400px',
            height: '85vh',
            maxHeight: '85vh',
            disableClose: true,
            data: clientDetails
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              console.log('Datos guardados desde modal (Editar):', result);
              this.registeredClientsService.loadClients();
            }
          });
        },
        error: (err) => {
          console.error('Error al obtener detalles del cliente:', err);
          this.notification.error(`Error al cargar los detalles para ${clientSummary.fullName}. Intenta de nuevo.`);
        }
      });
  }

}
