import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Calculator,
  DollarSign,
  Hash,
  Ruler,
  FileText
} from "lucide-react";
import type { ScheduleOfValuesItem } from "@/types/job";

interface ScheduleOfValuesProps {
  items: ScheduleOfValuesItem[];
  onChange: (items: ScheduleOfValuesItem[]) => void;
  readOnly?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const calculateExtendedPrice = (quantity: number, unitPrice: number) => {
  return quantity * unitPrice;
};

const calculateTotal = (items: ScheduleOfValuesItem[]) => {
  return items.reduce((total, item) => total + calculateExtendedPrice(item.quantity, item.unitPrice), 0);
};

export const ScheduleOfValues = ({
  items,
  onChange,
  readOnly = false
}: ScheduleOfValuesProps) => {
  const [newItem, setNewItem] = useState<Partial<ScheduleOfValuesItem>>({
    itemNumber: "",
    description: "",
    quantity: 0,
    unitPrice: 0,
    uom: "",
    notes: "",
  });

  const addItem = useCallback(() => {
    if (!newItem.itemNumber || !newItem.description || !newItem.uom) return;

    const item: ScheduleOfValuesItem = {
      id: Date.now().toString(),
      itemNumber: newItem.itemNumber,
      description: newItem.description,
      quantity: newItem.quantity || 0,
      unitPrice: newItem.unitPrice || 0,
      extendedPrice: calculateExtendedPrice(newItem.quantity || 0, newItem.unitPrice || 0),
      retainageAmount: 0,
      retainageType: 'percent',
      retainageValue: 0,
      uom: newItem.uom,
      notes: newItem.notes || "",
    };

    onChange([...items, item]);
    setNewItem({
      itemNumber: "",
      description: "",
      quantity: 0,
      unitPrice: 0,
      uom: "",
      notes: "",
    });
  }, [items, newItem, onChange]);

  const updateItem = useCallback((id: string, updates: Partial<ScheduleOfValuesItem>) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Recalculate extended price if quantity or unit price changed
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          updated.extendedPrice = calculateExtendedPrice(
            updates.quantity !== undefined ? updates.quantity : item.quantity,
            updates.unitPrice !== undefined ? updates.unitPrice : item.unitPrice
          );
        }
        return updated;
      }
      return item;
    });
    onChange(updatedItems);
  }, [items, onChange]);

  const removeItem = useCallback((id: string) => {
    onChange(items.filter(item => item.id !== id));
  }, [items, onChange]);

  const totalAmount = calculateTotal(items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Schedule of Values
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Define the line items, quantities, and pricing for this contract.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Total: {formatCurrency(totalAmount)}
        </Badge>
      </div>

      {/* Add New Item */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Item #</Label>
                <Input
                  value={newItem.itemNumber || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, itemNumber: e.target.value }))}
                  placeholder="1.01"
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Description</Label>
                <Input
                  value={newItem.description || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Item description"
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">UOM</Label>
                <Input
                  value={newItem.uom || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, uom: e.target.value }))}
                  placeholder="EA, LF, SF..."
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.quantity || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="h-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Unit Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.unitPrice || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Notes (Optional)</Label>
                <Input
                  value={newItem.notes || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                  className="h-8"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={addItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Line Items</span>
            <Badge variant="outline" className="text-xs">
              {items.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">No items yet</h3>
              <p className="text-sm text-muted-foreground">
                Add line items to define the scope and pricing for this contract.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Item #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px]">UOM</TableHead>
                    <TableHead className="w-[100px] text-right">Quantity</TableHead>
                    <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                    <TableHead className="w-[120px] text-right">Extended</TableHead>
                    {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {readOnly ? (
                          <span className="text-sm font-medium">{item.itemNumber}</span>
                        ) : (
                          <Input
                            value={item.itemNumber}
                            onChange={(e) => updateItem(item.id, { itemNumber: e.target.value })}
                            className="h-7 text-sm"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {readOnly ? (
                          <div>
                            <div className="text-sm font-medium">{item.description}</div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, { description: e.target.value })}
                              className="h-7 text-sm"
                            />
                            <Input
                              value={item.notes || ""}
                              onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                              placeholder="Notes"
                              className="h-6 text-xs"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {readOnly ? (
                          <span className="text-sm">{item.uom}</span>
                        ) : (
                          <Input
                            value={item.uom}
                            onChange={(e) => updateItem(item.id, { uom: e.target.value })}
                            className="h-7 text-sm w-16"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {readOnly ? (
                          <span className="text-sm">{formatNumber(item.quantity)}</span>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                            className="h-7 text-sm text-right w-20"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {readOnly ? (
                          <span className="text-sm">{formatCurrency(item.unitPrice)}</span>
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="h-7 text-sm text-right w-24"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {formatCurrency(item.extendedPrice)}
                        </span>
                      </TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total Row */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Total Contract Amount:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};