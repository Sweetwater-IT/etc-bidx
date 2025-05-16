"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { AssociatedItem, QuoteItem } from "@/types/IQuoteItem";
import { useState } from "react";
import { generateUniqueId } from "../active-bid/signs/generate-stable-id";

enum UOM_TYPES {
  EA = 'EA',
  LS = 'LS',
  SF = 'SF',
  LF = 'LF',
  EA_MO = 'EA/MO',
  EA_DAY = 'EA/DAY',
  HR = 'HR'
}

export function QuoteItems() {
  const { quoteItems, setQuoteItems } = useQuoteForm();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newQuoteItem, setNewQuoteItem] = useState<QuoteItem>({
    id: generateUniqueId(),
    itemNumber: '',
    description: '',
    uom: '',
    quantity: 0,
    unitPrice: 0,
    discount: 0,
    discountType: 'percentage',
    notes: '',
    associatedItems: []
  });

  // Calculate unit price for composite items (items with sub-items)
  const calculateCompositeUnitPrice = (item: QuoteItem) => {
    if (!item.associatedItems || item.associatedItems.length === 0) {
      return item.unitPrice;
    }

    return item.associatedItems.reduce((acc, associatedItem) =>
      acc + (associatedItem.quantity * associatedItem.unitPrice), 0);
  };

  // Calculate extended price based on quantity, unit price, and discount
  const calculateExtendedPrice = (item: QuoteItem) => {
    const unitPrice = calculateCompositeUnitPrice(item);
    const basePrice = item.quantity * unitPrice;

    // If discount type is dollar, use the direct amount, otherwise calculate percentage
    const discountAmount = item.discountType === 'dollar' ? item.discount : (basePrice * (item.discount / 100));
    return (basePrice - discountAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate total value
  const totalValueCalculation = () => {
    return quoteItems.reduce((sum, item) => {
      const unitPrice = calculateCompositeUnitPrice(item);
      const basePrice = (item.quantity || 0) * unitPrice;

      // If discount type is dollar, use the direct amount, otherwise calculate percentage
      const discountAmount = item.discountType === 'dollar' ? item.discount : (basePrice * (item.discount / 100));
      return sum + (basePrice - discountAmount);
    }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle item updates
  const handleItemUpdate = (itemId: string, field: keyof QuoteItem, value: string | number) => {
    setQuoteItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // Handle adding custom item
  const handleAddCustomItem = () => {
    if (quoteItems.some(qi => qi.itemNumber === newQuoteItem.itemNumber)) return;
    if (newQuoteItem.itemNumber && newQuoteItem.description) {
      setQuoteItems(prevState => [...prevState, {
        ...newQuoteItem,
        isCustom: true
      }]);

      // Reset form
      setNewQuoteItem({
        id: generateUniqueId(),
        itemNumber: '',
        description: '',
        uom: '',
        quantity: 0,
        unitPrice: 0,
        discount: 0,
        discountType: 'percentage',
        notes: '',
        associatedItems: []
      });
      setShowCustomForm(false);
    }
  };

  // Handle removing item
  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Handle adding sub-item
  const handleAddCompositeItem = (parentItem: QuoteItem) => {
    setQuoteItems(prevItems =>
      prevItems.map(item =>
        item.id === parentItem.id ? {
          ...item,
          associatedItems: [...(item.associatedItems || []), {
            id: generateUniqueId(),
            itemNumber: '',
            description: '',
            uom: '',
            quantity: 0,
            unitPrice: 0,
            notes: ''
          }]
        } : item
      )
    );
  };

  // Handle sub-item updates
  const handleCompositeItemUpdate = (parentItemId: string, subItemId: string, field: keyof AssociatedItem, value: string | number) => {
    setQuoteItems(prevItems =>
      prevItems.map(item =>
        item.id === parentItemId ? {
          ...item,
          associatedItems: item.associatedItems?.map(ai =>
            ai.id === subItemId
              ? { ...ai, [field]: value }
              : ai
          ) || []
        } : item
      )
    );
  };

  // Handle removing sub-item
  const handleDeleteComposite = (parentItemId: string, subItemId: string) => {
    setQuoteItems(prevItems =>
      prevItems.map(item =>
        item.id === parentItemId
          ? {
            ...item,
            associatedItems: item.associatedItems?.filter(ai => ai.id !== subItemId) || []
          }
          : item
      )
    );
  };

  // Handle new item form changes
  const handleCustomItemChange = (field: keyof QuoteItem, value: string | number) => {
    setNewQuoteItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quote Items</h2>
        <Button onClick={() => setShowCustomForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
          <div style={{ flexBasis: "16.67%" }}>Item # / SKU</div>
          <div style={{ flexBasis: "16.67%" }}>Description</div>
          <div style={{ flexBasis: "12.5%" }}>UOM</div>
          <div style={{ flexBasis: "8.33%" }}>Qty</div>
          <div style={{ flexBasis: "12.5%" }}>Unit Price</div>
          <div style={{ flexBasis: "16.67%" }}>Discount</div>
          <div className="flex-1 text-right">Extended Price</div>
        </div>

        {/* Items */}
        {quoteItems.map((item) => {
          const hasAssociatedItems = item.associatedItems && item.associatedItems.length > 0;
          const displayUnitPrice = hasAssociatedItems ? calculateCompositeUnitPrice(item) : item.unitPrice;

          return (
            <div key={item.id} className="space-y-4">
              {/* Main Item Row */}
              <div className="flex gap-4 items-center rounded-lg">
                <div style={{ flexBasis: "16.67%" }}>
                  <Input
                    placeholder="Item Number"
                    value={item.itemNumber}
                    onChange={(e) => handleItemUpdate(item.id, 'itemNumber', e.target.value)}
                  />
                </div>
                <div style={{ flexBasis: "16.67%" }}>
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemUpdate(item.id, 'description', e.target.value)}
                  />
                </div>
                <div style={{ flexBasis: "12.5%" }}>
                  <Select
                    value={item.uom}
                    onValueChange={(value) => handleItemUpdate(item.id, 'uom', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UOM_TYPES).map(uom => (
                        <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div style={{ flexBasis: "8.33%" }}>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemUpdate(item.id, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div style={{ flexBasis: "12.5%" }}>
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    value={displayUnitPrice.toFixed(2)}
                    onChange={(e) => handleItemUpdate(item.id, 'unitPrice', Number(e.target.value))}
                    disabled={hasAssociatedItems}
                    className={hasAssociatedItems ? "bg-muted" : ""}
                  />
                </div>
                <div style={{ flexBasis: "16.67%" }}>
                  <div className="flex max-w-40">
                    <Select
                      value={item.discountType}
                      onValueChange={(value) => handleItemUpdate(item.id, 'discountType', value)}
                    >
                      <SelectTrigger className="shrink-[2]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dollar">$</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Discount"
                      value={item.discount || ''}
                      onChange={(e) => handleItemUpdate(item.id, 'discount', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-end gap-2">
                  <div>${calculateExtendedPrice(item)}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Sub Items */}
              {item.associatedItems && item.associatedItems.length > 0 && (
                <div className="ml-8 space-y-2">
                  {item.associatedItems.map((subItem) => (
                    <div key={subItem.id} className="flex gap-4 items-center bg-muted/50 rounded p-4">
                      <div style={{ flexBasis: "16.67%" }}>
                        <Input
                          placeholder="Sub Item #"
                          value={subItem.itemNumber}
                          onChange={(e) => handleCompositeItemUpdate(item.id, subItem.id, 'itemNumber', e.target.value)}
                        />
                      </div>
                      <div style={{ flexBasis: "16.67%" }}>
                        <Input
                          placeholder="Description"
                          value={subItem.description}
                          onChange={(e) => handleCompositeItemUpdate(item.id, subItem.id, 'description', e.target.value)}
                        />
                      </div>
                      <div style={{ flexBasis: "12.5%" }}>
                        <Select
                          value={subItem.uom}
                          onValueChange={(value) => handleCompositeItemUpdate(item.id, subItem.id, 'uom', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="UOM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UOM_TYPES).map(uom => (
                              <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div style={{ flexBasis: "12%" }}>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={subItem.quantity || ''}
                          onChange={(e) => handleCompositeItemUpdate(item.id, subItem.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div style={{ flexBasis: "20%" }}>
                        <Input
                          type="number"
                          placeholder="Unit Price"
                          value={subItem.unitPrice || ''}
                          onChange={(e) => handleCompositeItemUpdate(item.id, subItem.id, 'unitPrice', Number(e.target.value))}
                        />
                      </div>
                      <div style={{ flexBasis: "10%" }} className="text-right">
                        ${(subItem.quantity * subItem.unitPrice).toFixed(2)}
                      </div>
                      <div className=" flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComposite(item.id, subItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes and Add Sub-Item */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Notes"
                  value={item.notes || ''}
                  onChange={(e) => handleItemUpdate(item.id, 'notes', e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCompositeItem(item)}
                    disabled={item.associatedItems?.some(ai => !ai.itemNumber || ai.itemNumber === '')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sub Item
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Custom Item Form */}
        {showCustomForm && (
          <div className="flex gap-2 items-center rounded-lg">
            <div style={{ flexBasis: "16.67%" }}>
              <Input
                placeholder="Item Number"
                value={newQuoteItem.itemNumber}
                onChange={(e) => handleCustomItemChange('itemNumber', e.target.value)}
              />
            </div>
            <div style={{ flexBasis: "16.67%" }}>
              <Input
                placeholder="Description"
                value={newQuoteItem.description}
                onChange={(e) => handleCustomItemChange('description', e.target.value)}
              />
            </div>
            <div style={{ flexBasis: "12.5%" }}>
              <Select
                value={newQuoteItem.uom}
                onValueChange={(value) => handleCustomItemChange('uom', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="UOM" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UOM_TYPES).map(uom => (
                    <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div style={{ flexBasis: "8.33%" }}>
              <Input
                type="number"
                placeholder="Qty"
                value={newQuoteItem.quantity || ''}
                onChange={(e) => handleCustomItemChange('quantity', Number(e.target.value))}
              />
            </div>
            <div style={{ flexBasis: "12.5%" }}>
              <Input
                type="number"
                placeholder="Unit Price"
                value={newQuoteItem.unitPrice || ''}
                onChange={(e) => handleCustomItemChange('unitPrice', Number(e.target.value))}
              />
            </div>
            <div style={{ flexBasis: "22%" }}>
              <div className="flex gap-1">
                <Select
                  value={newQuoteItem.discountType}
                  onValueChange={(value) => handleCustomItemChange('discountType', value)}
                >
                  <SelectTrigger className="max-w-18">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dollar">$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Discount"
                  value={newQuoteItem.discount || ''}
                  onChange={(e) => handleCustomItemChange('discount', Number(e.target.value))}
                  className="grow"
                />
              </div>
            </div>
            <div className="shrink-[2] max-w-20">
              <Button onClick={handleAddCustomItem}>
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end space-y-1 text-sm">
        <div className="text-right">
          <div>Total Items: {quoteItems.length}</div>
          <div className="font-medium">Total Value: ${totalValueCalculation()}</div>
        </div>
      </div>
    </div>
  );
}