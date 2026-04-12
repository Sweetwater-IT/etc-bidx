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
  KitVariant,
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
import { logSignOrderDebug } from '@/lib/log-sign-order-debug';

interface Props {
  localSign: PrimarySign | SecondarySign;
  setLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>;
  onDesignationSelected?: (updatedSign: PrimarySign | SecondarySign) => void;
  onKitSelected?: (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => void;
  onKitSignsConfigured?: (signs: PrimarySign[], kit: PataKit | PtsKit) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const applyKitVariant = (kit: PataKit | PtsKit, variant?: KitVariant | null): PataKit | PtsKit => {
  if (!variant) {
    return {
      ...kit,
      selectedVariant: null,
    };
  }

  return {
    ...kit,
    selectedVariant: variant,
    contents: kit.contents.filter(
      (content) => content.kit_variant_id == null || content.kit_variant_id === variant.id
    ),
    signCount: kit.contents.filter(
      (content) => content.kit_variant_id == null || content.kit_variant_id === variant.id
    ).length,
  };
};

const DesignationSearcher = ({
  localSign,
  setLocalSign,
  onDesignationSelected,
  onKitSelected,
  onKitSignsConfigured,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
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

  useEffect(() => {
    logSignOrderDebug('sign_designation_modal_state', {
      open,
      dimensionModalOpen,
      kitPreviewModalOpen,
      variantSelectionModalOpen,
      kitConfigurationModalOpen,
      activeTab,
      signId: localSign?.id ?? null,
      designation: localSign?.designation ?? null,
      width: localSign?.width ?? null,
      height: localSign?.height ?? null,
      selectedDesignation: selectedDesignation?.designation ?? null,
      selectedKitCode: selectedKitForConfiguration?.code ?? selectedKitForPreview?.code ?? selectedKitForVariant?.code ?? null,
    });
  }, [
    activeTab,
    dimensionModalOpen,
    kitConfigurationModalOpen,
    kitPreviewModalOpen,
    localSign?.designation,
    localSign?.height,
    localSign?.id,
    localSign?.width,
    open,
    selectedDesignation?.designation,
    selectedKitForConfiguration?.code,
    selectedKitForPreview?.code,
    selectedKitForVariant?.code,
    variantSelectionModalOpen,
  ]);

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

        const { data: pataVariantsData } = await supabase
          .from('kit_variants')
          .select('id, kit_id, variant_label, description, finished, blights')
          .order('variant_label');

        const pataVariantsMap = new Map<number, KitVariant[]>();
        (pataVariantsData || []).forEach((variant) => {
          const existing = pataVariantsMap.get(variant.kit_id) || [];
          existing.push({
            id: variant.id,
            label: variant.variant_label,
            description: variant.description,
            finished: variant.finished,
            blights: variant.blights,
          });
          pataVariantsMap.set(variant.kit_id, existing);
        });

        const pataKitsWithContents = await Promise.all(
          (pataKitsData || []).map(async (kit) => {
            const { data: contents } = await supabase
              .from('pata_kit_contents')
              .select('sign_designation, quantity, blight_quantity, kit_variant_id')
              .eq('pata_kit_code', kit.code);

            return {
              ...kit,
              contents: contents || [],
              signCount: contents?.length || 0,
              variants: pataVariantsMap.get(Number(kit.id)) || [],
              selectedVariant: null,
            };
          })
        );

        setPataKits(pataKitsWithContents);

        // PTS kits + contents
        const { data: ptsKitsData } = await supabase
          .from('pts_kits')
          .select('id, code, description, image_url, finished, reviewed, has_variants')
          .order('code');

        const { data: ptsVariantsData } = await supabase
          .from('kit_variants')
          .select('id, kit_id, variant_label, description, finished, blights')
          .order('variant_label');

        const ptsVariantsMap = new Map<number, KitVariant[]>();
        (ptsVariantsData || []).forEach((variant) => {
          const existing = ptsVariantsMap.get(variant.kit_id) || [];
          existing.push({
            id: variant.id,
            label: variant.variant_label,
            description: variant.description,
            finished: variant.finished,
            blights: variant.blights,
          });
          ptsVariantsMap.set(variant.kit_id, existing);
        });

        const ptsKitsWithContents = await Promise.all(
          (ptsKitsData || []).map(async (kit) => {
            const { data: contents } = await supabase
              .from('pts_kit_contents')
              .select('sign_designation, quantity, kit_variant_id')
              .eq('pts_kit_code', kit.code);

            return {
              ...kit,
              contents: contents || [],
              signCount: contents?.length || 0,
              variants: ptsVariantsMap.get(Number(kit.id)) || [],
              selectedVariant: null,
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
    logSignOrderDebug('sign_designation_clicked', {
      designation: designation.designation,
      dimensions: designation.dimensions?.length ?? 0,
      signId: localSign?.id ?? null,
    });
    setSelectedDesignation(designation);
    setDimensionModalOpen(true);
  };

  const handleSelectDimension = (width: number, height: number) => {
    if (!selectedDesignation) return;
    logSignOrderDebug('sign_dimension_selected', {
      designation: selectedDesignation.designation,
      width,
      height,
      signId: localSign?.id ?? null,
    });
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
    logSignOrderDebug('sign_custom_designation_selected', {
      signId: localSign?.id ?? null,
    });
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
    logSignOrderDebug('sign_kit_selected_direct', {
      kitCode: kit.code,
      kitType,
      signId: localSign?.id ?? null,
    });
    if (onKitSelected) onKitSelected(kit, kitType);
    setOpen(false);
    if (kitType === 'pata') setPataSearch('');
    else setPtsSearch('');
  };

  const handleSelectKitForPreview = async (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
    logSignOrderDebug('sign_kit_preview_requested', {
      kitCode: kit.code,
      kitType,
      hasVariants: Boolean(kit.has_variants && kit.variants?.length > 0),
      signId: localSign?.id ?? null,
    });
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

  const showKitPreview = async (
    kit: PataKit | PtsKit,
    kitType: 'pata' | 'pts',
    variant?: KitVariant | null
  ) => {
    const resolvedKit = applyKitVariant(kit, variant);
    setSelectedKitForPreview(resolvedKit);
    setKitPreviewType(kitType);

    // Enrich contents with sign images/descriptions
    if (signs.length > 0) {
      const signMap = new Map<string, SignDesignation>();
      signs.forEach((sign) => signMap.set(sign.designation, sign));

      const enriched = resolvedKit.contents.map((content) => {
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
      setKitContentsWithImages(resolvedKit.contents);
    }

    setKitPreviewModalOpen(true);
  };

  const handleVariantSelected = async (variant: KitVariant) => {
    if (!selectedKitForVariant || !kitVariantType) return;
    logSignOrderDebug('sign_kit_variant_selected', {
      kitCode: selectedKitForVariant.code,
      kitType: kitVariantType,
      variant: variant?.label ?? null,
      signId: localSign?.id ?? null,
    });
    await showKitPreview(selectedKitForVariant, kitVariantType, variant);
    setVariantSelectionModalOpen(false);
    setSelectedKitForVariant(null);
    setKitVariantType(null);
  };

  const handleConfirmKitSelection = () => {
    logSignOrderDebug('sign_kit_preview_confirmed', {
      kitCode: selectedKitForPreview?.code ?? null,
      kitType: kitPreviewType,
      signId: localSign?.id ?? null,
    });
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
    logSignOrderDebug('sign_kit_configuration_saved', {
      kitCode: selectedKitForConfiguration?.code ?? null,
      kitType: kitConfigurationType,
      signsCount: configurations.length,
      signId: localSign?.id ?? null,
    });
    // Convert configurations to PrimarySign objects
    const configuredSigns: PrimarySign[] = configurations.map(config => ({
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
      bLightsColor: config.bLightsColor,
      description: config.description,
      substrate: config.substrate,
      stiffener: config.stiffener,
    }));

    // Use the dedicated kit signs callback to add signs without opening drawer
    if (onKitSignsConfigured && selectedKitForConfiguration) {
      onKitSignsConfigured(configuredSigns, selectedKitForConfiguration);
    }

    setKitConfigurationModalOpen(false);
    setSelectedKitForConfiguration(null);
    setKitConfigurationType(null);
    setOpen(false);
    if (kitConfigurationType === 'pata') setPataSearch('');
    else setPtsSearch('');
  };

  const closeModals = () => {
    logSignOrderDebug('sign_designation_flow_closed', {
      signId: localSign?.id ?? null,
      designation: localSign?.designation ?? null,
    });
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 shrink-0">
            <DialogTitle>Select Sign Designation</DialogTitle>
          </DialogHeader>
          <Separator className="w-full -mt-2 shrink-0" />

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 bg-background border-b shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="mutcd">MUTCD Signs ({signs.length})</TabsTrigger>
                  <TabsTrigger value="pata">PATA Kits ({pataKits.length})</TabsTrigger>
                  <TabsTrigger value="pts">PTS Kits ({ptsKits.length})</TabsTrigger>
                </TabsList>
              </div>

              {/* MUTCD Tab */}
              <TabsContent value="mutcd" className="flex-1 overflow-y-auto px-6 py-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search MUTCD designations..."
                    value={mutcdSearch}
                    onChange={(e) => setMutcdSearch(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                {/* Custom Designation Entry */}
                <div
                  onClick={handleCustomDesignation}
                  className="cursor-pointer transition-colors hover:bg-muted/50 border rounded-lg p-4 mb-2 border-dashed border-primary/50 bg-primary/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2 text-primary">
                        Custom Sign
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          CUSTOM
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Create a custom sign designation not in the database
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Enter your own designation</span>
                      </div>
                    </div>
                  </div>
                </div>

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
              </TabsContent>

              {/* PATA Tab */}
              <TabsContent value="pata" className="flex-1 overflow-y-auto px-6 py-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search PATA kits..."
                    value={pataSearch}
                    onChange={(e) => setPataSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filteredPataKits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No PATA kits found.
                  </div>
                ) : (
                  filteredPataKits.map((kit) => (
                    <div
                      key={kit.id}
                      onClick={() => handleSelectKitForPreview(kit, 'pata')}
                      className="cursor-pointer transition-colors hover:bg-muted/50 border rounded-lg p-4 mb-2"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                  fallback.className = 'w-full h-full flex items-center justify-center text-muted-foreground';
                                  fallback.innerHTML =
                                    '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {kit.code}
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
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
              </TabsContent>

              {/* PTS Tab */}
              <TabsContent value="pts" className="flex-1 overflow-y-auto px-6 py-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search PTS kits..."
                    value={ptsSearch}
                    onChange={(e) => setPtsSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filteredPtsKits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No PTS kits found.
                  </div>
                ) : (
                  filteredPtsKits.map((kit) => (
                    <div
                      key={kit.id}
                      onClick={() => handleSelectKitForPreview(kit, 'pts')}
                      className="cursor-pointer transition-colors hover:bg-muted/50 border rounded-lg p-4 mb-2"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                  fallback.className = 'w-full h-full flex items-center justify-center text-muted-foreground';
                                  fallback.innerHTML =
                                    '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {kit.code}
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
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
                {kitPreviewType?.toUpperCase()} Kit: {selectedKitForPreview?.code}
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
                Configure Kit Signs: {selectedKitForConfiguration?.code} - {selectedKitForConfiguration?.description}
              </DialogTitle>
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
