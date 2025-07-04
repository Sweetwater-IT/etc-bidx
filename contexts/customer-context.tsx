import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { Customer } from '@/types/Customer';
import { createCustomerContact, updateCustomerContact, deleteCustomerContact } from '@/lib/api-client';
import { toast } from 'sonner';

interface CustomerContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  isLoading: boolean;
  refreshCustomer: () => Promise<void>;
  createContact: (data: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
  }) => Promise<boolean>;
  updateContact: (contactId: number, data: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
  }) => Promise<boolean>;
  deleteContact: (contactId: number, contactName: string) => Promise<boolean>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children, initialCustomer = null }: { 
  children: ReactNode;
  initialCustomer?: Customer | null;
}) {
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isLoading, setIsLoading] = useState(false);
  
  // Update customer state when initialCustomer changes
  useEffect(() => {
    console.log('CustomerProvider - initialCustomer changed:', initialCustomer);
    if (initialCustomer) {
      setCustomer(initialCustomer);
    }
  }, [initialCustomer]);
  
  // Log when customer state changes
  useEffect(() => {
    console.log('CustomerProvider - customer state updated:', customer);
  }, [customer]);

  // Fetch updated customer data
  const refreshCustomer = useCallback(async () => {
    if (!customer) {
      console.error('Cannot refresh customer: No customer data available');
      return;
    }
    
    console.log(`CustomerContext: Refreshing customer data for ID: ${customer.id}`);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`);
      if (response.ok) {
        const updatedCustomer = await response.json();
        console.log('CustomerContext: Received updated customer data:', updatedCustomer);
        setCustomer(updatedCustomer);
        return updatedCustomer;
      } else {
        console.error(`CustomerContext: Failed to refresh customer data - Status: ${response.status}`);
      }
    } catch (error) {
      console.error('CustomerContext: Error refreshing customer data:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [customer]);

  // Create a new contact
  const createContact = useCallback(async (data: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
  }): Promise<boolean> => {
    if (!customer) {
      console.error('Cannot create contact: No customer data available');
      return false;
    }
    
    console.log('Creating contact for customer:', customer.id, data);
    setIsLoading(true);
    try {
      const result = await createCustomerContact({
        contractor_id: customer.id,
        ...data
      });
      
      console.log('Contact creation API response:', result);
      
      // Show success message
      toast.success('Contact created successfully');
      
      // Refresh customer data
      const updatedCustomer = await refreshCustomer();
      console.log('Customer data after contact creation:', updatedCustomer);
      
      return true;
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customer, refreshCustomer]);

  // Update an existing contact
  const updateContact = useCallback(async (contactId: number, data: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
  }): Promise<boolean> => {
    if (!customer) {
      console.error('Cannot update contact: No customer data available');
      return false;
    }
    
    console.log('Updating contact:', contactId, data);
    setIsLoading(true);
    try {
      const result = await updateCustomerContact(contactId, data);
      
      console.log('Contact update API response:', result);
      
      // Show success message
      toast.success('Contact updated successfully');
      
      // Refresh customer data
      const updatedCustomer = await refreshCustomer();
      console.log('Customer data after contact update:', updatedCustomer);
      
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customer, refreshCustomer]);

  // Delete a contact
  const deleteContact = useCallback(async (contactId: number, contactName: string): Promise<boolean> => {
    if (!customer) {
      console.error('Cannot delete contact: No customer data available');
      return false;
    }
    
    console.log('Deleting contact:', contactId, contactName);
    setIsLoading(true);
    try {
      const result = await deleteCustomerContact(contactId);
      
      console.log('Contact deletion API response:', result);
      
      // Show success message
      toast.success(`${contactName} has been deleted successfully`);
      
      // Refresh customer data
      const updatedCustomer = await refreshCustomer();
      console.log('Customer data after contact deletion:', updatedCustomer);
      
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customer, refreshCustomer]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    customer,
    setCustomer,
    isLoading,
    refreshCustomer,
    createContact,
    updateContact,
    deleteContact
  }), [
    customer, 
    setCustomer, 
    isLoading, 
    refreshCustomer, 
    createContact, 
    updateContact, 
    deleteContact
  ]);

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
