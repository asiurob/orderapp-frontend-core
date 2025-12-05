import { Component, Signal, inject, DestroyRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HeaderState } from './header-state.service';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '@auth0/auth0-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs/operators';


@Component({
  selector: 'ord-core-header',
  imports: [MatIconModule, MatButtonModule, MatToolbarModule, CommonModule, MatBadgeModule, MatTooltipModule],
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  isSystemActive: Signal<boolean>;
  notificationCount: Signal<number>;

  // Signal para el nombre del usuario - usando toSignal para convertir el observable directamente
  userName: Signal<string>;

  private auth = inject(AuthService);
  private doc = inject(DOCUMENT);

  constructor(public appState: HeaderState) {
    this.isSystemActive = this.appState.isSystemActive;
    this.notificationCount = this.appState.notificationCount;

    // Convertir el observable directamente a signal usando toSignal
    // Esto evita ExpressionChangedAfterItHasBeenCheckedError
    this.userName = toSignal(
      this.auth.user$.pipe(
        map(user => {
          let name = '';
          if (user?.name) {
            name = user.name;
          } else if (user?.email) {
            name = user.email.split('@')[0];
          } else if (user?.nickname) {
            name = user.nickname;
          } else {
            name = 'Usuario';
          }
          // Convertir a CapitalCase (primera letra mayúscula, resto minúsculas)
          return this.toCapitalCase(name);
        })
      ),
      { initialValue: 'Usuario' } // Valor inicial para evitar undefined
    );
  }

  private toCapitalCase(str: string): string {
    if (!str) return 'Usuario';
    // Convertir cada palabra a CapitalCase (primera letra mayúscula, resto minúsculas)
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  logout(): void {
    this.auth.logout({ 
      logoutParams: { 
        returnTo: this.doc.location.origin 
      } 
    });
  }
}