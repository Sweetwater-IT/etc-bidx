import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
  import { Card } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  } from "@/components/ui/dropdown-menu";
  import { MoreHorizontal, MoreVertical, Pencil } from "lucide-react";
  import { useMemo } from "react";
  import { getAssociatedSignEquipment } from "@/lib/mptRentalHelperFunctions";
  
  interface EquipmentTotalsAccordionProps {
    signItems: any[];
  }
  
  const EquipmentTotalsAccordion = ({ signItems }: EquipmentTotalsAccordionProps) => {
    
    // Mock phase object to use with the helper function
    const mockPhase = useMemo(() => ({
      signs: signItems.map(item => ({
        ...item,
        associatedStructure: item.structure === 'LOOSE' ? 'none' : 
                            item.structure?.includes("4' T-III") ? 'fourFootTypeIII' :
                            item.structure?.includes("6' T-III") ? 'fourFootTypeIII' :
                            item.structure?.includes('H-FOOT') ? 'hStand' :
                            item.structure?.includes('POST') ? 'post' : 'none',
        cover: item.covers > 0,
        bLights: item.bLights || 0
      }))
    }), [signItems]);
  
    // Calculate equipment totals using the helper function
    const equipmentTotals = useMemo(() => {
      if (signItems.length === 0) {
        return {
          type3: 0,
          hStand: 0,
          post: 0,
          cover: 0,
          bLights: 0,
          acLights: 0
        };
      }
      return getAssociatedSignEquipment(mockPhase as any);
    }, [mockPhase]);
  
    const handleEdit = () => {
      // Edit functionality will be implemented later
      console.log("Edit equipment totals");
    };
  
    return (
      <Card className="p-4">
        <Accordion defaultValue="equipment-totals" type="single" collapsible>
          <AccordionItem value="equipment-totals">
            <AccordionTrigger className="py-0">
              <div className="flex items-center justify-between w-full pr-4">
                <h3 className="font-semibold">Equipment Totals Summary</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
            <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    className="flex ml-auto items-center justify-end"
                    onClick={(e) => e.stopPropagation()} // Prevent accordion toggle
                  >
                    <Button variant="ghost" size="sm" className="!p-[2px]">
                      <MoreHorizontal className="ml-auto h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              <div className="space-y-2 text-sm mt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{`4'`} Type III:</span>
                  <span>{equipmentTotals.type3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">H-Stands:</span>
                  <span>{equipmentTotals.hStand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posts:</span>
                  <span>{equipmentTotals.post}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Covers:</span>
                  <span>{equipmentTotals.cover}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">B Lights:</span>
                  <span>{equipmentTotals.bLights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AC Lights:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{`6'`} Wings:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sandbags:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metal Stands:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HI Vertical Panels:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type XI Vertical Panels:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sharps:</span>
                  <span>0</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    );
  };
  
  export default EquipmentTotalsAccordion;