export interface IRegisteredClient {
  id: string;
  restaurantName: string;
  branchCount: number;
  clientName: string;
  email: string;
  phone: string;
  personType: 'fisica' | 'moral';
  uploadedDocuments: string[];
  status: 'Completo' | 'Pendiente' | 'En Revisión';
}

export interface IRegisteredClientDetails {
  id: string; 
  clientData: any;
  restaurantData: { 
      tradeName?: string; 
      businessName?: string;
      branches: any[]
  };
  uploadedDocuments: string[];
  status: string;
}

export interface IRegisteredClientWithProgress extends IRegisteredClient {
    documentProgress: number;
}