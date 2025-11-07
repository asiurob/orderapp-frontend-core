export interface RestaurantBase {
  id: string;
  restaurantName: string;
  restaurantDetails: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  notes?: string;
}