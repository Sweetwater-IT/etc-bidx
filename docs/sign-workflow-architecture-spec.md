# Sign Workflow Architecture Spec

This document captures the current architectural risks and the recommended target architecture for the sign workflows used on:

- `/active-bid/new`
- `/active-bid/edit`
- `/takeoffs/sign-order`
- related sign configuration surfaces that reuse the same sign-picking and sign-editing patterns

This is a stability-focused spec. The goal is not only consistent UX, but bug-resistant architecture:

- no frozen pages
- no popovers/selectors that fail to scroll or click
- no sheets/modals that close too early or refuse to reopen
- no mismatched draft state between create/edit
- no runtime state mutation while the user is still mid-edit unless it is explicitly committed

## Why This Needs To Be Spec'd

These pages are some of the highest-traffic workflows in the app, and they combine several complex interaction systems:

- fullscreen page flows
- multiple sheets
- nested modal/picker interactions
- row-level editing
- context/runtime state
- create vs edit vs duplicate vs custom-item behavior

That combination means small state mistakes become major UX failures.

The recent bugs are not random. They are symptoms of the current architecture:

- customer/contact popovers inside sheets fighting scroll lock and pointer events
- add/edit sign modal state not reopening correctly after an edit flow
- configuration content split between host page state and modal-local state
- runtime/equipment state changing during configuration instead of after commit
- multiple overlay generations in the same page family

## Current Shared Architecture

Today, the sign workflows already share more than they used to:

- `app/takeoffs/new/SignOrderList.tsx`
  - main sign table/editor host used in sign-order flows and reused by active-bid sign list
- `app/takeoffs/new/SignPickerModal.tsx`
  - shared sign picker/configuration workflow
- `components/pages/active-bid/signs/SignPickerModal.tsx`
  - now a thin adapter into the shared `SignPickerModal`
- `hooks/use-sign-runtime.ts`
  - runtime bridge that resolves sign-order builder context or estimate context
- `hooks/use-sign-catalog.ts`
  - shared cached sign catalog source

This is the right direction.

The problem is not lack of reuse anymore. The problem is that state ownership is still too distributed.

## Main Conclusion

The core issue is not “we need fewer components.”

The core issue is:

- too many state owners for the same workflow
- too much lifecycle logic living in host pages
- too much coupling between draft edits and runtime/equipment updates
- not enough hard rules around overlay ownership

In short:

- component sharing is necessary
- shared architecture is not complete until state ownership is centralized

## Architectural Risks In The Current Pattern

### 1. Overlay Ownership Is Too Distributed

The same workflow currently depends on:

- page state
- table/row state
- modal-local step state
- sometimes sheet state
- sometimes context/runtime state

When multiple layers can decide when something opens, closes, resets, or is deleted, the app becomes fragile.

This causes:

- modal opens once, then not again
- edit works, then add stops working
- closing a child overlay resets the wrong parent state
- stale selection remains mounted after save/cancel

### 2. Draft State And Runtime State Are Too Entangled

The sign picker currently does more than collect a draft.

Historically, it also mutated runtime-dependent equipment information while the user was still configuring:

- structures
- covers
- b-lights
- secondary sign quantity sync

That is dangerous in a modal workflow because:

- the user has not committed yet
- cancel should discard changes cleanly
- switching create/edit/custom/kit paths should not leave runtime residue behind

This is one of the biggest sources of “state mismatch” bugs.

### 3. Host Pages Still Own Too Much Modal Cleanup Logic

Some host components treat `onOpenChange` like a cleanup function instead of a real open-state contract.

That means:

- the child thinks it is controlled like a normal dialog
- the parent force-resets on every state transition
- add/edit transitions become brittle

This is a direct source of “modal doesn’t reopen” bugs.

### 4. Overlay-Safe Input Patterns Are Not Yet Fully Standardized

Some reusable selectors are now fixed, but the whole interaction family is not fully normalized yet.

Risk areas:

- popover in sheet
- popover in modal
- command list scroll ownership
- focus trap interactions
- pointer-event cleanup
- z-index layering

Without a hard standard, bugs reappear page by page.

### 5. `/active-bid/new` Has Too Many Workflow Surfaces Without A Page-Level Overlay Spec

`/active-bid/new` is especially risky because it has:

- overall page flow/stepper state
- multiple work-type sections
- multiple sheets
- add/edit sign flows
- row-level interactions
- modal-based selection/configuration

That page needs a page-level interaction architecture, not just component fixes.

## Target Architecture

### Principle 1: One Shared Sign Workflow Component

There should be one shared sign workflow component for:

- add sign
- edit sign
- custom sign
- MUTCD selection
- PATA kits
- PTS kits
- dimensions
- configuration

This is already mostly true now.

The next step is to make that shared component the only workflow owner, not just the only UI renderer.

### Principle 2: One Draft Owner Per Modal Session

When the user opens add/edit sign:

- create a draft sign object
- the modal edits the draft
- save commits the draft
- cancel discards the draft

The modal session should be draft-based, not runtime-mutation-based.

Recommended rule:

- no runtime/equipment mutation during draft editing
- runtime/equipment mutation happens only on save/commit

This is the most important stability improvement.

### Principle 3: Parent Owns `open`, Child Owns Workflow Steps

The parent page/host should own only:

- whether the modal is open
- which draft is being edited
- whether the session is `create` or `edit`

The shared sign modal should own:

- designation step
- dimension step
- kit variant step
- configuration step
- back navigation within the workflow

Recommended split:

- parent owns session lifecycle
- modal owns workflow lifecycle

### Principle 4: One Open-State Contract

Every host should follow the same rule:

- `open: boolean`
- `onOpenChange(nextOpen: boolean)`
- `draftSign`
- `sessionMode: 'create' | 'edit'`

And then separate helpers:

- `startCreateSign()`
- `startEditSign(signId)`
- `closeSignSession()`
- `commitSignSession(result)`

Important:

- `onOpenChange` must not double as a cleanup-only callback
- cleanup should be explicit and local to `closeSignSession()`

### Principle 5: One Overlay At A Time Per Workflow Family

For the sign workflow:

- one modal
- internal step transitions
- no secondary nested sign-config modal
- no second overlay for kit configuration

The user should feel like they are moving through one workflow, not opening stacks of unrelated dialogs.

### Principle 6: All Popover-Based Controls Must Be Overlay-Safe By Default

Any reusable selector/date/control that can appear inside:

- a sheet
- a modal
- a fullscreen workflow

must follow the same hardened pattern:

- explicit scroll container
- explicit pointer-event restoration
- explicit focus-safe behavior
- stable z-index layering
- no ad hoc popover behavior by page

This should be a standard, not an exception.

## Recommended Page-Level Architecture

### `/takeoffs/sign-order`

Recommended state ownership:

- page owns:
  - `isSignEditorOpen`
  - `signEditorMode`
  - `signDraft`
- shared modal owns:
  - picker/configuration steps
  - local in-session workflow
- runtime builder/context owns:
  - committed sign data only

Recommended save flow:

1. user opens add/edit
2. page creates draft
3. modal edits draft
4. user clicks save
5. page commits draft into sign-order runtime state
6. page closes session and clears draft

### `/active-bid/new`

Recommended state ownership:

- page owns:
  - top-level page/stepper state
  - which work-type section is active
  - one sign-editor session object
- sign-related table/row components do not own modal state directly
- they only request:
  - “open create sign”
  - “open edit sign for sign X”

This page should not let each work-type subcomponent invent its own modal lifecycle.

Recommended central session object:

```ts
type SignEditorSession =
  | { open: false }
  | {
      open: true;
      mode: 'create' | 'edit';
      source: 'mpt' | 'permanent-sign' | 'sign-order-conversion';
      draftSign: PrimarySign | SecondarySign;
      targetId?: string;
    };
```

That creates a single page-level owner for sign editing.

## Recommended Shared Rules

### Rule 1: Save Is The Only Commit Point

Do not update:

- equipment counts
- structure allocations
- cover counts
- b-light totals
- related secondary sign sync

until the user saves.

### Rule 2: Cancel Must Be Pure

Cancel must:

- close the modal
- discard the draft
- leave runtime state untouched

No side effects.

### Rule 3: Add And Edit Must Use The Same Session Shape

The only difference between add and edit should be:

- which draft is loaded
- where save commits the result

The modal should not have separate architectural paths for add vs edit.

### Rule 4: Create Custom Sign Is Not A Separate System

Custom sign should be a branch inside the same workflow:

- same modal
- same draft object
- same configuration region
- same save behavior

Not a separate overlay or separate persistence model.

### Rule 5: Kit Configuration Must Stay In The Same Workflow

PATA/PTS kit selection and configuration should:

- remain in the same modal
- use back navigation within that modal
- not open secondary modal layers

### Rule 6: Placeholder Rows Must Not Own Session Logic

Empty table rows are a UI convenience only.

They should not:

- persist prematurely
- delete themselves while the modal is transitioning
- own the modal lifecycle

The modal should work with a draft session, not with fragile placeholder row behavior.

## Best Practices For Bug-Free Interaction Architecture

### Do

- keep one modal per workflow family
- keep one draft object per session
- commit only on save
- make cancel side-effect free
- centralize modal open/close state in the page
- centralize overlay-safe selectors/popovers
- use explicit session helpers instead of incidental state mutation

### Do Not

- update runtime equipment totals while the modal is still open
- let row components invent their own modal lifecycle logic
- overload `onOpenChange` with custom cleanup semantics
- nest second/third modal layers for what should be step transitions
- let placeholder rows control save/cancel logic
- mix “draft state” and “committed state” in the same object graph

## Concrete Refactor Recommendations

### Short Term

1. Standardize sign editor session ownership in both `/takeoffs/sign-order` and `/active-bid/new`.
2. Replace close-only `onOpenChange` handlers with proper open-state handlers.
3. Move runtime/equipment mutation to save-time only.
4. Keep using the shared sign modal, but remove host-specific lifecycle hacks.
5. Continue auditing selectors/popovers used inside sheets and modals.

### Medium Term

1. Introduce a page-level `useSignEditorSession()` hook for:
   - open create
   - open edit
   - close
   - commit
2. Introduce a small shared overlay contract for:
   - modal open state
   - draft session
   - cleanup rules
3. Move sign-order and active-bid hosts onto the same session pattern.

### Long Term

1. Create one formal interaction spec for `/active-bid/new`.
2. Create one formal interaction spec for `/takeoffs/sign-order`.
3. Define shared overlay conventions for:
   - sheets
   - modals
   - popovers
   - selectors
   - date pickers

## Definition Of Done For This Architecture

This architecture can be considered stable when:

- add after edit always works
- edit after add always works
- cancel never mutates committed state
- save is the only commit point
- kit flows stay in one modal
- customer/contact selectors scroll and click reliably inside sheets/modals
- no nested modal conflicts remain
- `/active-bid/new` sign flows use one centralized session model
- `/takeoffs/sign-order` sign flows use the same session model

## Final Recommendation

The right move is not to keep patching isolated modal bugs.

The right move is to treat sign editing as a shared workflow subsystem with:

- one shared modal
- one draft-per-session model
- one parent-owned session contract
- save-only commit semantics
- overlay-safe primitives across the whole page

That is the best path to an error-resistant, bug-resistant architecture for the second most important page in the app.
