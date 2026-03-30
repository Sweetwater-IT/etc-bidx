import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QuantityInput } from "@/components/ui/quantity-input";
import { QuoteItem } from "@/types/IQuoteItem";
import { cn } from "@/lib/utils";
import { restorePointerEvents } from "@/lib/pointer-events-fix";

interface ProductOption {
  id: string | number;
  item_number: string;
  description: string;
  uom: string;
  notes?: string;
  source?: string | null;
}

interface QuoteItemRowProps {
  item: QuoteItem;
  products: ProductOption[];
  loading: boolean;
  saving: boolean;
  onSelectProduct: (item: QuoteItem, product?: ProductOption) => void;
  onEditItem: (item: QuoteItem) => void;
  onRemoveItem: (itemId: string) => void;
  onQuickQuantityUpdate: (item: QuoteItem, quantity: number) => Promise<void> | void;
  calculateExtendedPrice: (item: QuoteItem) => string;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getSourceLabel(source?: string | null) {
  switch (source) {
    case "service_items":
      return "Service Items";
    case "rental":
      return "Rental Items";
    case "sale":
      return "Sale Items";
    default:
      return "Other";
  }
}

export default function QuoteItemRow({
  item,
  products,
  loading,
  saving,
  onSelectProduct,
  onEditItem,
  onRemoveItem,
  onQuickQuantityUpdate,
  calculateExtendedPrice,
}: QuoteItemRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [quantityValue, setQuantityValue] = useState(Number(item.quantity || 0));
  const skipCommitRef = useRef(true);

  useEffect(() => {
    skipCommitRef.current = true;
    setQuantityValue(Number(item.quantity || 0));
  }, [item.quantity]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const itemNumber = product.item_number?.toLowerCase() || "";
      const description = product.description?.toLowerCase() || "";
      return itemNumber.includes(query) || description.includes(query);
    });
  }, [products, search]);

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, ProductOption[]>();

    filteredProducts.forEach((product) => {
      const label = getSourceLabel(product.source);
      const existing = groups.get(label) || [];
      existing.push(product);
      groups.set(label, existing);
    });

    return Array.from(groups.entries());
  }, [filteredProducts]);

  const commitQuantity = useCallback(async () => {
    const nextQuantity = Math.max(0, Number(quantityValue) || 0);

    if (nextQuantity === Number(item.quantity || 0)) {
      setQuantityValue(Number(item.quantity || 0));
      return;
    }

    await onQuickQuantityUpdate(item, nextQuantity);
  }, [item, onQuickQuantityUpdate, quantityValue]);

  useEffect(() => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void commitQuantity();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [commitQuantity, quantityValue]);

  return (
    <div
      className="grid min-w-[980px] items-center gap-2 border-b border-border px-4 py-3 text-sm transition-colors hover:bg-muted/20"
      style={{
        gridTemplateColumns: "1.7fr 2.4fr 0.8fr 0.6fr 1fr 1fr 0.6fr 1fr 40px",
      }}
    >
      <div className="min-w-0">
        <Popover
          open={pickerOpen}
          onOpenChange={(nextOpen) => {
            setPickerOpen(nextOpen);
            if (!nextOpen) {
              restorePointerEvents();
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={pickerOpen}
              className="h-9 w-full justify-between text-left font-normal"
              disabled={saving}
            >
              <span className="truncate">
                {item.itemNumber
                  ? `${item.itemNumber}${item.description ? ` - ${item.description}` : ""}`
                  : "Search or add a product..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[420px] p-0"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              restorePointerEvents();
            }}
          >
            <Command>
              <CommandInput
                placeholder="Search products..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandItem
                  value="custom"
                  onSelect={() => {
                    onSelectProduct(item);
                    setPickerOpen(false);
                    setSearch("");
                    restorePointerEvents();
                  }}
                >
                  <span className="font-medium italic">+ Custom</span>
                </CommandItem>
                <CommandEmpty>
                  {loading ? "Loading..." : "No products found."}
                </CommandEmpty>
                {groupedProducts.map(([groupLabel, groupItems]) => (
                  <CommandGroup key={groupLabel} heading={groupLabel}>
                    {groupItems.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={`${product.item_number} ${product.description}`}
                        onSelect={() => {
                          onSelectProduct(item, product);
                          setPickerOpen(false);
                          setSearch("");
                          restorePointerEvents();
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            item.itemNumber === product.item_number ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">
                          {product.item_number} - {product.description}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <button
        type="button"
        className="truncate text-left text-sm text-foreground hover:text-primary"
        onClick={() => onEditItem(item)}
        disabled={saving}
      >
        {item.description || <span className="opacity-50">—</span>}
      </button>

      <button
        type="button"
        className="text-center text-sm text-foreground hover:text-primary"
        onClick={() => onEditItem(item)}
        disabled={saving}
      >
        {item.uom || <span className="opacity-50">—</span>}
      </button>

      <button
        type="button"
        className="text-center text-sm text-foreground hover:text-primary"
        onClick={(event) => event.preventDefault()}
        disabled={saving}
      >
        <QuantityInput
          value={quantityValue}
          min={0}
          disabled={saving}
          onChange={(value) => setQuantityValue(value)}
          onBlur={() => {
            void commitQuantity();
          }}
          inputClassName="h-7 text-sm"
        />
      </button>

      <button
        type="button"
        className="text-left text-sm text-foreground hover:text-primary"
        onClick={() => onEditItem(item)}
        disabled={saving}
      >
        {item.unitPrice ? `$${formatCurrency(Number(item.unitPrice))}` : <span className="opacity-50">—</span>}
      </button>

      <button
        type="button"
        className="text-left text-sm text-foreground hover:text-primary"
        onClick={() => onEditItem(item)}
        disabled={saving}
      >
        {item.discount ? (
          item.discountType === "dollar" ? (
            `$${formatCurrency(Number(item.discount))}`
          ) : (
            `${Number(item.discount).toFixed(2)}%`
          )
        ) : (
          <span className="opacity-50">—</span>
        )}
      </button>

      <button
        type="button"
        className="text-left text-sm text-foreground hover:text-primary"
        onClick={() => onEditItem(item)}
        disabled={saving}
      >
        {item.is_tax_percentage ? `${Number(item.tax || 0).toFixed(2)}%` : <span className="opacity-50">No</span>}
      </button>

      <div className="text-left text-sm text-foreground">
        {item.unitPrice && item.quantity ? (
          `$${calculateExtendedPrice(item)}`
        ) : (
          <span className="opacity-50">—</span>
        )}
      </div>

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="!p-[2px]" disabled={saving}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditItem(item)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemoveItem(String(item.id))}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
