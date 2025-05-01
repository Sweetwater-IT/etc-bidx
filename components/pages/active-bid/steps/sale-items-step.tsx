"use client";

import { FormData } from "@/types/IFormData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { SaleItem } from "@/types/TSaleItem";


const SaleItemsStep = ({
  currentStep,
  setCurrentStep,
  formData,
  setFormData,
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) => {
  const [saleItems, setSaleItems] = useState<SaleItem[]>(formData.saleItems);
  const [isAddingItem, setIsAddingItem] = useState(saleItems.length === 0);
  const [newItemNumber, setNewItemNumber] = useState("");

  const calculateMargin = (quotePrice: number, markup: number) => {
    if (!quotePrice || !markup) return 0;
    const sellingPrice = quotePrice * (1 + markup / 100);
    return ((sellingPrice - quotePrice) / sellingPrice) * 100;
  };

  // const handleItemNumberSubmit = () => {
  //   if (newItemNumber.trim()) {
  //     const newItem: SaleItemData = {
  //       id: Math.random().toString(36).substr(2, 9),
  //       itemNumber: newItemNumber.trim(),
  //       name: "",
  //       vendor: "",
  //       quantity: 0,
  //       quotePrice: 0,
  //       markup: 0,
  //       margin: 0,
  //       isConfiguring: true,
  //     };
  //     setSaleItems([...saleItems, newItem]);
  //     setNewItemNumber("");
  //     setIsAddingItem(false);
  //   }
  // };

  // const handleItemUpdate = (
  //   id: string,
  //   field: keyof SaleItemData,
  //   value: any
  // ) => {
  //   setSaleItems(
  //     saleItems.map((item) => {
  //       if (item.id === id) {
  //         const updatedItem = { ...item, [field]: value };
  //         if (field === "quotePrice" || field === "markup") {
  //           updatedItem.margin = calculateMargin(
  //             field === "quotePrice" ? value : item.quotePrice,
  //             field === "markup" ? value : item.markup
  //           );
  //         }
  //         return updatedItem;
  //       }
  //       return item;
  //     })
  //   );
  // };

  // const handleItemSave = (id: string) => {
  //   setSaleItems(
  //     saleItems.map((item) =>
  //       item.id === id ? { ...item, isConfiguring: false } : item
  //     )
  //   );
  //   setIsAddingItem(true);
  //   // Update form data
  //   setFormData((prev: any) => ({
  //     ...prev,
  //     saleItems: saleItems.map((item) => ({
  //       ...item,
  //       isConfiguring: undefined,
  //     })),
  //   }));
  // };

  // const handleItemDelete = (id: string) => {
  //   setSaleItems(saleItems.filter((item) => item.id !== id));
  //   // Update formData to remove the deleted item
  //   setFormData((prev: any) => ({
  //     ...prev,
  //     saleItems: prev.saleItems?.filter((item: SaleItem) => item.id !== id) || []
  //   }));
  //   if (saleItems.length === 1) {
  //     setIsAddingItem(true);
  //   }
  // };

  // const handleEditItem = (id: string) => {
  //   setSaleItems(
  //     saleItems.map((item) =>
  //       item.id === id ? { ...item, isConfiguring: true } : item
  //     )
  //   );
  //   setIsAddingItem(false);
  // };

  return (
    <div>

    </div>
  );
};

export default SaleItemsStep;
