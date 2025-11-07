import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Notification } from './header.interface';

@Injectable({
  providedIn: 'root'
})
export class HeaderState {
  _isSystemActive = signal(true);
  isSystemActive = computed(() => this._isSystemActive());

  // El signal vacio
  _notifications = signal<Notification[]>([]);
  
  notificationCount = computed(() => 
    this._notifications().filter(notif => !notif.read).length
  );

  constructor(private http: HttpClient) {
    this.loadInitialNotifications();
  }

  toggleSystemStatus(): void {
    this._isSystemActive.update(currentStatus => !currentStatus);
  }

  // Carga datos dummy
  loadInitialNotifications(): void {
    this.http.get<Notification[]>('assets/data/notifications.json')
      .subscribe(data => {
        this._notifications.set(data);
      });
  }

  addNotification(message: string): void {
    const newNotification: Notification = {
      id: `notif_${Date.now()}`,
      message: message,
      read: false,
      timestamp: new Date().toISOString()
    };
    this._notifications.update(currentList => [newNotification, ...currentList]);
  }
}