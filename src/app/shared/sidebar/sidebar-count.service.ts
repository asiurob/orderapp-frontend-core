import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { MenuItem, MenuItemData } from './sidebar.interface';

@Injectable({
  providedIn: 'root'
})
export class SidebarCount {
  private readonly _menuItems = signal<MenuItem[]>([]);
  public readonly menuItems = computed(() => this._menuItems());

  constructor(private http: HttpClient) {
    this.loadMenuItems();
  }

  private loadMenuItems(): void {
    this.http.get<MenuItemData[]>('assets/data/sidebar-menu.json')
      .pipe(
        tap(data => {
          const transformedData = data.map(item => {
            return {
              label: item.label,
              icon: item.icon,
              routerLink: item.routerLink,
              count: signal(item.initialCount ?? null) 
            };
          });
          this._menuItems.set(transformedData);
        })
      )
      .subscribe();
  }

  public updateCount(label: string, change: number): void {
    const items = this._menuItems();
    const itemToUpdate = items.find(item => item.label === label);

    if (itemToUpdate && itemToUpdate.count) {
      itemToUpdate.count.update(currentCount => (currentCount || 0) + change);
    }
  }
}