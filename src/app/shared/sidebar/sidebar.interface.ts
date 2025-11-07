import { Signal, WritableSignal } from "@angular/core";

export interface MenuItemData {
  id: string;
  label: string;
  icon: string;
  routerLink: string; 
  initialCount?: number;
}

export interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  count?: WritableSignal<number | null>;
}