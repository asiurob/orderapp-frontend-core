export interface ILegalCustomer {
  id: string;
  fullName: string;
  rfc: string;
  customerType: 'PERSONA_FISICA' | 'PERSONA_MORAL';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';
  email: string;
  phone: string;
  ownerUser?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  legalRepresentativeFirstName: string;
  legalRepresentativeLastName: string;
  legalRepresentativeSecondLastName: string;
  bankAccount: string;
  bankInstitution: string;
  createdAt: string;
  updatedAt: string;

}

export interface IRegisteredClientDetails {
  id: string;
  clientData: any;
  restaurantData: any;
  uploadedDocuments: string[];
  status: string;
}

export interface ILegalCustomerWithProgress extends ILegalCustomer {
  documentProgress: number;
}
