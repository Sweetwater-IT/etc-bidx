import { useState, useEffect, useCallback, useRef } from 'react';
import { ScheduleOfValuesItem } from '@/types/job';
import { toast } from 'sonner';

const DEBOUNCE_MS = 750;

export function useSovItems(jobId: string | undefined) {
  const [items, setItems] = useState<ScheduleOfValuesItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const originalItemsRef = useRef<ScheduleOfValuesItem[]>([]);

  // Fetch SOV items
  const fetchItems = useCallback(async () => {
    if (!jobId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/l/jobs/${jobId}/sov-items`);
      if (response.ok) {
        const data = await response.json();
        const formattedItems: ScheduleOfValuesItem[] = data.data.map((item: any) => ({
          id: item.id,
          itemNumber: item.item_number || '',
          description: item.description || '',
          uom: item.uom || '',
          quantity: item.quantity || 0,
          unitPrice: item.unit_price || 0,
          extendedPrice: item.extended_price || 0,
          retainageType: (item.retainage_type === 'fixed' ? 'dollar' : item.retainage_type || 'percent') as 'percent' | 'dollar',
          retainageValue: item.retainage_value || 0,
          retainageAmount: item.retainage_amount || 0,
          notes: item.notes || '',
        }));
        setItems(formattedItems);
        originalItemsRef.current = formattedItems;
      } else {
        console.error('Failed to fetch SOV items');
      }
    } catch (error) {
      console.error('Error fetching SOV items:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Load items on mount and jobId change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Calculate retainage amount
  const calcRetainageAmount = (extendedPrice: number, type: 'percent' | 'dollar', value: number): number => {
    if (type === 'percent') return Math.round(extendedPrice * (value / 100) * 100) / 100;
    return Math.round(value * 100) / 100;
  };

  // Save items to database with proper change tracking
  const saveItems = useCallback(async (currentItems: ScheduleOfValuesItem[]) => {
    if (!jobId) return;

    // Wait for any in-flight save
    if (inFlightRef.current) {
      try { await inFlightRef.current; } catch { /* proceed */ }
    }

    setSaving(true);
    setSaveStatus('saving');

    const promise = (async () => {
      try {
        const originalItems = originalItemsRef.current;
        const currentItemIds = new Set(currentItems.map(item => item.id));
        const originalItemIds = new Set(originalItems.map(item => item.id));

        // Find items to delete (in original but not in current)
        const itemsToDelete = originalItems.filter(item => !currentItemIds.has(item.id));

        // Find items to create (in current but not in original)
        const itemsToCreate = currentItems.filter(item => !originalItemIds.has(item.id));

        // Find items to update (in both, but potentially changed)
        const itemsToUpdate = currentItems.filter(currentItem => {
          const originalItem = originalItems.find(orig => orig.id === currentItem.id);
          if (!originalItem) return false;

          // Check if any significant fields changed
          return (
            originalItem.quantity !== currentItem.quantity ||
            originalItem.unitPrice !== currentItem.unitPrice ||
            originalItem.retainageType !== currentItem.retainageType ||
            originalItem.retainageValue !== currentItem.retainageValue ||
            originalItem.notes !== currentItem.notes
          );
        });

        // Execute operations in order: delete, create, update
        const operations: Promise<any>[] = [];

        // Delete operations
        for (const item of itemsToDelete) {
          operations.push(
            fetch(`/api/l/jobs/${jobId}/sov-items/${item.id}`, { method: 'DELETE' })
              .then(response => {
                if (!response.ok) throw new Error(`Failed to delete item ${item.itemNumber}`);
                return response;
              })
          );
        }

        // Create operations
        for (const item of itemsToCreate) {
          operations.push(
            fetch(`/api/l/jobs/${jobId}/sov-items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                item_number: item.itemNumber,
                description: item.description,
                uom: item.uom,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                retainage_type: item.retainageType,
                retainage_value: item.retainageValue,
                notes: item.notes,
                sort_order: currentItems.indexOf(item) + 1,
              }),
            }).then(response => {
              if (!response.ok) throw new Error(`Failed to create item ${item.itemNumber}`);
              return response.json();
            })
          );
        }

        // Update operations
        for (const item of itemsToUpdate) {
          operations.push(
            fetch(`/api/l/jobs/${jobId}/sov-items/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quantity: item.quantity,
                unit_price: item.unitPrice,
                retainage_type: item.retainageType,
                retainage_value: item.retainageValue,
                notes: item.notes,
                sort_order: currentItems.indexOf(item) + 1,
              }),
            }).then(response => {
              if (!response.ok) throw new Error(`Failed to update item ${item.itemNumber}`);
              return response.json();
            })
          );
        }

        // Execute all operations
        await Promise.all(operations);

        // Update original items reference with current state
        originalItemsRef.current = currentItems.map(item => ({ ...item }));

        setSaveStatus('saved');
        // Reset to idle after a moment
        setTimeout(() => setSaveStatus((prev) => prev === 'saved' ? 'idle' : prev), 2000);
      } catch (err: any) {
        console.error('[SOV save error]', err);
        setSaveStatus('error');
        toast.error(`SOV save failed: ${err.message}`);
        throw err; // Re-throw to allow caller to handle
      } finally {
        setSaving(false);
      }
    })();

    inFlightRef.current = promise;
    try { await promise; } catch { /* handled */ } finally { inFlightRef.current = null; }
  }, [jobId]);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      saveItems(items);
    }, DEBOUNCE_MS);
  }, [saveItems, items]);

  // Update items and trigger save
  const updateItems = useCallback((newItems: ScheduleOfValuesItem[]) => {
    setItems(newItems);
    scheduleSave();
  }, [scheduleSave]);

  // Add new item
  const addItem = useCallback((itemData: Partial<ScheduleOfValuesItem>) => {
    const newItem: ScheduleOfValuesItem = {
      id: crypto.randomUUID(),
      itemNumber: itemData.itemNumber || '',
      description: itemData.description || '',
      uom: itemData.uom || '',
      quantity: itemData.quantity || 0,
      unitPrice: itemData.unitPrice || 0,
      extendedPrice: (itemData.quantity || 0) * (itemData.unitPrice || 0),
      retainageType: itemData.retainageType || 'percent',
      retainageValue: itemData.retainageValue || 0,
      retainageAmount: calcRetainageAmount(
        (itemData.quantity || 0) * (itemData.unitPrice || 0),
        itemData.retainageType || 'percent',
        itemData.retainageValue || 0
      ),
      notes: itemData.notes || '',
    };

    const newItems = [...items, newItem];
    updateItems(newItems);
  }, [items, updateItems]);

  // Update existing item
  const updateItem = useCallback((id: string, updates: Partial<ScheduleOfValuesItem>) => {
    const newItems = items.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, ...updates };

      // Recalculate extended price and retainage
      if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
        updated.extendedPrice = updated.quantity * updated.unitPrice;
        updated.retainageAmount = calcRetainageAmount(
          updated.extendedPrice,
          updated.retainageType,
          updated.retainageValue
        );
      }

      if (updates.retainageType !== undefined || updates.retainageValue !== undefined) {
        updated.retainageAmount = calcRetainageAmount(
          updated.extendedPrice,
          updated.retainageType,
          updated.retainageValue
        );
      }

      return updated;
    });

    updateItems(newItems);
  }, [items, updateItems]);

  // Remove item
  const removeItem = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id);
    updateItems(newItems);
  }, [items, updateItems]);

  // Save immediately
  const saveNow = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    saveItems(items);
  }, [saveItems, items]);

  // Check if there are pending changes
  const hasPendingChanges = useCallback(() => {
    return debounceRef.current !== null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        // Fire-and-forget final save
        saveItems(items);
      }
    };
  }, [saveItems, items]);

  return {
    items,
    loading,
    saving,
    saveStatus,
    updateItems,
    addItem,
    updateItem,
    removeItem,
    saveNow,
    hasPendingChanges,
  };
}
