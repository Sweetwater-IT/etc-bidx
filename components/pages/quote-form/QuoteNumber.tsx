"use client";
import { Badge } from "@/components/ui/badge";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { useEffect, useState } from "react";

export function QuoteNumber() {
  const { 
    quoteId, 
    setQuoteId, 
    status, 
    quoteType, 
    associatedContractNumber, 
    emailSent 
  } = useQuoteForm();
  
  const [nextNumber, setNextNumber] = useState<number>(1001); // Default starting number
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the next sequential quote number
  const getLatestNumber = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quotes?nextNumber=true');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.nextQuoteNumber) {
          // Extract just the numeric part after 'Q-'
          const numericPart = parseInt(data.nextQuoteNumber.substring(2));
          if (!isNaN(numericPart)) {
            setNextNumber(numericPart);
            return numericPart;
          }
        }
      } else {
        console.error('Failed to fetch next quote number');
      }
    } catch (error) {
      console.error('Error fetching next quote number:', error);
    } finally {
      setIsLoading(false);
    }
    
    return nextNumber; // Return current value if fetch fails
  };

  // Update quote number when dependencies change
  const updateQuoteNumber = async () => {
    const latestNumber = await getLatestNumber();
    
    if (quoteType === 'new') {
      setQuoteId(`Q-${latestNumber}`);
    } else if (quoteType === 'estimate' && associatedContractNumber) {
      setQuoteId(`${associatedContractNumber}-Q-${latestNumber}`);
    } else if (quoteType === 'job' && associatedContractNumber) {
      setQuoteId(`${associatedContractNumber}-Q-${latestNumber}`);
    } else if (!quoteId) {
      // Fallback if no valid type/contract but we need a quote ID
      setQuoteId(`Q-${latestNumber}`);
    }
  };
  
  // When component mounts, get the initial quote number
  useEffect(() => {
    updateQuoteNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // When dependencies change, update the quote number
  useEffect(() => {
    updateQuoteNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteType, associatedContractNumber, emailSent]);
  
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="text-sm">
        Quote Number: {isLoading ? (
          <span className="text-gray-400">Loading...</span>
        ) : (
          <span className="font-medium">{quoteId}</span>
        )}
      </div>
      <Badge variant="outline">
        {status}
      </Badge>
    </div>
  );
}