import { useEffect, useState } from 'react';

interface Product {
  id: number;
  item_number: string;
  description: string;
  item_name: string;
  uom: string;
  grouping?: string | null;
  is_custom: boolean;
  source?: 'service_items' | 'sale' | 'rental';
  notes: string;
}

export function useProductsSearch(searchTerm: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/bid-item-numbers');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch products');
        }

        const { bidItems = [], saleItems = [], rentalItems = [] } = result.data || {};

        const combined: Product[] = [
          ...bidItems.map((p: Product) => ({ ...p, source: 'service_items' })), 
          ...saleItems.map((p: Product) => ({ ...p, source: 'sale' })),
          ...rentalItems.map((p: Product) => ({ ...p, source: 'rental' })),
        ];

        // Filtrado inicial según searchTerm
        if (!searchTerm) {
          setProducts(combined);
        } else {
          const searchLower = searchTerm.toLowerCase();
          setProducts(
            combined.filter(
              (p) =>
                p.item_number.toLowerCase().includes(searchLower) ||
                p.item_name.toLowerCase().includes(searchLower)
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm]);

  return { products, loading, error };
}
