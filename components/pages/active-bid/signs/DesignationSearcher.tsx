'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  PrimarySign,
  SecondarySign,
  PataKit,
  PtsKit,
  SignDesignation,
} from '@/types/MPTEquipment';
import { Check, Search, Plus, Package } from 'lucide-react';
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import KitConfigurationTable from './KitConfigurationTable';
import { generateUniqueId } from './generate-stable-id';

interface Props {
  localSign: PrimarySign | SecondarySign;
  setLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>;
  onDesignationSelected?: (updatedSign: PrimarySign | SecondarySign) => void;
  onKitSelected?: (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => void;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DesignationSearcher = ({
  localSign,
  setLocalSign,
  onDesignationSelected,
  onKitSelected,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('mutcd');

  // Independent search per tab
  const [mutcdSearch, setMutcdSearch] = useState('');
  const [pataSearch, setPataSearch] = useState('');
  const [ptsSearch, setPtsSearch] = useState('');

  // Data states
  const [signs, setSigns] = useState<SignDesignation[]>([]);
  const [pataKits, setPataKits] = useState<PataKit[]>([]);
  const [ptsKits, setPtsKits] = useState<PtsKit[]>([]);

  // Modal states
  const [selectedDesignation, setSelectedDesignation] = useState<SignDesignation | null>(null);
  const [dimensionModalOpen, setDimensionModalOpen] = useState(false);
  const [kitPreviewModalOpen, setKitPreviewModalOpen] = useState(false);
  const [selectedKitForPreview, setSelectedKitForPreview] = useState<PataKit | PtsKit | null>(null);
  const [kitPreviewType, setKitPreviewType] = useState<'pata' | 'pts' | null>(null);
  const [kitContentsWithImages, setKitContentsWithImages] = useState<Array<any>>([]);
  const [variantSelectionModalOpen, setVariantSelectionModalOpen] = useState(false);
  const [selectedKitForVariant, setSelectedKitForVariant] = useState<PataKit | PtsKit | null>(null);
  const [kitVariantType, setKitVariantType] = useState<'pata' | 'pts' | null>(null);
  const [kitConfigurationModalOpen, setKitConfigurationModalOpen] = useState(false);
  const [selectedKitForConfiguration, setSelectedKitForConfiguration] = useState<PataKit | PtsKit | null>(null);
  const [kitConfigurationType, setKitConfigurationType] = useState<'pata' | 'pts' | null>(null);

  // Fetch all data once on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // MUTCD signs with dimensions transformation
        const { data: signsDataRaw } = await supabase
          .from('signs_all')
          .select('id, designation, description, category, sizes, sheeting, image_url')
          .order('designation');

        const signsData: SignDesignation[] = (signsDataRaw || []).map((sign: any) => {
          const dimensions = (sign.sizes || []).map((sizeStr: string) => {
            const [widthStr, heightStr] = sizeStr.split(' x ');
            const width = parseFloat(widthStr);
            const height = parseFloat(heightStr);
            return !isNaN(width) && !isNaN(height) ? { width, height } : null;
          }).filter((dim): dim is { width: number; height: number } => dim !== null);

          return {
            ...sign,
            dimensions: dimensions.length > 0 ? dimensions : [{ width: 0, height: 0 }],
          };
        });

        setSigns(signsData);

        // PATA kits + contents (flat fetch)
        const { data: pataKitsData } = await supabase
          .from('pata_kits')
          .select('id, code, description, image_url, finished, reviewed, has_variants')
          .order('code');

        const pataKitsWithContents = await Promise.all(
          (pataKitsData || []).map(async (kit) => {
            const { data: contents } = await supabase
              .from('pata_kit_contents')
              .select('sign_designation, quantity, blight_quantity')
              .eq('pata_kit_code', kit.code);

            return {
              ...kit,
              contents: contents || [],
              signCount: contents?.length || 0,
              variants: [],
            };
          })
        );

        setPataKits(pataKitsWithContents);

        // PTS kits + contents
        const { data: ptsKitsData } = await supabase
          .from('pts_kits')
          .select('id, code, description, image_url, finished, reviewed, has_variants')
          .order('code');

        const ptsKitsWithContents = await Promise.all(
          (ptsKitsData || []).map(async (kit) => {
            const { data: contents } = await supabase
              .from('pts_kit_contents')
              .select('sign_designation, quantity')
              .eq('pts_kit_code', kit.code);

            return {
              ...kit,
              contents: contents || [],
              signCount: contents?.length || 0,
              variants: [],
            };
          })
        );

        setPtsKits(ptsKitsWithContents);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData(); 
  }, []);

  // Filtered lists per tab
  const filteredSigns = useMemo(() => {
    if (!mutcdSearch.trim()) return signs;
    const q = mutcdSearch.toLowerCase();
    return signs.filter(
      (s) =>
        s.designation.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [signs, mutcdSearch]);

  const filteredPataKits = useMemo(() => {
    if (!pataSearch.trim()) return pataKits;
    const q = pataSearch.toLowerCase();
    return pataKits.filter(
      (kit) =>
        kit.code.toLowerCase().includes(q) ||
        kit.description?.toLowerCase().includes(q) ||
        kit.contents.some((c) => c.sign_designation.toLowerCase().includes(q))
    );
  }, [pataKits, pataSearch]);

  const filteredPtsKits = useMemo(() => {
    if (!ptsSearch.trim()) return ptsKits;
    const q = ptsSearch.toLowerCase();
    return ptsKits.filter(
      (kit) =>
        kit.code.toLowerCase().includes(q) ||
        kit.description?.toLowerCase().includes(q) ||
        kit.contents.some((c) => c.sign_designation.toLowerCase().includes(q))
    );
  }, [ptsKits, ptsSearch]);

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
    if (onDesignationSelected) onDesignationSelected(updatedSign);
    setOpen(false);
    setDimensionModalOpen(false);
    setSelectedDesignation(null);
    setMutcdSearch('');
  };

  const handleCustomDesignation = () => {
    const updatedSign = {
      ...localSign,
      designation: '',
      width: 0,
      height: 0,
      sheeting: localSign.sheeting,
      description: '',
      isCustom: true,
    };
    setLocalSign(updatedSign);
    if (onDesignationSelected) onDesignationSelected(updatedSign);
    setOpen(false);
    setMutcdSearch('');
  };

  const handleSelectKit = (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
    if (onKitSelected) onKitSelected(kit, kitType);
    setOpen(false);
    if (kitType === 'pata') setPataSearch('');
    else setPtsSearch('');
  };

  const handleSelectKitForPreview = async (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
    if (kit.has_variants && kit.variants?.length > 0) {
      setSelectedKitForVariant(kit);
      setKitVariantType(kitType);
      setVariantSelectionModalOpen(true);
      return;
    }
    // Open kit configuration table instead of preview
    setSelectedKitForConfiguration(kit);
    setKitConfigurationType(kitType);
    setKitConfigurationModalOpen(true);
  };

  const showKitPreview = async (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
    setSelectedKitForPreview(kit);
    setKitPreviewType(kitType);

    // Enrich contents with sign images/descriptions
    if (signs.length > 0) {
      const signMap = new Map<string, SignDesignation>();
      signs.forEach((sign) => signMap.set(sign.designation, sign));

      const enriched = kit.contents.map((content) => {
        const signData = signMap.get(content.sign_designation);
        return {
          ...content,
          image_url: signData?.image_url,
          description: signData?.description || '-',
          sheeting: signData?.sheeting,
        };
      });

      setKitContentsWithImages(enriched);
    } else {
      setKitContentsWithImages(kit.contents);
    }

    setKitPreviewModalOpen(true);
  };

  const handleVariantSelected = async (variant: any) => {
    if (!selectedKitForVariant || !kitVariantType) return;
    // Variants use base kit contents for now
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
    if (kitPreviewType === 'pata') setPataSearch('');
    else setPtsSearch('');
  };

  const handleKitConfigurationSave = (configurations: any[]) => {
    // Convert configurations to PrimarySign objects and add them to the order
    configurations.forEach(config => {
      const newSign: PrimarySign = {
        id: generateUniqueId(),
        designation: config.designation,
        width: config.width,
        height: config.height,
        quantity: config.quantity,
        sheeting: config.sheeting,
        associatedStructure: config.associatedStructure,
        displayStructure: config.displayStructure,
        bLights: config.bLights,
        cover: config.cover,
        isCustom: false,
        bLightsColor: undefined,
        description: config.description,
        substrate: config.substrate,
        stiffener: config.stiffener,
      };

      // Add the sign to the estimate context
      // Note: This assumes the component is used within the EstimateContext
      // The parent component will need to handle the actual dispatch
      if (onDesignationSelected) {
        onDesignationSelected(newSign);
      }
    });

    setKitConfigurationModalOpen(false);
    setSelectedKitForConfiguration(null);
    setKitConfigurationType(null);
    setOpen(false);
    if (kitConfigurationType === 'pata') setPataSearch('');
    else setPtsSearch('');
  };

  const closeModals = () => {
    setOpen(false);
    setDimensionModalOpen(false);
    setKitPreviewModalOpen(false);
    setVariantSelectionModalOpen(false);
    setKitConfigurationModalOpen(false);
    setSelectedDesignation(null);
    setSelectedKitForPreview(null);
    setKitPreviewType(null);
    setSelectedKitForVariant(null);
    setKitVariantType(null);
    setSelectedKitForConfiguration(null);
    setKitConfigurationType(null);
    setMutcdSearch('');
    setPataSearch('');
    setPtsSearch('');
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
            ? `${localSign.designation}${
                localSign.width && localSign.height ? ` (${localSign.width} x ${localSign.height})` : ''
              }`
            : 'Select designation...'}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[700px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Select Sign Designation</DialogTitle>
          </DialogHeader>
          <Separator className="w-full -mt-2" />

          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-6 py-4 bg-background border-b">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="mutcd">MUTCD Signs</TabsTrigger>
                  <TabsTrigger value="pata">PATA Kits</TabsTrigger>
                  <TabsTrigger value="pts">PTS Kits</TabsTrigger>
                </TabsList>
              </div>

              {/* MUTCD Tab */}
              <TabsContent value="mutcd" className="flex-1 overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search MUTCD designations..."
                      value={mutcdSearch}
                      onChange={(e) => setMutcdSearch(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {filteredSigns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No MUTCD signs found.
                    </div>
                  ) : (
                    filteredSigns.map((sign) => (
                      <div
                        key={sign.designation}
                        onClick={() => handleSelectDesignation(sign)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/50 border rounded-lg p-4 mb-2',
                          localSign.designation === sign.designation && 'border-primary bg-primary/5'
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
                    ))
                  )}
                </div>
              </TabsContent>

              {/* PATA Tab */}
              <TabsContent value="pata" className="flex-1 overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search PATA kits..."
                      value={pataSearch}
                      onChange={(e) => setPataSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {filteredPataKits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No PATA kits found.
                    </div>
                  ) : (
                    filteredPataKits.map((kit) => (
                      <div
                        key={kit.id}
                        onClick={() => handleSelectKitForPreview(kit, 'pata')}
                        className="cursor-pointer transition-colors hover:bg-blue-50/50 border rounded-lg p-4 mb-2 bg-blue-50/30"
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
                                    fallback.innerHTML =
                                      '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <Package className="h-8 w-8 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
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
                    ))
                  )}
                </div>
              </TabsContent>

              {/* PTS Tab */}
              <TabsContent value="pts" className="flex-1 overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search PTS kits..."
                      value={ptsSearch}
                      onChange={(e) => setPtsSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {filteredPtsKits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No PTS kits found.
                    </div>
                  ) : (
                    filteredPtsKits.map((kit) => (
                      <div
                        key={kit.id}
                        onClick={() => handleSelectKitForPreview(kit, 'pts')}
                        className="cursor-pointer transition-colors hover:bg-green-50/50 border rounded-lg p-4 mb-2 bg-green-50/30"
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
                                    fallback.innerHTML =
                                      '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <Package className="h-8 w-8 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
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
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
              <DialogTitle>Select Size for {selectedDesignation?.designation}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedDesignation?.description}
              </p>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDesignation?.dimensions?.map((dim) => (
                <button
                  key={`${dim.width}x${dim.height}`}
                  onClick={() => handleSelectDimension(dim.width, dim.height)}
                  className={cn(
                    'p-4 border rounded-lg text-left transition-colors hover:bg-muted/50',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    localSign.designation === selectedDesignation?.designation &&
                      localSign.width === dim.width &&
                      localSign.height === dim.height
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
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
            <Button variant="outline" onClick={() => setDimensionModalOpen(false)}>
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
                Configure Kit Signs: {kitConfigurationType?.toUpperCase()} {selectedKitForConfiguration?.code} - {selectedKitForConfiguration?.description}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedKitForPreview?.description}
              </p>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>
          <div className="flex-1 min-h-0 flex">
            {/* Left: Kit Diagram */}
            <div className="w-1/2 p-6 border-r border-border">
              <h3 className="text-lg font-semibold mb-4">Kit Diagram</h3>
              {selectedKitForPreview?.image_url ? (
                <img
                  src={selectedKitForPreview.image_url}
                  alt={`${kitPreviewType?.toUpperCase()} Kit ${selectedKitForPreview.code} Diagram`}
                  className="w-full h-auto max-h-[500px] object-contain border rounded"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                    e.currentTarget.alt = 'Diagram failed to load';
                  }}
                />
              ) : (
                <div className="w-full h-[400px] bg-muted/50 flex items-center justify-center rounded border border-dashed">
                  <p className="text-muted-foreground text-sm">No diagram available</p>
                </div>
              )}
            </div>

            {/* Right: Sign List with Thumbnails */}
            <div className="w-1/2 p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4">
                Signs in Kit ({kitContentsWithImages.length})
              </h3>
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
                          <div className="font-medium text-sm">{content.sign_designation}</div>
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
            <Button variant="outline" onClick={() => setKitPreviewModalOpen(false)}>
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
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {selectedKitForVariant?.variants?.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelected(variant)}
                  className="w-full p-4 border rounded-lg text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{variant.label}</div>
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
            <Button variant="outline" onClick={() => setVariantSelectionModalOpen(false)}>
              Back to Kits
            </Button>
            <Button variant="outline" onClick={closeModals}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kit Configuration Modal */}
      <Dialog open={kitConfigurationModalOpen} onOpenChange={setKitConfigurationModalOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>
                Configure {kitConfigurationType?.toUpperCase()} Kit Signs
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Customize each sign in the kit with your preferred settings.
              </p>
            </DialogHeader>
            <Separator className="w-full -mt-2" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {selectedKitForConfiguration && kitConfigurationType && (
              <KitConfigurationTable
                kit={selectedKitForConfiguration}
                kitType={kitConfigurationType}
                signsData={signs}
                onSave={handleKitConfigurationSave}
                onCancel={() => {
                  setKitConfigurationModalOpen(false);
                  setSelectedKitForConfiguration(null);
                  setKitConfigurationType(null);
                }}
                isSignOrder={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DesignationSearcher;
