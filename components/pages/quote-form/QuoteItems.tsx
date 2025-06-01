"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Pencil, Check, MoreVertical } from "lucide-react";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { AssociatedItem, QuoteItem } from "@/types/IQuoteItem";
import { useState, useEffect } from "react";
import { generateUniqueId } from "../active-bid/signs/generate-stable-id";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuoteItemsList from "./QuoteItemsList";

enum UOM_TYPES {
  EA = "EA",
  LS = "LS",
  SF = "SF",
  LF = "LF",
  EA_MO = "EA/MO",
  EA_DAY = "EA/DAY",
  HR = "HR",
}

export function QuoteItems() {
  const { quoteItems, setQuoteItems } = useQuoteForm();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSubItemId, setEditingSubItemId] = useState<string | null>(null);
  const [newQuoteItem, setNewQuoteItem] = useState<QuoteItem>({
    id: generateUniqueId(),
    itemNumber: "",
    description: "",
    uom: "",
    quantity: 0,
    unitPrice: 0,
    discount: 0,
    discountType: "percentage",
    notes: "",
    associatedItems: [],
  });

  // Add initial item when page loads
  useEffect(() => {
    if (quoteItems.length === 0) {
      handleAddNewItem();
    }
  }, []);

  // Calculate unit price for composite items (items with sub-items)
  const calculateCompositeUnitPrice = (item: QuoteItem) => {
    if (!item.associatedItems || item.associatedItems.length === 0) {
      return item.unitPrice;
    }

    return item.associatedItems.reduce(
      (acc, associatedItem) =>
        acc + associatedItem.quantity * associatedItem.unitPrice,
      0
    );
  };

  // Calculate extended price based on quantity, unit price, and discount
  const calculateExtendedPrice = (item: QuoteItem) => {
    const unitPrice = calculateCompositeUnitPrice(item);
    const basePrice = item.quantity * unitPrice;

    // If discount type is dollar, use the direct amount, otherwise calculate percentage
    const discountAmount =
      item.discountType === "dollar"
        ? item.discount
        : basePrice * (item.discount / 100);
    return (basePrice - discountAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate total value
  const totalValueCalculation = () => {
    return quoteItems
      .reduce((sum, item) => {
        const unitPrice = calculateCompositeUnitPrice(item);
        const basePrice = (item.quantity || 0) * unitPrice;

        // If discount type is dollar, use the direct amount, otherwise calculate percentage
        const discountAmount =
          item.discountType === "dollar"
            ? item.discount
            : basePrice * (item.discount / 100);
        return sum + (basePrice - discountAmount);
      }, 0)
      .toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  };

  // Handle item updates
  const handleItemUpdate = (
    itemId: string,
    field: keyof QuoteItem,
    value: string | number
  ) => {
    setQuoteItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
    // Reset editing state for sub-items when parent is saved
    setEditingSubItemId(null);
  };

  // Handle adding custom item
  const handleAddCustomItem = () => {
    if (quoteItems.some((qi) => qi.itemNumber === newQuoteItem.itemNumber))
      return;
    if (newQuoteItem.itemNumber) {
      setQuoteItems((prevState) => [
        ...prevState,
        {
          ...newQuoteItem,
        },
      ]);
      // Reset form and hide custom form
      setNewQuoteItem({
        id: generateUniqueId(),
        itemNumber: "",
        description: "",
        uom: "",
        quantity: 0,
        unitPrice: 0,
        discount: 0,
        discountType: "percentage",
        notes: "",
        associatedItems: [],
      });
      setShowCustomForm(false);
      // Reset editing state for sub-items
      setEditingSubItemId(null);
    }
  };

  // Auto-add item when form is shown
  useEffect(() => {
    if (showCustomForm) {
      handleAddCustomItem();
    }
  }, [showCustomForm]);

  // Handle removing item
  const handleRemoveItem = (itemId: string) => {
    setQuoteItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemId)
    );
  };

  // Handle adding sub-item
  const handleAddCompositeItem = (parentItem: QuoteItem) => {
    const newId = generateUniqueId();
    if (parentItem.id === newQuoteItem.id) {
      setNewQuoteItem((prev) => ({
        ...prev,
        associatedItems: [
          ...(prev.associatedItems || []),
          {
            id: newId,
            itemNumber: "",
            description: "",
            uom: "",
            quantity: 0,
            unitPrice: 0,
            notes: "",
          },
        ],
      }));
    } else {
      setQuoteItems((prevItems) =>
        prevItems.map((item) =>
          item.id === parentItem.id
            ? {
                ...item,
                associatedItems: [
                  ...(item.associatedItems || []),
                  {
                    id: newId,
                    itemNumber: "",
                    description: "",
                    uom: "",
                    quantity: 0,
                    unitPrice: 0,
                    notes: "",
                  },
                ],
              }
            : item
        )
      );
    }
    setEditingSubItemId(newId);
  };

  // Handle sub-item updates
  const handleCompositeItemUpdate = (
    parentItemId: string,
    subItemId: string,
    field: keyof AssociatedItem,
    value: string | number
  ) => {
    if (parentItemId === newQuoteItem.id) {
      setNewQuoteItem((prev) => ({
        ...prev,
        associatedItems:
          prev.associatedItems?.map((ai) =>
            ai.id === subItemId ? { ...ai, [field]: value } : ai
          ) || [],
      }));
    } else {
      setQuoteItems((prevItems) =>
        prevItems.map((item) =>
          item.id === parentItemId
            ? {
                ...item,
                associatedItems:
                  item.associatedItems?.map((ai) =>
                    ai.id === subItemId ? { ...ai, [field]: value } : ai
                  ) || [],
              }
            : item
        )
      );
    }
  };

  // Handle removing sub-item
  const handleDeleteComposite = (parentItemId: string, subItemId: string) => {
    if (parentItemId === newQuoteItem.id) {
      setNewQuoteItem((prev) => ({
        ...prev,
        associatedItems:
          prev.associatedItems?.filter((ai) => ai.id !== subItemId) || [],
      }));
    } else {
      setQuoteItems((prevItems) =>
        prevItems.map((item) =>
          item.id === parentItemId
            ? {
                ...item,
                associatedItems:
                  item.associatedItems?.filter((ai) => ai.id !== subItemId) ||
                  [],
              }
            : item
        )
      );
    }
  };

  // Handle new item form changes
  const handleCustomItemChange = (
    field: keyof QuoteItem,
    value: string | number
  ) => {
    setNewQuoteItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Função para adicionar novo item vazio no modo 'pré-adicionar'
  const handleAddNewItem = () => {
    const newItem: QuoteItem = {
      id: generateUniqueId(),
      itemNumber: "",
      description: "",
      uom: "",
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      discountType: "percentage",
      notes: "",
      associatedItems: [],
    };
    setQuoteItems((prev) => [...prev, newItem]);
  };

  return (
    <div className="rounded-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quote Items</h2>
        <Button onClick={handleAddNewItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {/* Header */}
        <div
          className="grid text-sm font-medium text-muted-foreground border-b pb-2 mb-1 gap-2" 
          style={{
            gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 2fr 2fr 40px",
          }}
        >
          <div className="uppercase">Item # / SKU</div>
          <div className="uppercase pl-2">Description</div>
          <div className="uppercase">UOM</div>
          <div className="uppercase">Qty</div>
          <div className="uppercase">Unit Price</div>
          <div className="uppercase">Discount</div>
          <div className="uppercase">Extended Price</div>
        </div>

        {/* Items */}
        <QuoteItemsList
          quoteItems={quoteItems}
          editingItemId={editingItemId}
          editingSubItemId={editingSubItemId}
          setEditingItemId={setEditingItemId}
          setEditingSubItemId={setEditingSubItemId}
          handleItemUpdate={handleItemUpdate}
          handleRemoveItem={handleRemoveItem}
          handleAddCompositeItem={handleAddCompositeItem}
          handleCompositeItemUpdate={handleCompositeItemUpdate}
          handleDeleteComposite={handleDeleteComposite}
          UOM_TYPES={UOM_TYPES}
          calculateCompositeUnitPrice={calculateCompositeUnitPrice}
          calculateExtendedPrice={calculateExtendedPrice}
        />
      </div>

      <div className="flex justify-start">
        <Button
          className="mt-4 border-none p-0 !bg-transparent shadow-none"
          variant="outline"
          onClick={handleAddNewItem}
        >
          + Add New Item
        </Button>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end space-y-1 text-sm">
        <div className="text-right">
          <div>Total Items: {quoteItems.length}</div>
          <div className="font-medium">
            Total Value: ${totalValueCalculation()}
          </div>
        </div>
      </div>
    </div>
  );
}
