'use client';

import SharedSignPickerModal, {
  SharedSignPickerModalProps,
} from '@/app/takeoffs/new/SignPickerModal';
import {
  PrimarySign,
  SecondarySign,
  structureMap,
} from '@/types/MPTEquipment';

export interface SignPickerModalResult {
  sign: PrimarySign | SecondarySign;
  structureType?: string;
  bLights?: string;
  cover?: boolean;
}

type HostPickerMode = 'mpt' | 'permanent-sign';
type HostPickerIntent = 'add' | 'edit';

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

type SignPickerModalProps = HostSignPickerModalProps | SharedSignPickerModalProps;

const isRuntimeProps = (
  props: SignPickerModalProps
): props is SharedSignPickerModalProps =>
  'sign' in props && (props.mode === 'create' || props.mode === 'edit');

const parseBLights = (value?: string): Pick<PrimarySign, 'bLights' | 'bLightsColor'> => {
  if (!value || value === 'none') {
    return { bLights: 0, bLightsColor: undefined };
  }

  const quantity = Number(value.charAt(0));
  const colorKey = value.charAt(1).toUpperCase();
  const colorMap = {
    Y: 'Yellow',
    R: 'Red',
    W: 'White',
  } as const;

  return {
    bLights: Number.isFinite(quantity) ? quantity : 0,
    bLightsColor: colorMap[colorKey as keyof typeof colorMap],
  };
};

const formatBLights = (sign: PrimarySign | SecondarySign): string => {
  if ('primarySignId' in sign || !sign.bLights || !sign.bLightsColor) {
    return 'none';
  }

  const colorKey = sign.bLightsColor.charAt(0).toUpperCase();
  return `${sign.bLights}${colorKey}`;
};

const adaptInitialSign = ({
  initialSign,
  initialStructureType,
  initialBLights,
  initialCover,
}: Pick<
  HostSignPickerModalProps,
  'initialSign' | 'initialStructureType' | 'initialBLights' | 'initialCover'
>): PrimarySign | SecondarySign => {
  if ('primarySignId' in initialSign) {
    return initialSign;
  }

  const { bLights, bLightsColor } = parseBLights(initialBLights);
  const displayStructure = initialStructureType || initialSign.displayStructure || 'LOOSE';

  return {
    ...initialSign,
    displayStructure,
    associatedStructure: structureMap[displayStructure] ?? initialSign.associatedStructure ?? 'none',
    bLights,
    bLightsColor,
    cover: typeof initialCover === 'boolean' ? initialCover : initialSign.cover,
  };
};

const HostSignPickerModal = ({
  open,
  onOpenChange,
  intent,
  mode,
  initialSign,
  onSave,
  initialStructureType,
  initialBLights,
  initialCover,
  sheetingOptions,
}: HostSignPickerModalProps) => {
  const adaptedSign = adaptInitialSign({
    initialSign,
    initialStructureType,
    initialBLights,
    initialCover,
  });

  return (
    <SharedSignPickerModal
      open={open}
      onOpenChange={onOpenChange}
      mode={intent === 'add' ? 'create' : 'edit'}
      sign={adaptedSign}
      currentPhase={0}
      isTakeoff={false}
      isSignOrder={false}
      useSegmentedPicker
      enableKitTabs={false}
      sheetingOptions={sheetingOptions}
      showMptOptions={mode === 'mpt'}
      onSaveResult={(sign) =>
        onSave({
          sign,
          structureType: 'primarySignId' in sign ? undefined : sign.displayStructure,
          bLights: formatBLights(sign),
          cover: 'primarySignId' in sign ? undefined : sign.cover,
        })
      }
    />
  );
};

const SignPickerModal = (props: SignPickerModalProps) => {
  if (isRuntimeProps(props)) {
    return <SharedSignPickerModal {...props} />;
  }

  return <HostSignPickerModal {...props} />;
};

export default SignPickerModal;
