import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push(-1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push(-2);
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Go to previous page</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((page, index) => {
        if (page < 0) {
          // Render ellipsis
          return (
            <span key={`ellipsis-${index}`} className="px-2">
              ...
            </span>
          );
        }
        
        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 p-0"
          >
            <span>{page}</span>
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Go to next page</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
