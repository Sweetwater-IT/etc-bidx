import { useState, useCallback, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Calculator,
  DollarSign,
  Hash,
  Ruler,
  FileText,
  Search,
  X
} from "lucide-react";
import type { ScheduleOfValuesItem } from "@/types/job";

interface SovItem {
  id: number;
  item_number: string;
  display_item_number: string;
  description: string;
  display_name: string;
  work_type: string;
}

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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sovItems, setSovItems] = useState<SovItem[]>([]);
  const [selectedSovItem, setSelectedSovItem] = useState<SovItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [retainageType, setRetainageType] = useState<'percent' | 'dollar'>('percent');
  const [retainageValue, setRetainageValue] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Fetch SOV items on component mount
  useEffect(() => {
    const fetchSovItems = async () => {
      try {
        const response = await fetch('/api/sov-items');
        if (response.ok) {
          const data = await response.json();
          setSovItems(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching SOV items:', error);
      }
    };

    if (!readOnly) {
      fetchSovItems();
    }
  }, [readOnly]);

  const filteredSovItems = sovItems.filter(item => {
    const matchesSearch = !searchTerm ||
      item.item_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWorkType = !workTypeFilter || item.work_type === workTypeFilter;

    return matchesSearch && matchesWorkType;
  });

  const workTypes = [...new Set(sovItems.map(item => item.work_type))].sort();

  const handleAddItem = useCallback(() => {
    if (!selectedSovItem || quantity <= 0 || unitPrice < 0) return;

    const extendedPrice = calculateExtendedPrice(quantity, unitPrice);
    const retainageAmount = retainageType === 'percent'
      ? extendedPrice * (retainageValue / 100)
      : retainageValue;

    const newItem: ScheduleOfValuesItem = {
      id: Date.now().toString(),
      itemNumber: selectedSovItem.item_number,
      description: selectedSovItem.display_name,
      quantity,
      unitPrice,
      extendedPrice,
      retainageAmount,
      retainageType,
      retainageValue,
      uom: "EA", // Default UOM, could be made configurable
      notes,
      sov_item_id: selectedSovItem.id,
      work_type: selectedSovItem.work_type,
    };

    onChange([...items, newItem]);

    // Reset form
    setSelectedSovItem(null);
    setQuantity(0);
    setUnitPrice(0);
    setRetainageType('percent');
    setRetainageValue(0);
    setNotes("");
    setShowAddDialog(false);
  }, [selectedSovItem, quantity, unitPrice, retainageType, retainageValue, notes, items, onChange]);

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
          // Recalculate retainage if extended price changed
          if (updated.retainageType === 'percent') {
            updated.retainageAmount = updated.extendedPrice * (updated.retainageValue / 100);
          }
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
            Select standardized work items and set quantities and pricing for this contract.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Total: {formatCurrency(totalAmount)}
        </Badge>
      </div>

      {/* Add New Item Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add SOV Item
          </Button>
        </div>
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
                Add standardized SOV items to define the scope and pricing for this contract.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Item #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px]">Work Type</TableHead>
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
                        <span className="text-sm font-medium">{item.itemNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{item.description}</div>
                          {item.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.work_type || 'N/A'}
                        </Badge>
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

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Schedule of Values Item</DialogTitle>
            <DialogDescription>
              Select a standardized work item from the catalog and set pricing details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All work types</SelectItem>
                  {workTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SOV Items List */}
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredSovItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No items found matching your criteria.
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSovItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 ${
                        selectedSovItem?.id === item.id ? 'bg-primary/5 border-primary' : ''
                      }`}
                      onClick={() => setSelectedSovItem(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{item.item_number}</span>
                            <Badge variant="outline" className="text-xs">{item.work_type}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{item.display_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Item Details */}
            {selectedSovItem && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Selected Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium">Item Number</Label>
                      <div className="text-sm font-medium">{selectedSovItem.item_number}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Work Type</Label>
                      <div className="text-sm">{selectedSovItem.work_type}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Description</Label>
                    <div className="text-sm">{selectedSovItem.display_name}</div>
                  </div>

                  {/* Pricing Form */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Unit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Retainage Type</Label>
                      <Select value={retainageType} onValueChange={(value: 'percent' | 'dollar') => setRetainageType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percent</SelectItem>
                          <SelectItem value="dollar">Dollar Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        Retainage {retainageType === 'percent' ? '(%)' : '($)'}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={retainageValue}
                        onChange={(e) => setRetainageValue(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Notes (Optional)</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes"
                    />
                  </div>

                  {/* Preview */}
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="text-xs font-medium mb-2">Preview:</div>
                    <div className="text-sm">
                      Extended Price: {formatCurrency(calculateExtendedPrice(quantity, unitPrice))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!selectedSovItem || quantity <= 0 || unitPrice < 0}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};