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

  // Save items to database
  const saveItems = useCallback(async (itemsToSave: ScheduleOfValuesItem[]) => {
    if (!jobId) return;

    // Wait for any in-flight save
    if (inFlightRef.current) {
      try { await inFlightRef.current; } catch { /* proceed */ }
    }

    setSaving(true);
    setSaveStatus('saving');

    const promise = (async () => {
      try {
        // Delete all existing items and insert new ones (simpler than diffing)
        const deleteResponse = await fetch(`/api/l/jobs/${jobId}/sov-items`, {
          method: 'GET',
        });
        if (deleteResponse.ok) {
          const existingData = await deleteResponse.json();
          const existingIds = existingData.data.map((item: any) => item.id);

          // Delete existing items
          await Promise.all(
            existingIds.map((id: string) =>
              fetch(`/api/l/jobs/${jobId}/sov-items/${id}`, { method: 'DELETE' })
            )
          );
        }

        // Insert new items
        await Promise.all(
          itemsToSave.map(async (item, index) => {
            const response = await fetch(`/api/l/jobs/${jobId}/sov-items`, {
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
                sort_order: index + 1,
              }),
            });

            if (!response.ok) {
              throw new Error(`Failed to save item ${item.itemNumber}`);
            }

            const result = await response.json();
            return result.data;
          })
        );

        setSaveStatus('saved');
        // Reset to idle after a moment
        setTimeout(() => setSaveStatus((prev) => prev === 'saved' ? 'idle' : prev), 2000);
      } catch (err: any) {
        console.error('[SOV save error]', err);
        setSaveStatus('error');
        toast.error(`SOV save failed: ${err.message}`);
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