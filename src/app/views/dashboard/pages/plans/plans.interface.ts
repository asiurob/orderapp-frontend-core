export interface IPlan {
  id: string; 
  planName: string;
  description: string;
  fixedCost: number;
  percentPerTransaction: number;
  isPublic: boolean;
  operativeUsers: number;
  locations: number;
  tables: number;
  categories: number;
  products: number;
  kitchens: number;
  metrics: boolean;
  isActive: boolean;
  isDeleted: boolean;
}

export interface IGraphQLResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
}

export interface IPlanInput {
  planName: string;
  description?: string;
  fixedCost: number;
  isPublic: boolean;
  operativeUsers: number;
  locations: number;
  tables: number;
  categories: number;
  products: number;
  kitchens: number;
  metrics: boolean;
  isActive: boolean;
  percentPerTransaction?: number;
}