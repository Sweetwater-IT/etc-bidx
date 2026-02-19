import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { fetchSignDesignations } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PrimarySign, SecondarySign, SheetingType, SignsApiResponse, PataKit, PtsKit, SignDesignation } from '@/types/MPTEquipment';
import { Check, Search, Plus, Package } from 'lucide-react';
import React, { Dispatch, SetStateAction, useEffect, useState, useMemo } from 'react';
import { processSignData } from './process-sign-data';



interface Props {
  localSign: PrimarySign | SecondarySign;
  setLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>;
  onDesignationSelected?: (updatedSign: PrimarySign | SecondarySign) => void;
  onKitSelected?: (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => void;
}

const DesignationSearcher = ({ localSign, setLocalSign, onDesignationSelected, onKitSelected }: Props) => {
  const [open, setOpen] = useState(false);
  const [apiData, setApiData] = useState<SignsApiResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState<SignDesignation | null>(null);
  const [dimensionModalOpen, setDimensionModalOpen] = useState(false);
  const [kitPreviewModalOpen, setKitPreviewModalOpen] = useState(false);
  const [selectedKitForPreview, setSelectedKitForPreview] = useState<PataKit | PtsKit | null>(null);
  const [kitPreviewType, setKitPreviewType] = useState<'pata' | 'pts' | null>(null);
  const [kitContentsWithImages, setKitContentsWithImages] = useState<Array<any>>([]);
  const [variantSelectionModalOpen, setVariantSelectionModalOpen] = useState(false);
  const [selectedKitForVariant, setSelectedKitForVariant] = useState<PataKit | PtsKit | null>(null);
  const [kitVariantType, setKitVariantType] = useState<'pata' | 'pts' | null>(null);

  useEffect(() => {
    const loadSignData = async () => {
      try {
        const response = await fetch('/api/signs');
        const data = await response.json();

        if (data.success && data.data) {
          setApiData(data.data);
        } else {
          console.warn("No sign data returned from API");
          setApiData({ signs: [], pataKits: [], ptsKits: [] });
        }
      } catch (error) {
        console.error("Error fetching sign data:", error);
        setApiData({ signs: [], pataKits: [], ptsKits: [] });
      }
    };

    loadSignData();
  }, []);

  const filteredResults = useMemo(() => {
    if (!apiData) return { signs: [], pataKits: [], ptsKits: [] };

    if (!searchQuery.trim()) {
      return apiData;
    }

    const query = searchQuery.toLowerCase();

    // Filter signs
    const filteredSigns = apiData.signs.filter(sign =>
      sign.designation.toLowerCase().includes(query) ||
      sign.description.toLowerCase().includes(query)
    );

    // Filter kits that contain signs matching the query
    const signDesignations = new Set(filteredSigns.map(s => s.designation));

    const filteredPataKits = apiData.pataKits.filter(kit =>
      kit.contents.some(content => signDesignations.has(content.sign_designation)) ||
      kit.code.toLowerCase().includes(query) ||
      kit.description.toLowerCase().includes(query)
    );

    const filteredPtsKits = apiData.ptsKits.filter(kit =>
      kit.contents.some(content => signDesignations.has(content.sign_designation)) ||
      kit.code.toLowerCase().includes(query) ||
      kit.description.toLowerCase().includes(query)
    );

    return {
      signs: filteredSigns,
      pataKits: filteredPataKits,
      ptsKits: filteredPtsKits
    };
  }, [apiData, searchQuery]);

  const handleSelectDesignation = (designation: SignDesignation) => {
    setSelectedDesignation(designation);
    setDimensionModalOpen(true);
  };

  const handleSelectDimension = (width: number, height: number) => {
    if (!selectedDesignation) return;

    const updatedSign = {
      ...localSign,
      designation: selectedDesignation.designation,
      width,
      height,
      sheeting: selectedDesignation.sheeting,
      description: selectedDesignation.description,
    };

    setLocalSign(updatedSign);
    if (onDesignationSelected) {
      onDesignationSelected(updatedSign);
    }
    setOpen(false);
    setDimensionModalOpen(false);
    setSelectedDesignation(null);
    setSearchQuery("");
  };

  const handleCustomDesignation = () => {
    const updatedSign = {
      ...localSign,
      designation: "",
      width: 0,
      height: 0,
      sheeting: localSign.sheeting,
      description: "",
      isCustom: true,
    };
    setLocalSign(updatedSign);
    if (onDesignationSelected) {
      onDesignationSelected(updatedSign);
    }
    setOpen(false);
    setSearchQuery("");
  };

  const handleSelectKit = (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
    if (onKitSelected) {
      onKitSelected(kit, kitType);
    }
    setOpen(false);
    setSearchQuery("");
  };

  const handleSelectKitForPreview = async (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
    // If kit has variants, show variant selection first
    if (kit.has_variants && kit.variants.length > 0) {
      setSelectedKitForVariant(kit);
      setKitVariantType(kitType);
      setVariantSelectionModalOpen(true);
      return;
    }

    // Otherwise, proceed directly to kit preview
    await showKitPreview(kit, kitType);
  };

  const showKitPreview = async (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
    setSelectedKitForPreview(kit);
    setKitPreviewType(kitType);

    // Enrich kit contents with sign images and descriptions
    if (apiData) {
      const signMap = new Map();
      apiData.signs.forEach(sign => {
        signMap.set(sign.designation, sign);
      });

      const enrichedContents = kit.contents.map(content => {
        const signData = signMap.get(content.sign_designation);
        return {
          ...content,
          image_url: signData?.image_url,
          description: signData?.description,
          sheeting: signData?.sheeting
        };
      });

      setKitContentsWithImages(enrichedContents);
    }

    setKitPreviewModalOpen(true);
  };

  const handleVariantSelected = async (variant: any) => {
    if (!selectedKitForVariant || !kitVariantType) return;

    // For now, variants use the same contents as the base kit
    // In a full implementation, variants might have different contents
    await showKitPreview(selectedKitForVariant, kitVariantType);
    setVariantSelectionModalOpen(false);
    setSelectedKitForVariant(null);
    setKitVariantType(null);
  };

  const handleConfirmKitSelection = () => {
    if (selectedKitForPreview && kitPreviewType && onKitSelected) {
      onKitSelected(selectedKitForPreview, kitPreviewType);
    }
    setKitPreviewModalOpen(false);
    setSelectedKitForPreview(null);
    setKitPreviewType(null);
    setOpen(false);
    setSearchQuery("");
  };

  const closeModals = () => {
    setOpen(false);
    setDimensionModalOpen(false);
    setKitPreviewModalOpen(false);
    setSelectedDesignation(null);
    setSelectedKitForPreview(null);
    setKitPreviewType(null);
    setSearchQuery("");
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full sm:w-[300px] justify-start text-left font-normal"
      >
        <span className="truncate">
          {localSign.designation
            ? `${localSign.designation}${localSign.width && localSign.height ? ` (${localSign.width} x ${localSign.height})` : ''}`
            : "Select designation..."
          }
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Select Sign Designation</DialogTitle>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>

          {/* Fixed Controls Section */}
          <div className="px-6 py-4 space-y-4 bg-background border-b">
            {/* Add Custom Designation Button */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={handleCustomDesignation}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Custom Designation
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search designations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable Content with Sections */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
            {/* MUTCD SIGNS Section */}
            {(filteredResults.signs.length > 0 || (!searchQuery && apiData?.signs.length === 0)) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">MUTCD SIGNS</h3>
                <div className="space-y-2">
                  {filteredResults.signs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No MUTCD signs found matching your search." : "No MUTCD signs available."}
                    </div>
                  ) : (
                    filteredResults.signs.map((sign, index) => (
                      <div
                        key={sign.designation}
                        onClick={() => handleSelectDesignation(sign)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50 border rounded-lg p-4",
                          localSign.designation === sign.designation && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {sign.image_url ? (
                              <img
                                src={sign.image_url}
                                alt={sign.designation}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-full h-full flex items-center justify-center text-muted-foreground text-xs';
                                    fallback.textContent = sign.designation.substring(0, 2).toUpperCase();
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-muted-foreground text-xs font-medium">
                                {sign.designation.substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                  {sign.designation}
                                  {localSign.designation === sign.designation && (
                                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {sign.description || '-'}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{sign.dimensions.length} size{sign.dimensions.length !== 1 ? 's' : ''} available</span>
                                  <span>{sign.sheeting}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PATA Kits Section */}
            {(filteredResults.pataKits.length > 0 || (!searchQuery && apiData?.pataKits.length === 0)) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">PATA Kits</h3>
                <div className="space-y-2">
                  {filteredResults.pataKits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No PATA kits found matching your search." : "No PATA kits available."}
                    </div>
                  ) : (
                    filteredResults.pataKits.map((kit) => (
                      <div
                        key={kit.id}
                        onClick={() => handleSelectKitForPreview(kit, 'pata')}
                        className="cursor-pointer transition-colors hover:bg-muted/50 border rounded-lg p-4 bg-blue-50/50 border-blue-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded border bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {kit.image_url ? (
                              <img
                                src={kit.image_url}
                                alt={`PATA Kit ${kit.code}`}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-full h-full flex items-center justify-center text-blue-600';
                                    fallback.innerHTML = '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <Package className="h-8 w-8 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                  {kit.code}
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    KIT
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {kit.description || '-'}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{kit.signCount} sign{kit.signCount !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PTS Kits Section */}
            {(filteredResults.ptsKits.length > 0 || (!searchQuery && apiData?.ptsKits.length === 0)) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">PTS Kits</h3>
                <div className="space-y-2">
                  {filteredResults.ptsKits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No PTS kits found matching your search." : "No PTS kits available."}
                    </div>
                  ) : (
                    filteredResults.ptsKits.map((kit) => (
                      <div
                        key={kit.id}
                        onClick={() => handleSelectKitForPreview(kit, 'pts')}
                        className="cursor-pointer transition-colors hover:bg-muted/50 border rounded-lg p-4 bg-green-50/50 border-green-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded border bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {kit.image_url ? (
                              <img
                                src={kit.image_url}
                                alt={`PTS Kit ${kit.code}`}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-full h-full flex items-center justify-center text-green-600';
                                    fallback.innerHTML = '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <Package className="h-8 w-8 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                  {kit.code}
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    KIT
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {kit.description || '-'}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{kit.signCount} sign{kit.signCount !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredResults.signs.length === 0 && filteredResults.pataKits.length === 0 && filteredResults.ptsKits.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                No results found matching your search.
              </div>
            )}
          </div>

          <Separator />
          <div className="flex justify-end items-center p-4 px-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dimension Selection Modal */}
      <Dialog open={dimensionModalOpen} onOpenChange={setDimensionModalOpen}>
        <DialogContent className="max-w-2xl h-[500px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>
                Select Size for {selectedDesignation?.designation}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedDesignation?.description}
              </p>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>

          {/* Dimension Options */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDesignation?.dimensions.map((dim) => (
                <button
                  key={`${dim.width}x${dim.height}`}
                  onClick={() => handleSelectDimension(dim.width, dim.height)}
                  className={cn(
                    "p-4 border rounded-lg text-left transition-colors hover:bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    localSign.designation === selectedDesignation?.designation &&
                    localSign.width === dim.width &&
                    localSign.height === dim.height
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedDesignation.image_url ? (
                        <img
                          src={selectedDesignation.image_url}
                          alt={selectedDesignation.designation}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center text-muted-foreground text-xs';
                              fallback.textContent = selectedDesignation.designation.substring(0, 2).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium">
                          {selectedDesignation.designation.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {dim.width}″ × {dim.height}″
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedDesignation.sheeting}
                          </div>
                        </div>
                        {localSign.designation === selectedDesignation?.designation &&
                         localSign.width === dim.width &&
                         localSign.height === dim.height && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />
          <div className="flex justify-between items-center p-4 px-6">
            <Button
              variant="outline"
              onClick={() => setDimensionModalOpen(false)}
            >
              Back to Designations
            </Button>
            <Button variant="outline" onClick={closeModals}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kit Preview Modal */}
      <Dialog open={kitPreviewModalOpen} onOpenChange={setKitPreviewModalOpen}>
        <DialogContent className="max-w-6xl h-[700px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>
                {kitPreviewType?.toUpperCase()} Kit: {selectedKitForPreview?.code}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedKitForPreview?.description}
              </p>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>

          {/* Kit Content */}
          <div className="flex-1 min-h-0 flex">
            {/* Left Side - Kit Image */}
            <div className="w-1/2 p-6 border-r border-border">
              <h3 className="text-lg font-semibold mb-4">Kit Diagram</h3>
              {selectedKitForPreview?.image_url ? (
                <img
                  src={selectedKitForPreview.image_url}
                  alt={`${kitPreviewType?.toUpperCase()} Kit ${selectedKitForPreview.code} Diagram`}
                  className="w-full h-auto max-h-[500px] object-contain border rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                    e.currentTarget.alt = "Diagram failed to load";
                  }}
                />
              ) : (
                <div className="w-full h-[400px] bg-muted/50 flex items-center justify-center rounded border border-dashed">
                  <p className="text-muted-foreground text-sm">No diagram available</p>
                </div>
              )}
            </div>

            {/* Right Side - Sign List */}
            <div className="w-1/2 p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Signs in Kit ({kitContentsWithImages.length})</h3>
              <div className="flex-1 overflow-y-auto space-y-3">
                {kitContentsWithImages.map((content, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card"
                  >
                    <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {content.image_url ? (
                        <img
                          src={content.image_url}
                          alt={content.sign_designation}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center text-muted-foreground text-xs';
                              fallback.textContent = content.sign_designation.substring(0, 2).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium">
                          {content.sign_designation.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {content.sign_designation}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {content.description || '-'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Qty: {content.quantity}
                            </span>
                            {content.sheeting && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                {content.sheeting}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />
          <div className="flex justify-between items-center p-4 px-6">
            <Button
              variant="outline"
              onClick={() => setKitPreviewModalOpen(false)}
            >
              Back to Kits
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModals}>
                Cancel
              </Button>
              <Button onClick={handleConfirmKitSelection}>
                Add Kit to Estimate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Selection Modal */}
      <Dialog open={variantSelectionModalOpen} onOpenChange={setVariantSelectionModalOpen}>
        <DialogContent className="max-w-2xl h-[500px] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>
                Select Variant for {kitVariantType?.toUpperCase()} Kit: {selectedKitForVariant?.code}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedKitForVariant?.description}
              </p>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>

          {/* Variant Options */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {selectedKitForVariant?.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelected(variant)}
                  className="w-full p-4 border rounded-lg text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {variant.label}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {variant.description || 'No description'}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {variant.finished && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Finished
                          </span>
                        )}
                        {variant.blights > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            {variant.blights} B-lights
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />
          <div className="flex justify-between items-center p-4 px-6">
            <Button
              variant="outline"
              onClick={() => setVariantSelectionModalOpen(false)}
            >
              Back to Kits
            </Button>
            <Button variant="outline" onClick={closeModals}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DesignationSearcher;
