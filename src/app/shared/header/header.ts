import { Component, Signal, Inject } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HeaderState } from './header-state.service';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '@auth0/auth0-angular';
import { MatDividerModule } from '@angular/material/divider';


@Component({
  selector: 'ord-core-header',
  imports: [MatSelectModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatMenuModule, MatToolbarModule, CommonModule, MatBadgeModule, MatDividerModule],
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
isSystemActive: Signal<boolean>;
notificationCount: Signal<number>;

  userMenuItems = [
    { icon: 'person', label: 'Mi Perfil' },
    { icon: 'settings', label: 'Configuración' },
    { icon: 'logout', label: 'Cerrar Sesión' }
  ];

  constructor(
    public appState: HeaderState,
    private auth: AuthService,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.isSystemActive = this.appState.isSystemActive;
    this.notificationCount = this.appState.notificationCount;
  }

  logout(): void {
    this.auth.logout({ 
      logoutParams: { 
        returnTo: this.doc.location.origin 
      } 
    });
  }
}