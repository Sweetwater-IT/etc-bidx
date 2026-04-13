# Customer And Contact Modal Spec

## Goal

Customer and contact management should behave as one product-level system across the app.

There are two separate component families:

1. selectors
2. add/edit modals

Selectors should stay lightweight and embedded inside the host page.

Add and edit should be modal-driven, self-contained, and consistent everywhere they appear.

## Standard Names

### Selectors

- `CustomerSelector`
- `ContactSelector`

### Add / edit modals

- `CustomerModal`
- `CustomerContactModal`

These names should become the public entry points used by host pages.

## Product Rules

### Rule 1: Selection is not CRUD

Selectors are for choosing existing records.

They may use:

- command lists
- popovers
- searchable tables
- compact embedded UIs

Selectors should not own the full add/edit workflow.

### Rule 2: Add and edit are modal-based

Customer and contact add/edit should open in modals everywhere.

They should not open in:

- sheets
- drawers
- nested sheet subviews

### Rule 3: Add and edit are separate intents on the same component

Each shared modal should support:

- `mode="create"`
- `mode="edit"`

The component should decide title and behavior from `mode`.

Examples:

- `CustomerModal` title:
  - `Add Customer`
  - `Edit Customer`
- `CustomerContactModal` title:
  - `Add Contact`
  - `Edit Contact`

### Rule 4: Customer create stays simpler than customer edit

Customer create should remain the lightweight flow used today in the simpler hosts.

Customer edit should keep the full data set currently supported by [customer-form.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/customer-form.tsx), including:

- company information
- main address
- bill-to address
- bill-to same-as-main behavior
- person ordering
- primary contact
- primary contact same-as-person-ordering behavior
- project manager
- payment terms
- credit application checkbox

### Rule 5: Contact create stays simpler than contact edit

Contact create should preserve the lightweight required fields used today:

- name
- role
- email
- phone

Contact edit should preserve the same collected data and allow editing all current fields.

### Rule 6: No data-shape regressions

This refactor must not remove or silently change:

- required fields
- dropdown options
- checkbox behaviors
- saved payload shape
- customer/contact relationship behavior
- immediate host-page updates after create/edit

### Rule 7: Host pages own only final selection and saved results

Host pages should own:

- whether selector is open
- current selected customer/contact
- whether modal is open
- what happens after save

Shared modals should own:

- field state
- validation
- API submission
- create/edit copy
- modal close behavior

## Current Host Coverage

### 1. Quote create / edit

Current files:

- [CustomerSelector.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/quotes/create/components/CustomerSelector.tsx)
- [QuoteCustomerSheet.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/quotes/create/components/QuoteCustomerSheet.tsx)

Current state:

- embedded customer/contact selector buttons
- sheet-based customer/contact workflow
- customer add uses full [CustomerForm](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/customer-form.tsx)
- contact add is custom inside the sheet

Target:

- selector remains embedded
- add/edit move to `CustomerModal` and `CustomerContactModal`

### 2. Sign order create / edit

Current file:

- [SignOrderDetailsSheet.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/sign-order/SignOrderDetailsSheet.tsx)

Current state:

- sheet with internal customer/contact subviews
- customer create is custom
- contact create/edit is custom

Target:

- selection remains local to the host
- add/edit move to modal entry points

### 3. Sign shop order create / edit

Current file:

- [SignShopAdminInfo.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/takeoffs/sign-order/[id]/SignShopAdminInfo.tsx)

Current state:

- customer create uses [simple-customer-create-dialog.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/simple-customer-create-dialog.tsx)
- contact create/edit uses [customer-contact-form.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/customer-contact-form.tsx)

Target:

- use `CustomerModal`
- use `CustomerContactModal`

### 4. `l/contracts`

Current files:

- [CustomerInformationSection.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/contracts/[contractNumber]/CustomerInformationSection.tsx)
- [CreateJobModal.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/contracts/[contractNumber]/CreateJobModal.tsx)
- [SelectContacts.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/components/SelectContacts.tsx)

Current state:

- contact selection uses popover / command UI
- contact add uses the existing contact dialog component

Target:

- keep lightweight `ContactSelector`
- route add/edit through `CustomerContactModal`

### 5. `/customers`

Current file:

- [CustomersContent.tsx](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/app/customers/CustomersContent.tsx)

Current state:

- custom dialogs for:
  - new customer
  - edit customer
  - add contact
  - edit contact

Target:

- replace these with:
  - `CustomerModal`
  - `CustomerContactModal`

## Target Architecture

## `CustomerSelector`

Purpose:

- select an existing customer

Responsibilities:

- search
- show current selection
- allow opening `CustomerModal` when the host wants create/edit

Non-responsibilities:

- full customer CRUD form state

## `ContactSelector`

Purpose:

- select an existing contact for the currently selected customer

Responsibilities:

- search
- show current selection
- allow opening `CustomerContactModal`

Non-responsibilities:

- full contact CRUD form state

## `CustomerModal`

Public contract:

- one shared modal entry point for customer create/edit
- modal title changes with mode
- create may use a simple flow
- edit must preserve the full customer data contract

## `CustomerContactModal`

Public contract:

- one shared modal entry point for contact create/edit
- modal title changes with mode
- preserve current role, email, and phone behavior

## Migration Order

### Phase 1: Standardize public component names

- add `CustomerModal`
- add `CustomerContactModal`
- keep existing underlying form logic intact

### Phase 2: Move existing modal-based callers first

Low-risk initial callers:

- sign shop customer create
- sign shop contact create/edit
- `SelectContacts`
- other direct contact-dialog callers

### Phase 3: Replace sheet-based customer/contact flows

Higher-risk hosts:

- quote create/edit
- sign order create/edit
- `/customers`

These should be migrated only after the public modal contract is in place and verified.

## Verification Matrix

Each migrated host should verify:

1. open selector
2. create customer or contact
3. record is immediately selectable
4. edit existing customer or contact
5. saved fields still render correctly in host page
6. cancel leaves host-page state unchanged

## Playwright Targets

Priority coverage after migration:

- quote create customer/contact flow
- sign order customer/contact flow
- sign shop customer/contact flow
- contract contact flow
- customers page add/edit customer/contact flow
