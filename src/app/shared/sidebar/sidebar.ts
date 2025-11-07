import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones de Angular Material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SidebarCount } from './sidebar-count.service';
import { MenuItem } from './sidebar.interface';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ord-core-sidebar',
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule],
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  menuItems: Signal<MenuItem[]>;

  constructor(private sidebarState: SidebarCount) {
    this.menuItems = this.sidebarState.menuItems;
  }
}