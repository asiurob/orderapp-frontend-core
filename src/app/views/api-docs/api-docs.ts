import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type MicroService = {
  name: string;        // clave técnica
  label: string;       // nombre visible en español
  docUrl: string;
};

@Component({
  selector: 'ord-core-api-docs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './api-docs.html',
  styleUrls: ['./api-docs.scss'],
})
export class ApiDocs {
  // Definición directa basada en docker-compose (localhost:PUERTO/api-docs)
  services: MicroService[] = [
    { name: 'legal-customers', label: 'Clientes legales', docUrl: 'http://localhost:3001/api-docs' },
    { name: 'restaurants', label: 'Restaurantes', docUrl: 'http://localhost:3002/api-docs' },
    { name: 'mex-locations', label: 'Ubicaciones MX', docUrl: 'http://localhost:3003/api-docs' },
    { name: 'main-documents', label: 'Documentos', docUrl: 'http://localhost:3004/api-docs' },
    { name: 'plans', label: 'Planes', docUrl: 'http://localhost:3005/api-docs' },
    { name: 'risto-users', label: 'Usuarios Risto', docUrl: 'http://localhost:3006/api-docs' },
    { name: 'roles', label: 'Roles', docUrl: 'http://localhost:3007/api-docs' },
    { name: 'risto-categories', label: 'Categorías', docUrl: 'http://localhost:3008/api-docs' },
  ];

  openDocs(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}


