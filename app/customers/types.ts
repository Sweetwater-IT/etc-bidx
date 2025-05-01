export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

export interface Contractor {
  id: number;
  name: string;
  address: string;
  url: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  customerNumber?: number;
  created?: string;
  updated?: string;
  contactIds: number[];
  names: string[];
  roles: string[];
  emails: string[];
  phones: string[];
}

export interface ContractorFormData {
  name: string;
  address: string;
  url: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  customerNumber?: number;
} 