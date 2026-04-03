import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Trash2, Pencil, MoreVertical, X } from "lucide-react";
import { useState, useEffect } from "react";
import { ProductSheet } from "./ProductSheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { ButtonGroup } from "@/components/ui/button-group";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";
import { restorePointerEvents } from "@/lib/pointer-events-fix";

export default function QuoteItemRow({
  item,
  isEditing,
  editingSubItemId,
  setEditingItemId,
  setEditingSubItemId,
  handleItemUpdate,
  handleRemoveItem,
  handleAddCompositeItem,
  handleCompositeItemUpdate,
  handleDeleteComposite,
  UOM_TYPES,
  calculateCompositeUnitPrice,
  calculateExtendedPrice,
  products,
  loading
}) {
  const [productInput, setProductInput] = useState(item.itemNumber || "");
  const [activeSection, setActiveSection] = useState<'all' | 'service_items' | 'sale' | 'rental'>('all');

  const [openProductSheet, setOpenProductSheet] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { quoteMetadata } = useQuoteForm()
  const [newProduct, setNewProduct] = useState({
    itemNumber: "",
    description: "",
    uom: "",
    quantity: "",
    unitPrice: "",
    discountType: "dollar",
    discount: "",
    notes: "",
    tax: "",
    is_tax_percentage: false,
  });
  const [digits, setDigits] = useState({
    unitPrice: item.unitPrice
      ? (item.unitPrice * 100).toString().padStart(3, "0")
      : "000",
    discount: item.discount
      ? (item.discount * 100).toString().padStart(3, "0")
      : "000",
  });

  useEffect(() => {
    setProductInput(item.itemNumber || "");
  }, [item.itemNumber]);

  useEffect(() => {
    if (isEditing) {
      setDigits({
        unitPrice: item.unitPrice
          ? (item.unitPrice * 100).toString().padStart(3, "0")
          : "000",
        discount: item.discount
          ? (item.discount * 100).toString().padStart(3, "0")
          : "000",
      });
    }
  }, [isEditing, item.unitPrice, item.discount]);

  function formatDecimal(value: number): string {
    if (isNaN(value)) return "0.00";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatPercentage(value: string): string {
    return (parseInt(value, 10) / 100).toFixed(2);
  }

  function handleNextDigits(
    current: string,
    inputType: string,
    data: string
  ): string {
    let nextDigits = current;

    if (inputType === "insertText" && /\d/.test(data)) {
      nextDigits = current + data;
    } else if (inputType === "deleteContentBackward") {
      nextDigits = current.slice(0, -1);
    }

    return nextDigits.padStart(3, "0");
  }

  useEffect(() => {
    if (openProductSheet && editingSubItemId) {
      const subItem = item.associatedItems?.find(
        (subItemEntry) => subItemEntry.id === editingSubItemId
      );

      if (subItem) {
        setNewProduct({
          itemNumber: subItem.itemNumber || "",
          description: subItem.description || "",
          uom: subItem.uom || "",
          quantity: subItem.quantity || 0,
          unitPrice: subItem.unitPrice || "",
          discountType: subItem.discountType || "dollar",
          discount: subItem.discount || "",
          notes: subItem.notes || "",
          tax: "",
          is_tax_percentage: false,
        });
        setDigits({
          unitPrice: subItem.unitPrice
            ? (subItem.unitPrice * 100).toString().padStart(3, "0")
            : "000",
          discount: subItem.discount
            ? (subItem.discount * 100).toString().padStart(3, "0")
            : "000",
        });
      }
    }
  }, [openProductSheet, editingSubItemId, item.associatedItems]);

  const handleProductSelect = (product: any) => {

    setShowDropdown(false);

    handleItemUpdate(item.id, "fullItem", {
      ...item,
      itemNumber: product.item_number,
      description: product.description,
      uom: product.uom,
      notes: product.notes
    });

    setOpenProductSheet(true);
    setEditingItemId(item.id);
    setEditingSubItemId(null);
  };

  const filteredProducts = products?.filter((p) => {
    const matchesSearch =
      p.item_number.toLowerCase().includes(productInput.toLowerCase()) ||
      p.description.toLowerCase().includes(productInput.toLowerCase());

    const matchesSection = activeSection === 'all' || p.source === activeSection;

    return matchesSearch && matchesSection;
  });

  return (
    <>
      <div
        className={`grid min-w-[980px] items-center gap-2 border-b border-border px-4 py-3 text-sm transition-colors hover:bg-muted/20`}
        style={{
          gridTemplateColumns: "1.5fr 2.5fr 0.8fr 0.5fr 1fr 1fr 0.4fr 1fr 40px",
        }}
      >
        <div className="w-[150px]">
          <Select
            value={item.itemNumber || undefined}
            open={showDropdown}
            onOpenChange={setShowDropdown}
            onValueChange={(value) => {
              if (value === "add_new") {
                setOpenProductSheet(true);
                setEditingItemId(item.id);
                setEditingSubItemId(null);
                return;
              }
              const selected = filteredProducts?.find(p => p.item_number === value);
              if (selected) handleProductSelect(selected);
            }}
          >
            <SelectTrigger className="h-9 w-full bg-transparent text-sm text-foreground">
              <SelectValue placeholder="Search or add a product...">
                {item.itemNumber
                  ? `${item.itemNumber} - ${item.description}`
                  : "Search or add a product..."}
              </SelectValue>
            </SelectTrigger>

            <SelectContent className="max-h-80 w-[450px] p-2">
              <Command>
                <CommandInput
                  placeholder="Search..."
                  value={productInput}
                  onValueChange={(value) => setProductInput(value)}
                  autoFocus
                />
                <CommandList>
                  <CommandItem
                    key="custom"
                    value="custom"
                    onSelect={() => {
                      setOpenProductSheet(true);
                      setEditingItemId(item.id);
                      setEditingSubItemId(null);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="flex items-center w-full">
                      <span className="font-medium italic">+ Custom</span>
                    </div>
                  </CommandItem>

                  <CommandGroup heading="Service Items">
                    {filteredProducts
                      .filter(p => p.source === 'service_items')
                      .map((p) => (
                        <CommandItem key={p.id} onSelect={() => handleProductSelect(p)}>
                          {p.item_number} - {p.description}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                  <CommandGroup heading="Rental Items">
                    {filteredProducts
                      .filter(p => p.source === 'rental')
                      .map((p) => (
                        <CommandItem key={p.id} onSelect={() => handleProductSelect(p)}>
                          {p.item_number} - {p.description}
                        </CommandItem>
                      ))}
                  </CommandGroup>

                  <CommandGroup heading="Sale Items">
                    {filteredProducts
                      .filter(p => p.source === 'sale')
                      .map((p) => (
                        <CommandItem key={p.id} onSelect={() => handleProductSelect(p)}>
                          {p.item_number} - {p.description}
                        </CommandItem>
                      ))}
                  </CommandGroup>

                  {filteredProducts.length === 0 && !loading && (
                    <div className="px-3 py-2 text-foreground">No products found</div>
                  )}

                  {loading && <div className="px-3 py-2 text-foreground">Loading...</div>}
                </CommandList>
              </Command>
            </SelectContent>
          </Select>

        </div>

        {/* Descrição */}
        <div className="w-full text-center text-sm text-foreground">
          {item.description ? (
            item.description
          ) : (
            <span className="opacity-50">—</span>
          )}
        </div>
        <div className="text-center text-sm text-foreground">
          {item.uom ? item.uom : <span className="opacity-50">—</span>}
        </div>
        {/* Qty: stepper com input */}
        <div className="flex flex-row  justify-center items-center">
          <ButtonGroup className="items-center flex flex-row justify-center">
            {/* <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-accent"
              onClick={() =>
                handleItemUpdate(
                  item.id,
                  "quantity",
                  Math.max(0, Number(item.quantity || 0) - 1)
                )
              }
              tabIndex={-1}
            >
              -
            </Button> */}
            <Input
              min={0}
              value={item.quantity || 0}
              onChange={(e) =>
                handleItemUpdate(
                  item.id,
                  "quantity",
                  Math.max(0, Number(e.target.value))
                )
              }
              className="no-spinner w-14 h-7 text-center rounded-none border-x-0 bg-background focus-visible:ring-0"
            />
            {/* <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-accent"
              onClick={() =>
                handleItemUpdate(item.id, "quantity", Number(item.quantity || 0) + 1)
              }
              tabIndex={-1}
            >
              +
            </Button> */}
          </ButtonGroup>
        </div>
        <div className="text-sm text-foreground">
          {item.unitPrice ? (
            "$" + formatDecimal(Number(item.unitPrice))
          ) : (
            <span className="opacity-50">—</span>
          )}
        </div>
        <div className="text-sm text-foreground">
          {item.discount !== undefined && item.discount !== null && item.discount !== 0 ? (
            item.discountType === "dollar" ? (
              "$" + formatDecimal(Number(item.discount)) 
            ) : (
              `${Number(item.discount).toFixed(2)}%`
            )
          ) : (
            <span className="opacity-50">—</span>
          )}
        </div>
        <div className="flex items-center justify-start">
          <Checkbox
            className="w-4 h-4 shadow-md"
            checked={!!item.is_tax_percentage}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;

              const newItem = {
                ...item,
                is_tax_percentage: isChecked,
                tax: isChecked ? (quoteMetadata?.tax_rate ?? 6) : 0,
              };

              handleItemUpdate(item.id, "fullItem", newItem);
            }}
          />
        </div>
        <div className="w-full text-start text-sm text-foreground">
          {item.unitPrice && item.quantity ? (
            `$${calculateExtendedPrice(item)}`
          ) : (
            <span className="opacity-50">—</span>
          )}
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="flex items-center justify-center"
            >
              <Button variant="ghost" size="sm" className="!p-[2px]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setOpenProductSheet(true);
                  setEditingItemId(item.id);
                  setEditingSubItemId(null);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRemoveItem(item.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {openProductSheet && (
        <ProductSheet
          open={openProductSheet}
          onOpenChange={(nextOpen) => {
            setOpenProductSheet(nextOpen)
            if (!nextOpen) {
              restorePointerEvents()
            }
          }}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          digits={digits}
          setDigits={setDigits}
          UOM_TYPES={UOM_TYPES}
          formatDecimal={formatDecimal}
          formatPercentage={formatPercentage}
          handleNextDigits={handleNextDigits}
          editingSubItemId={editingSubItemId}
          handleItemUpdate={handleItemUpdate}
          item={item}
          setProductInput={setProductInput}
          setEditingItemId={setEditingItemId}
          setEditingSubItemId={setEditingSubItemId}
        />
      )}
    </>
  );
}
