export interface ClientGeneralData {
  fullName: string;
  phone: string;
  email: string;
  legalRepresentative?: string;
  personType: 'fisica' | 'moral';
  rfc: string;
  taxId?: string; // Cédula de Identificación Fiscal
  bankClabe: string;
  bankName: string;
}

export interface RestaurantAddress {
  street: string;
  extNum: string;
  intNum?: string;
  colony: string;
  municipality: string;
  state: string;
  zipCode: string;
  contact?: string;
  phone?: string;
}

export interface RestaurantData {
  tradeName: string;
  businessName?: string;
  branches: RestaurantAddress[];
}