import { useEffect, useState } from 'react';

interface Product {
  id: number;
  item_number: string;
  description: string;
  uom: string;
  grouping: string | null;
  is_custom: boolean;
}

export function useProductsSearch(searchTerm: string) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/bid-item-numbers');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch products');
        }

        setAllProducts(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setProducts(allProducts);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredProducts = allProducts.filter((product) =>
      product.item_number.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower)
    );

    setProducts(filteredProducts);
  }, [searchTerm, allProducts]);

  return { products, loading, error };
} 