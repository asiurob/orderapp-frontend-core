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
import { ConfirmDialog } from 'src/app/shared/confirm-dialog/confirm-dialog';
import { SuccessInfoDialog } from 'src/app/shared/success-info-dialog/success-info-dialog';

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
      disableClose: false,
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
            this.notification.error(`Error: No se pudieron cargar los detalles para ${clientSummary.fullName}.`);
            return;
          }

          const dialogRef = this.dialog.open(RegistrationDialog, {
            panelClass: 'registration-dialog-container',
            width: '90vw',
            maxWidth: '1400px',
            height: '85vh',
            maxHeight: '85vh',
            disableClose: false,
            data: clientDetails
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.registeredClientsService.loadClients();
            }
          });
        },
        error: (err) => {
          this.notification.error(`Error al cargar los detalles para ${clientSummary.fullName}. Intenta de nuevo.`);
        }
      });
  }

  resetPassword(client: ILegalCustomer): void {
    if (!client.ownerUser || !client.ownerUser.id) {
      return;
    }

    // 2. Confirmación
    const confirmRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Restablecer Contraseña',
        message: `¿Estás seguro de reiniciar la contraseña para el usuario ${client.ownerUser.username}? Se generará una nueva contraseña temporal.`,
        confirmText: 'Sí, Reiniciar',
        confirmColor: 'warn'
      }
    });

    confirmRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.registeredClientsService.resetPassword(client.ownerUser!.id).subscribe(response => {
          if (response.success && response.data) {
            this.dialog.open(SuccessInfoDialog, {
              width: '500px',
              data: {
                title: 'Contraseña Restablecida',
                message: 'La contraseña del usuario ha sido reiniciada correctamente.',
                icon: 'lock_reset',

                username: response.data.username,
                temporaryPassword: response.data.temporaryPassword,
                workspaceUrl: null
              }
            });

          } else {
          }
        });
      }
    });
  }
}
