'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import RuntimeSignPickerModal, {
  RuntimeSignPickerModalProps,
} from '@/app/takeoffs/new/RuntimeSignPickerModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  PrimarySign,
  SecondarySign,
  SignDesignation,
} from '@/types/MPTEquipment';
import { Check, Plus, Search } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MPT_B_LIGHT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '1Y', label: '1 Yellow' },
  { value: '1R', label: '1 Red' },
  { value: '1W', label: '1 White' },
  { value: '2Y', label: '2 Yellow' },
  { value: '2R', label: '2 Red' },
  { value: '2W', label: '2 White' },
] as const;

type PickerStep = 'designation' | 'dimension' | 'configuration';
type HostPickerMode = 'mpt' | 'permanent-sign';
type HostPickerIntent = 'add' | 'edit';

export interface SignPickerModalResult {
  sign: PrimarySign | SecondarySign;
  structureType?: string;
  bLights?: string;
  cover?: boolean;
}

interface HostSignPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: HostPickerIntent;
  mode: HostPickerMode;
  initialSign: PrimarySign | SecondarySign;
  onSave: (result: SignPickerModalResult) => void;
  structureOptions?: string[];
  initialStructureType?: string;
  initialBLights?: string;
  initialCover?: boolean;
  sheetingOptions: string[];
}

type SignPickerModalProps = HostSignPickerModalProps | RuntimeSignPickerModalProps;

const isSecondarySign = (
  sign: PrimarySign | SecondarySign
): sign is SecondarySign => 'primarySignId' in sign;

const isRuntimeProps = (
  props: SignPickerModalProps
): props is RuntimeSignPickerModalProps =>
  props.mode === 'create' || props.mode === 'edit';

const HostSignPickerModal = ({
  open,
  onOpenChange,
  intent,
  mode,
  initialSign,
  onSave,
  structureOptions = [],
  initialStructureType = '',
  initialBLights = 'none',
  initialCover = false,
  sheetingOptions,
}: HostSignPickerModalProps) => {
  const [step, setStep] = useState<PickerStep>('designation');
  const [activeTab, setActiveTab] = useState<'mutcd'>('mutcd');
  const [search, setSearch] = useState('');
  const [signs, setSigns] = useState<SignDesignation[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<SignDesignation | null>(null);
  const [draftSign, setDraftSign] = useState<PrimarySign | SecondarySign>(initialSign);
  const [structureType, setStructureType] = useState(initialStructureType);
  const [bLights, setBLights] = useState(initialBLights);
  const [includeCover, setIncludeCover] = useState(initialCover);

  const isSecondary = useMemo(() => isSecondarySign(draftSign), [draftSign]);
  const modalTitle = intent === 'add' ? 'Add Sign' : 'Edit Sign';
  const showMptOptions = mode === 'mpt' && !isSecondary;

  useEffect(() => {
    const fetchSigns = async () => {
      const { data } = await supabase
        .from('signs_all')
        .select('designation, description, sheeting, sizes, image_url')
        .order('designation');

      const mapped: SignDesignation[] = (data || []).map((sign: any) => {
        const dimensions = (sign.sizes || [])
          .map((sizeStr: string) => {
            const [widthStr, heightStr] = sizeStr.split(' x ');
            const width = parseFloat(widthStr);
            const height = parseFloat(heightStr);
            return !Number.isNaN(width) && !Number.isNaN(height) ? { width, height } : null;
          })
          .filter((dim): dim is { width: number; height: number } => dim !== null);

        return {
          designation: sign.designation,
          description: sign.description,
          sheeting: sign.sheeting,
          image_url: sign.image_url,
          dimensions,
        };
      });

      setSigns(mapped);
    };

    fetchSigns();
  }, []);

  useEffect(() => {
    if (!open) return;

    setDraftSign(initialSign);
    setStructureType(initialStructureType);
    setBLights(initialBLights || 'none');
    setIncludeCover(Boolean(initialCover));
    setSearch('');
    setActiveTab('mutcd');
    setSelectedDesignation(null);
    setStep(intent === 'edit' ? 'configuration' : 'designation');
  }, [intent, initialBLights, initialCover, initialSign, initialStructureType, open]);

  const filteredSigns = useMemo(() => {
    if (!search.trim()) return signs;
    const query = search.toLowerCase();
    return signs.filter(
      (sign) =>
        sign.designation.toLowerCase().includes(query) ||
        sign.description?.toLowerCase().includes(query)
    );
  }, [search, signs]);

  const selectedDesignationInfo = useMemo(
    () => signs.find((sign) => sign.designation === draftSign.designation) || null,
    [draftSign.designation, signs]
  );

  const availableDimensions = selectedDesignationInfo?.dimensions || [];

  const handleSelectDesignation = (designation: SignDesignation) => {
    setSelectedDesignation(designation);

    if (designation.dimensions.length === 1) {
      const [dimension] = designation.dimensions;
      setDraftSign((prev) => ({
        ...prev,
        designation: designation.designation,
        description: designation.description,
        sheeting: designation.sheeting,
        width: dimension.width,
        height: dimension.height,
        isCustom: false,
      }));
      setStep('configuration');
      return;
    }

    setDraftSign((prev) => ({
      ...prev,
      designation: designation.designation,
      description: designation.description,
      sheeting: designation.sheeting,
      width: 0,
      height: 0,
      isCustom: false,
    }));
    setStep('dimension');
  };

  const handleSelectDimension = (width: number, height: number) => {
    setDraftSign((prev) => ({
      ...prev,
      width,
      height,
    }));
    setStep('configuration');
  };

  const handleSelectCustom = () => {
    setSelectedDesignation(null);
    setDraftSign((prev) => ({
      ...prev,
      designation: prev.designation || '',
      description: prev.description || '',
      width: prev.width || 0,
      height: prev.height || 0,
      isCustom: true,
    }));
    setStep('configuration');
  };

  const handleSave = () => {
    onSave({
      sign: draftSign,
      structureType,
      bLights,
      cover: includeCover,
    });
    onOpenChange(false);
  };

  const canSave =
    Boolean(draftSign.designation || draftSign.isCustom) &&
    draftSign.width > 0 &&
    draftSign.height > 0 &&
    draftSign.quantity >= 1;

  const stepDescription =
    step === 'designation'
      ? 'Choose a MUTCD code or create a custom sign.'
      : step === 'dimension'
        ? `Choose a size for ${draftSign.designation || 'this sign'}.`
        : 'Review the sign configuration before saving.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="relative z-10 shrink-0 bg-background">
          <DialogHeader className="p-6 pb-4 text-left">
            <DialogTitle>{modalTitle}</DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">{stepDescription}</p>
          </DialogHeader>
          <Separator className="w-full" />
        </div>

        {step === 'designation' && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={activeTab} onValueChange={() => setActiveTab('mutcd')}>
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="mutcd">MUTCD Signs ({signs.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="mutcd" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    placeholder="Search MUTCD designations..."
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className="w-full rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
                >
                  <div className="flex items-start gap-3">
                    <Plus className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-primary">Custom Sign</div>
                      <div className="text-sm text-muted-foreground">
                        Create a sign that is not in the MUTCD list.
                      </div>
                    </div>
                  </div>
                </button>

                {filteredSigns.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No designations found.</div>
                ) : (
                  filteredSigns.map((designation) => (
                    <button
                      key={designation.designation}
                      type="button"
                      onClick={() => handleSelectDesignation(designation)}
                      className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium">{designation.designation}</div>
                          <div className="text-sm text-muted-foreground">
                            {designation.description || '-'}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {designation.dimensions.length} size{designation.dimensions.length === 1 ? '' : 's'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'dimension' && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="font-medium">{selectedDesignation?.designation}</div>
              <div className="text-sm text-muted-foreground">
                {selectedDesignation?.description || '-'}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedDesignation?.dimensions.map((dim) => (
                <button
                  key={`${dim.width}x${dim.height}`}
                  type="button"
                  onClick={() => handleSelectDimension(dim.width, dim.height)}
                  className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="font-medium">
                    {dim.width}&quot; x {dim.height}&quot;
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedDesignation.sheeting}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'configuration' && (
          <div className="flex-1 overflow-y-auto space-y-6 px-6 py-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">
                    {draftSign.designation || (draftSign.isCustom ? 'Custom Sign' : '-')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {draftSign.description || 'No description'}
                  </div>
                  {draftSign.width > 0 && draftSign.height > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {draftSign.width}&quot; x {draftSign.height}&quot;
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStep('designation')}>
                    Change designation
                  </Button>
                  {!draftSign.isCustom && availableDimensions.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => setStep('dimension')}>
                      Change size
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {draftSign.isCustom && (
              <>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Designation</Label>
                  <Input
                    value={draftSign.designation}
                    onChange={(e) =>
                      setDraftSign((prev) => ({ ...prev, designation: e.target.value }))
                    }
                    placeholder="Enter custom sign code"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Description</Label>
                  <Input
                    value={draftSign.description}
                    onChange={(e) =>
                      setDraftSign((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Enter custom description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Width</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      value={draftSign.width || ''}
                      onChange={(e) =>
                        setDraftSign((prev) => ({
                          ...prev,
                          width: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Height</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      value={draftSign.height || ''}
                      onChange={(e) =>
                        setDraftSign((prev) => ({
                          ...prev,
                          height: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Sheeting</Label>
                <Select
                  value={draftSign.sheeting}
                  onValueChange={(value) =>
                    setDraftSign((prev) => ({ ...prev, sheeting: value as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sheeting" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={draftSign.quantity || 1}
                  onChange={(e) =>
                    setDraftSign((prev) => ({
                      ...prev,
                      quantity: Math.max(1, parseInt(e.target.value || '1', 10) || 1),
                    }))
                  }
                />
              </div>
            </div>

            {showMptOptions && (
              <>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Structure</Label>
                  <Select value={structureType} onValueChange={setStructureType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {structureOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">B-Lights</Label>
                  <Select value={bLights} onValueChange={setBLights}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select B-Lights" />
                    </SelectTrigger>
                    <SelectContent>
                      {MPT_B_LIGHT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mpt-cover-checkbox"
                    checked={includeCover}
                    onCheckedChange={(checked) => setIncludeCover(Boolean(checked))}
                  />
                  <Label htmlFor="mpt-cover-checkbox" className="text-sm font-medium">
                    Include cover
                  </Label>
                </div>
              </>
            )}
          </div>
        )}

        {!canSave && step === 'configuration' && (
          <div className="flex items-center gap-2 bg-amber-200 px-6 py-2 text-sm text-muted-foreground">
            <span>Please fill out all necessary fields before saving.</span>
          </div>
        )}

        <div className="flex shrink-0 justify-end gap-3 border-t bg-background px-6 py-4">
          {step !== 'designation' && (
            <Button
              variant="outline"
              onClick={() => setStep(step === 'configuration' && !draftSign.isCustom && availableDimensions.length > 1 ? 'dimension' : 'designation')}
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 'configuration' && (
            <Button onClick={handleSave} disabled={!canSave}>
              Save Sign
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SignPickerModal = (props: SignPickerModalProps) => {
  if (isRuntimeProps(props)) {
    return <RuntimeSignPickerModal {...props} />;
  }

  return <HostSignPickerModal {...props} />;
};

export default SignPickerModal;
