import { useState, useEffect, useCallback, useRef } from 'react';
import { ScheduleOfValuesItem } from '@/types/job';
import { toast } from 'sonner';

const DEBOUNCE_MS = 750;

export function useSovItems(id: string | undefined, isContract: boolean = false) {
  const [items, setItems] = useState<ScheduleOfValuesItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const originalItemsRef = useRef<ScheduleOfValuesItem[]>([]);

  // Fetch SOV items
  const fetchItems = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Determine the correct API endpoint based on whether we're dealing with a contract or job
      const apiEndpoint = isContract 
        ? `/api/l/contracts/${id}/sov-items`
        : `/api/l/jobs/${id}/sov-items`;
      
      const response = await fetch(apiEndpoint);
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
          // Store unit price in cents format for CurrencyInput compatibility
          _unitPriceCents: Math.round((item.unit_price || 0) * 100).toString(),
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
  }, [id, isContract]);

  // Load items on mount and id change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Calculate retainage amount
  const calcRetainageAmount = (extendedPrice: number, type: 'percent' | 'dollar', value: number): number => {
    if (type === 'percent') return Math.round(extendedPrice * (value / 100) * 100) / 100;
    return Math.round(value * 100) / 100;
  };

  // Validate if an item is ready to be saved
  const isItemValidForSave = useCallback((item: ScheduleOfValuesItem): boolean => {
    // Skip temporary items that haven't been properly saved yet
    if (typeof item.id === 'string' && item.id.startsWith('temp-')) {
      // Allow temp items if they have an item number selected (from dropdown)
      return !!(item.itemNumber && item.itemNumber.trim());
    }

    // Item must have either:
    // 1. A numeric ID (from database), OR
    // 2. Both itemNumber and description (custom item)
    const hasDbId = typeof item.id === 'number';
    const hasCustomItem = !!(item.itemNumber && item.itemNumber.trim() && item.description && item.description.trim());

    return hasDbId || hasCustomItem;
  }, []);

  // Save items to database with proper change tracking
  const saveItems = useCallback(async (currentItems: ScheduleOfValuesItem[]) => {
    if (!id) {
      console.error('[SOV save error] No id provided');
      return;
    }

    console.log('[SOV save] Starting save operation for id:', id);

    // Filter out invalid items that shouldn't be saved yet
    const validItems = currentItems.filter(item => isItemValidForSave(item));
    const invalidItems = currentItems.filter(item => !isItemValidForSave(item));

    console.log('[SOV save] Filtered items:', {
      total: currentItems.length,
      valid: validItems.length,
      invalid: invalidItems.length,
      invalidDetails: invalidItems.map(i => ({ id: i.id, itemNumber: i.itemNumber, description: i.description }))
    });

    // If no valid items to save, skip the operation
    if (validItems.length === 0) {
      console.log('[SOV save] No valid items to save, skipping operation');
      return;
    }

    // Wait for any in-flight save
    if (inFlightRef.current) {
      console.log('[SOV save] Waiting for in-flight save to complete...');
      try { await inFlightRef.current; } catch { /* proceed */ }
    }

    setSaving(true);
    setSaveStatus('saving');

    const promise = (async () => {
      try {
        const originalItems = originalItemsRef.current.filter(item => isItemValidForSave(item)); // Only consider valid original items
        console.log('[SOV save] Original valid items count:', originalItems.length);
        console.log('[SOV save] Current valid items count:', validItems.length);

        const currentItemIds = new Set(validItems.map(item => item.id));
        const originalItemIds = new Set(originalItems.map(item => item.id));

        // Find items to delete (in original but not in current valid items)
        const itemsToDelete = originalItems.filter(item => !currentItemIds.has(item.id));
        console.log('[SOV save] Items to delete:', itemsToDelete.length, itemsToDelete.map(i => ({ id: i.id, itemNumber: i.itemNumber })));

        // Find items to create (in current valid items but not in original)
        const itemsToCreate = validItems.filter(item => !originalItemIds.has(item.id));
        console.log('[SOV save] Items to create:', itemsToCreate.length, itemsToCreate.map(i => ({ id: i.id, itemNumber: i.itemNumber })));

        // Find items to update (in both valid lists, but potentially changed)
        const itemsToUpdate = validItems.filter(currentItem => {
          const originalItem = originalItems.find(orig => orig.id === currentItem.id);
          if (!originalItem) return false;

          // Check if any significant fields changed
          const hasChanged = (
            originalItem.quantity !== currentItem.quantity ||
            originalItem.unitPrice !== currentItem.unitPrice ||
            originalItem.retainageType !== currentItem.retainageType ||
            originalItem.retainageValue !== currentItem.retainageValue ||
            originalItem.notes !== currentItem.notes
          );

          if (hasChanged) {
            console.log('[SOV save] Item changed:', {
              id: currentItem.id,
              itemNumber: currentItem.itemNumber,
              changes: {
                quantity: originalItem.quantity !== currentItem.quantity ? `${originalItem.quantity} -> ${currentItem.quantity}` : null,
                unitPrice: originalItem.unitPrice !== currentItem.unitPrice ? `${originalItem.unitPrice} -> ${currentItem.unitPrice}` : null,
                retainageType: originalItem.retainageType !== currentItem.retainageType ? `${originalItem.retainageType} -> ${currentItem.retainageType}` : null,
                retainageValue: originalItem.retainageValue !== currentItem.retainageValue ? `${originalItem.retainageValue} -> ${currentItem.retainageValue}` : null,
                notes: originalItem.notes !== currentItem.notes ? 'changed' : null,
              }
            });
          }

          return hasChanged;
        });
        console.log('[SOV save] Items to update:', itemsToUpdate.length, itemsToUpdate.map(i => ({ id: i.id, itemNumber: i.itemNumber })));

        // Execute operations in order: delete, create, update
        const operations: Promise<any>[] = [];
        let operationIndex = 0;

        // Determine the correct API endpoint based on whether we're dealing with a contract or job
        const apiEndpointBase = isContract 
          ? `/api/l/contracts/${id}/sov-items`
          : `/api/l/jobs/${id}/sov-items`;

        // Delete operations
        console.log('[SOV save] Starting delete operations...');
        for (const item of itemsToDelete) {
          console.log(`[SOV save] Delete operation ${operationIndex}: item ${item.itemNumber} (id: ${item.id})`);
          operations.push(
            fetch(`${apiEndpointBase}/${item.id}`, { method: 'DELETE' })
              .then(async response => {
                console.log(`[SOV save] Delete response for ${item.itemNumber}:`, response.status, response.statusText);
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error(`[SOV save] Delete failed for ${item.itemNumber}:`, errorText);
                  throw new Error(`Failed to delete item ${item.itemNumber}: ${response.status} ${response.statusText}`);
                }
                return response;
              })
              .catch(error => {
                console.error(`[SOV save] Delete operation failed for ${item.itemNumber}:`, error);
                throw error;
              })
          );
          operationIndex++;
        }

        // Create operations
        console.log('[SOV save] Starting create operations...');
        for (const item of itemsToCreate) {
          const payload = {
            item_number: item.itemNumber,
            description: item.description,
            uom: item.uom,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            retainage_type: item.retainageType,
            retainage_value: item.retainageValue,
            notes: item.notes,
            sort_order: currentItems.indexOf(item) + 1,
          };
          
          // For contracts, we need to send the payload differently
          const requestBody = isContract ? { items: [payload] } : payload;
          const requestUrl = isContract ? apiEndpointBase : `${apiEndpointBase}`;
          
          console.log(`[SOV save] Create operation ${operationIndex}: item ${item.itemNumber}`, {
            timestamp: new Date().toISOString(),
            url: requestUrl,
            method: 'POST',
            payload,
            itemDetails: {
              id: item.id,
              itemNumber: item.itemNumber,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }
          });

          operations.push(
            fetch(requestUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            })
              .then(async response => {
                const responseTimestamp = new Date().toISOString();
                console.log(`[SOV save] Create response for ${item.itemNumber}:`, {
                  timestamp: responseTimestamp,
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok,
                  url: response.url
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  let parsedError: any = null;
                  try {
                    parsedError = errorText ? JSON.parse(errorText) : null;
                  } catch {
                    parsedError = null;
                  }

                  console.error(`[SOV save] Create failed for ${item.itemNumber}:`, {
                    timestamp: responseTimestamp,
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    parsedError,
                    payload,
                    id
                  });
                  const errorSummary = parsedError?.error || parsedError?.message || response.statusText;
                  const detailSummary = parsedError?.details
                    ? JSON.stringify(parsedError.details)
                    : (errorText || 'no response body');

                  throw new Error(
                    `Failed to create item ${item.itemNumber}: ${response.status} ${errorSummary} | details: ${detailSummary}`
                  );
                }

                const result = await response.json();
                console.log(`[SOV save] Create success for ${item.itemNumber}:`, {
                  timestamp: responseTimestamp,
                  result,
                  itemNumber: item.itemNumber
                });
                return result;
              })
              .catch(error => {
                console.error(`[SOV save] Create operation failed for ${item.itemNumber}:`, {
                  timestamp: new Date().toISOString(),
                  error: error.message,
                  stack: error.stack,
                  itemNumber: item.itemNumber,
                  payload
                });
                throw error;
              })
          );
          operationIndex++;
        }

        // Update operations
        console.log('[SOV save] Starting update operations...');
        for (const item of itemsToUpdate) {
          const payload = {
            quantity: item.quantity,
            unit_price: item.unitPrice,
            retainage_type: item.retainageType,
            retainage_value: item.retainageValue,
            notes: item.notes,
            sort_order: currentItems.indexOf(item) + 1,
          };
          console.log(`[SOV save] Update operation ${operationIndex}: item ${item.itemNumber} (id: ${item.id})`, payload);

          operations.push(
            fetch(`${apiEndpointBase}/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
              .then(async response => {
                console.log(`[SOV save] Update response for ${item.itemNumber}:`, response.status, response.statusText);
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error(`[SOV save] Update failed for ${item.itemNumber}:`, errorText);
                  throw new Error(`Failed to update item ${item.itemNumber}: ${response.status} ${response.statusText} - ${errorText}`);
                }
                const result = await response.json();
                console.log(`[SOV save] Update success for ${item.itemNumber}:`, result);
                return result;
              })
              .catch(error => {
                console.error(`[SOV save] Update operation failed for ${item.itemNumber}:`, error);
                throw error;
              })
          );
          operationIndex++;
        }

        console.log(`[SOV save] Executing ${operations.length} operations...`);
        // Execute all operations
        const results = await Promise.all(operations);
        console.log('[SOV save] All operations completed successfully:', results.length, 'results');

        // Update original items reference with current state
        originalItemsRef.current = currentItems.map(item => ({ ...item }));
        console.log('[SOV save] Updated original items reference');

        setSaveStatus('saved');
        console.log('[SOV save] Save operation completed successfully');
        // Reset to idle after a moment
        setTimeout(() => setSaveStatus((prev) => prev === 'saved' ? 'idle' : prev), 2000);
      } catch (err: any) {
        console.error('[SOV save error] Detailed error information:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
          id,
          currentItemsCount: currentItems.length,
          originalItemsCount: originalItemsRef.current.length,
        });
        setSaveStatus('error');
        toast.error(`SOV save failed: ${err.message}`);
        throw err; // Re-throw to allow caller to handle
      } finally {
        setSaving(false);
        console.log('[SOV save] Save operation finished (finally block)');
      }
    })();

    inFlightRef.current = promise;
    try {
      await promise;
      console.log('[SOV save] Promise resolved successfully');
    } catch (error) {
      console.error('[SOV save] Promise rejected:', error);
    } finally {
      inFlightRef.current = null;
      console.log('[SOV save] In-flight reference cleared');
    }
  }, [id, isContract]);

  // When id transitions from undefined to a real value, persist any locally-queued items
  const prevIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (id && !prevIdRef.current && items.length > 0) {
      console.log('[useSovItems] id became available, triggering save for queued items');
      saveItems(items);
    }
    prevIdRef.current = id;
  }, [id, items, saveItems]);

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
