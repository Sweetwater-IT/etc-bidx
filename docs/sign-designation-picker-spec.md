# Sign Designation Picker Spec

## Goal

The sign designation picker should behave as one product-level flow, even when it is rendered from different pages.

Users should always experience the same high-level sequence:

1. Pick a designation or kit.
2. Pick a size when multiple dimensions exist.
3. Configure sign properties.
4. Save back into the host page.

The picker should be modal-driven and self-contained:

- each step replaces the previous step inside the modal
- the host page should not need to manage intermediate picker screens
- canceling the picker should leave host-page state unchanged
- saving should return a complete payload to the host page

## Pages That Use This Flow

### 1. Active bid / new bid MPT phases

Current host:

- [components/MPTSignTable.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/MPTSignTable.tsx)
- uses [components/pages/active-bid/signs/DesignationSearcher.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/pages/active-bid/signs/DesignationSearcher.tsx)

Current pattern:

- host opens picker from table rows
- picker returns a selected sign payload
- host maps that payload into `MPTSignRow`

### 2. Sign order page

Current host:

- [app/takeoffs/new/SignOrderList.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/new/SignOrderList.tsx)
- uses [app/takeoffs/new/SignEditingSheet.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/new/SignEditingSheet.tsx)

Current pattern:

- host opens sign editor modal
- sign editor owns designation -> dimension -> configuration
- save dispatches directly into runtime state

### 3. Sign shop page

Current host:

- [app/takeoffs/sign-order/[id]/SignShopContent.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/sign-order/[id]/SignShopContent.tsx)
- renders [app/takeoffs/new/SignOrderList.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/new/SignOrderList.tsx)
- which renders [app/takeoffs/new/SignEditingSheet.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/new/SignEditingSheet.tsx)

Current pattern:

- same base sign-order modal flow
- output table is shop-oriented
- picker behavior should stay identical to sign order

### 4. `l/takeoff` MPT / flagging / lane closure work types

Current host:

- [components/MPTSignConfiguration.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/MPTSignConfiguration.tsx)
- renders [components/MPTSignTable.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/MPTSignTable.tsx)
- which uses [components/pages/active-bid/signs/DesignationSearcher.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/pages/active-bid/signs/DesignationSearcher.tsx)

Relevant page family:

- [app/l/[id]/takeoffs/create/[takeoffId]/TakeoffViewContent.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/l/[id]/takeoffs/create/[takeoffId]/TakeoffViewContent.tsx)

Current pattern:

- same MPT table/picker model as active bid
- host-specific table layout differs
- picker behavior should match active bid and sign order

### 5. `l/takeoff` permanent sign work type

Current host:

- [components/PermanentSignConfiguration.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/PermanentSignConfiguration.tsx)
- uses [components/pages/active-bid/signs/DesignationSearcher.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/pages/active-bid/signs/DesignationSearcher.tsx)

Current pattern:

- post-type permanent sign rows open the same picker
- host maps result into permanent sign row shape

## Current Architecture

There are effectively two picker implementations today.

### A. `DesignationSearcher`

Primary users:

- active bid MPT
- takeoff MPT/flagging/lane closure
- permanent signs

Characteristics:

- modal with tabs for `MUTCD`, `PATA`, `PTS`
- separate modal stack for:
  - designation list
  - dimension picker
  - variant picker
  - kit preview
  - kit configuration
- fetches signs and kit data internally
- returns payloads to the host with callbacks

### B. `SignEditingSheet`

Primary users:

- sign order
- sign shop
- any segmented-picker sign flow via `SignOrderList`

Characteristics:

- modal with internal step state
- `designation -> dimension -> configuration`
- also owns kit variant selection and kit-stepper flow
- writes more directly into sign-order runtime state

## Problem Statement

The app currently has duplicated picker logic with overlapping but not identical behavior.

Observed issues:

- `DesignationSearcher` and `SignEditingSheet` both fetch sign + kit data separately
- both implement kit variant logic separately
- both implement dimension handling separately
- host pages map returned data differently
- one flow uses nested modal stacks, the other uses a single step-controlled modal
- bugs fixed in one picker are likely to remain in the other
- this makes Playwright coverage harder because “the same picker” is not actually one component

## Product Rules

These rules should be true on every page where the picker appears.

### Rule 1: One conceptual flow

The user should always experience:

- choose designation or kit
- choose dimension if needed
- configure sign properties
- save

### Rule 2: Modal owns wizard state

The host page should only know:

- picker is open or closed
- starting sign context
- final saved result
- cancel result

The host page should not own:

- current picker step
- current search term
- selected tab
- selected dimension
- selected kit variant
- kit preview state

### Rule 3: Cancel is non-destructive

If the user closes the picker before save:

- no row should be changed
- no sign should be added
- no page state should mutate outside the modal

### Rule 4: Save returns complete data

The payload returned from the picker must always be complete enough for the host to render its row without additional inference.

For a single sign, that includes at minimum:

- `designation`
- `description`
- `width`
- `height`
- `quantity`
- `sheeting`
- `substrate`
- `displayStructure`
- `associatedStructure`
- `bLights`
- `bLightsColor`
- `cover`
- `stiffener`
- `isCustom`

For kits, the payload must include:

- selected kit identity
- selected variant if applicable
- fully configured generated signs

### Rule 5: Dimension is a required step, not a side effect

If a sign has:

- one available size: auto-select and continue
- more than one size: show dimension step
- no valid size and not custom: block save and show error

### Rule 6: Kit variants are first-class

If a PATA or PTS kit has variants:

- the user must choose a variant before configuration
- configured signs must be generated only from contents matching `kit_variant_id`
- variant choice must be visible in modal state and available to the host payload

### Rule 7: Host-specific tables may differ, picker may not

The row/table after save may vary by page.

Examples:

- active bid MPT row
- sign shop table
- permanent sign row
- takeoff sign table

But the picker’s behavior, required steps, and save contract should not vary without an explicit mode.

## Desired Component Model

## Core component

Create one shared picker/wizard abstraction.

Component name:

- `SignPickerModal`

It should own:

- data fetch/load state
- step navigation
- designation search
- tab state
- dimension step
- kit variant step
- kit configuration step
- validation
- cancel/reset behavior

## Host contract

Every host page should use a thin adapter layer.

Suggested API:

```ts
type SignPickerMode =
  | "mpt"
  | "sign-order"
  | "sign-shop"
  | "permanent-sign";

interface SignPickerModalProps {
  open: boolean;
  intent: "add" | "edit";
  mode: SignPickerMode;
  initialValue?: Partial<PrimarySign | SecondarySign>;
  allowCustom?: boolean;
  allowKits?: boolean;
  allowSecondarySigns?: boolean;
  onCancel: () => void;
  onSave: (result: SignPickerResult) => void;
}
```

Suggested result contract:

```ts
type SignPickerResult =
  | {
      kind: "single-sign";
      sign: PrimarySign | SecondarySign;
    }
  | {
      kind: "kit";
      kitType: "pata" | "pts";
      kitCode: string;
      variantId?: number | null;
      signs: PrimarySign[];
    };
```

## Step model

Single sign path:

1. `designation`
2. `dimension` if needed
3. `configuration`
4. `save`

Kit path:

1. `designation` tab on PATA/PTS
2. `variant` if needed
3. `kit-configuration`
4. `save`

Notes:

- kit preview should be optional product design, not required architecture
- if kept, it must still live inside the same modal shell as a step, not as a separate unmanaged modal

## Add vs Edit behavior

`SignPickerModal` should be the only component used for both add and edit.

The modal header title changes by intent:

- add: `Add Sign`
- edit: `Edit Sign`

Everything else should use the same underlying workflow and data contract.

### Add

- starts at the designation step
- user selects designation or kit
- user selects dimension if needed
- user configures remaining properties
- save returns a complete sign payload

### Edit

- opens prefilled with the current sign data
- default entry step should be `configuration`
- user must still be able to change:
  - designation
  - dimensions
  - every existing configuration field
- a clear `Change designation` action should move the user back into the designation flow
- a clear `Change size` action should move the user into the dimension flow when applicable

Edit must not be reduced to “attributes only.” It must support full sign replacement through the same modal flow.

## No-regression requirement

This refactor must preserve all currently collected data, all current options, and all existing field requirements.

That means `SignPickerModal` must not remove, simplify, or silently change:

- input fields
- dropdowns
- selectable button groups
- option lists
- validation requirements
- saved payload fields
- host-specific mappings after save

Examples of fields/options that must remain supported where they are supported today:

- designation / MUTCD code
- dimensions
- quantity
- sheeting
- substrate
- structure / display structure
- associated structure
- b-lights
- b-light color
- cover
- stiffener
- custom sign behavior
- PATA / PTS kit selection
- kit variant selection

If a field is available in the current flow for a given host/mode, the new modal must still collect it.

## State ownership

### Picker owns

- fetched sign catalog
- fetched kit catalog
- search text
- active tab
- selected designation
- selected dimension
- selected kit
- selected kit variant
- staged local sign draft
- staged kit sign drafts
- validation messages
- header title derived from `intent`

### Host owns

- table rows / list rows
- runtime dispatch
- page-level persistence
- whether picker is open
- mapping result to page row shape

## Page-specific adapters

### Active bid + takeoff MPT/flagging/lane closure

Host adapter responsibilities:

- open picker for a row
- pass current row as `initialValue`
- on save, map picker output into `MPTSignRow`

Special notes:

- these hosts currently depend on `MPTSignTable`
- this table should not reimplement picker logic
- it should only open the shared modal and apply results

### Sign order

Host adapter responsibilities:

- open picker for new or existing sign
- on save, dispatch result into sign runtime

Special notes:

- `SignEditingSheet` currently mixes:
  - picker flow
  - full sign editor
  - runtime dispatch concerns
- this should be split so runtime dispatch stays in the host and picker logic becomes shared

### Sign shop

Host adapter responsibilities:

- same as sign order
- table rendering differs, picker behavior does not

Special notes:

- sign shop should consume the same picker mode as sign order unless a real behavioral difference is required

### Permanent signs

Host adapter responsibilities:

- open picker only for post-type items
- on save, map picker output into permanent sign row shape

Special notes:

- permanent signs likely want `allowKits = false` unless business rules say otherwise
- this should be explicit in props, not implicit in component forks

## Required Data Dependencies

The picker relies on:

- `signs_all`
- `pata_kits`
- `pts_kits`
- `kit_variants`
- `pata_kit_contents`
- `pts_kit_contents`

Required data rules:

- missing `kit_variants` rows must not crash the picker
- missing sign images must fall back safely
- invalid dimension strings in `signs_all.sizes` must be filtered out
- empty content kits must still render gracefully but block save with a clear message if needed

## Validation Rules

Before save, the picker must enforce:

- designation present unless custom flow
- width > 0
- height > 0
- quantity >= 1
- sheeting present
- substrate present when required by mode
- structure present when required by mode
- kit signs all valid before kit save

Mode-specific validation may differ, but it must be centralized and explicit.

## UX Acceptance Criteria

### Global

- opening the picker never mutates the host page until save
- closing and reopening starts from a clean step state unless editing an existing sign
- back navigation only changes picker-local state
- tab switching does not leak partial selections into saved host state

### MUTCD sign flow

- user selects designation
- if one dimension exists, skip dimension step
- if multiple dimensions exist, show dimension step
- configuration screen shows final selected designation + dimensions
- save returns a complete sign payload
- on edit, user can still change designation and re-run the same dimension/configuration flow

### PATA/PTS kit flow

- user selects kit
- if variants exist, variant step appears
- selected variant changes which contents are configured
- save returns the configured generated sign list

### Custom sign flow

- user can start from custom sign
- manual designation/dimensions are supported
- same configuration and save contract applies

### Edit flow

- editing opens the same modal component, not a sheet
- title changes to `Edit Sign`
- current sign values are preloaded
- user can save attribute-only changes quickly
- user can also change designation and dimension without leaving the modal
- cancel never mutates host state

## Playwright Test Matrix

This should become the baseline E2E matrix for the picker family.

### Shared behavior

1. open picker from each host page
2. cancel from designation step leaves host unchanged
3. cancel from dimension step leaves host unchanged
4. cancel from configuration step leaves host unchanged
5. back button preserves local modal state and never writes to host

### Active bid / MPT table

1. add MUTCD sign with one size
2. add MUTCD sign with multiple sizes
3. edit existing sign
4. add PATA kit with Option A
5. add PATA kit with Option B

### Sign order

1. add MUTCD sign
2. add custom sign
3. add PATA/PTS kit
4. edit existing sign and save
5. verify saved row persists in page state

### Sign shop

1. add sign through picker
2. edit sign through picker
3. add kit with variant
4. verify shop table updates correctly after save

### Takeoff MPT / flagging / lane closure

1. add sign from MPT table
2. edit sign from MPT table
3. verify row values map back correctly

### Permanent signs

1. open picker from post-type row
2. select MUTCD sign
3. save and verify permanent sign row is populated

## Refactor Direction

Recommended order:

1. Freeze this spec and confirm flow expectations.
2. Extract shared picker data loading into one place.
3. Unify step model into one modal wizard.
4. Rename the shared abstraction to `SignPickerModal`.
5. Convert `DesignationSearcher` and `SignEditingSheet` into either:
   - one shared component, or
   - one shared engine with thin mode wrappers
6. Add Playwright tests for the shared flow before deeper cleanup elsewhere.

## Immediate Cleanup Targets

These are the highest-risk areas to normalize first.

1. Duplicate fetch logic for signs/kits/variants in:
   - [DesignationSearcher.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/pages/active-bid/signs/DesignationSearcher.tsx)
   - [SignEditingSheet.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/new/SignEditingSheet.tsx)

2. Different modal orchestration models:
   - stacked modals in `DesignationSearcher`
   - step-driven single modal in `SignEditingSheet`

3. Host mapping duplication in:
   - [MPTSignTable.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/MPTSignTable.tsx)
   - [PermanentSignConfiguration.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/PermanentSignConfiguration.tsx)
   - [SignOrderList.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/new/SignOrderList.tsx)

## Decision For This Spec

The app should standardize on:

- one modal wizard
- name: `SignPickerModal`
- add and edit both use the same modal component
- modal title changes by intent only (`Add Sign` / `Edit Sign`)
- host pages receive only final saved results
- designation, dimension, and configuration always stay inside the modal
- PATA/PTS variant selection is part of the same standardized flow

This is the baseline we should use for refactoring and for new Playwright tests.
