"use client";
import { Badge } from "@/components/ui/badge";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { useEffect, useState } from "react";

export function QuoteNumber() {
  const { 
    quoteNumber,      
    setQuoteNumber, 
    status, 
    quoteType, 
    associatedContractNumber, 
    emailSent 
  } = useQuoteForm();
  
  const [nextNumber, setNextNumber] = useState<number>(1001);
  const [isLoading, setIsLoading] = useState(false);

  const getLatestNumber = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quotes?nextNumber=true');
      if (response.ok) {
        const data = await response.json();
        if (data.nextQuoteNumber) {
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
    return nextNumber;
  };

  const updateQuoteNumber = async () => {
    const latestNumber = await getLatestNumber();
    
    if (quoteType === 'straight_sale') {
      setQuoteNumber(`Q-${latestNumber}`);
    } else if ((quoteType === 'estimate_bid' || quoteType === 'to_project') && associatedContractNumber) {
      setQuoteNumber(`${associatedContractNumber}-Q-${latestNumber}`);
    } else if (!quoteNumber) {
      setQuoteNumber(`Q-${latestNumber}`);
    }
  };
  
  useEffect(() => {
    updateQuoteNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
          <span className="font-medium">{quoteNumber}</span> 
        )}
      </div>
      <Badge variant="outline">
        {status}
      </Badge>
    </div>
  );
}
