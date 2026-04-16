# Reference Features - Contract Guardian (6)

This document contains the file structure and source code from a codebase with extra features that can be referenced for implementation.

---

## Directory Structure

```
├── ./
    └── Contract Guardian (6)
        ├── src
        │   ├── components
        │   │   ├── layouts
        │   │   │   └── AppLayout.tsx
        │   │   ├── route-builder
        │   │   │   ├── PlacementDetailDialog.tsx
        │   │   │   ├── PlacementPhotoCapture.tsx
        │   │   │   ├── RouteBuilderSidebar.tsx
        │   │   │   ├── RouteMap.tsx
        │   │   │   └── SortablePlacement.tsx
        │   │   ├── tcp
        │   │   │   ├── AddTcpItemDialog.tsx
        │   │   │   ├── EditTcpItemDialog.tsx
        │   │   │   ├── LoadOrderSidebar.tsx
        │   │   │   ├── TcpItemCard.tsx
        │   │   │   └── TcpItemGraphics.tsx
        │   │   ├── ui (shadcn/ui components)
        │   │   │   ├── accordion.tsx
        │   │   │   ├── alert-dialog.tsx
        │   │   │   ├── alert.tsx
        │   │   │   ├── aspect-ratio.tsx
        │   │   │   ├── avatar.tsx
        │   │   │   ├── badge.tsx
        │   │   │   ├── breadcrumb.tsx
        │   │   │   ├── button.tsx
        │   │   │   ├── calendar.tsx
        │   │   │   ├── card.tsx
        │   │   │   ├── carousel.tsx
        │   │   │   ├── chart.tsx
        │   │   │   ├── checkbox.tsx
        │   │   │   ├── collapsible.tsx
        │   │   │   ├── context-menu.tsx
        │   │   │   ├── dialog.tsx
        │   │   │   ├── drawer.tsx
        │   │   │   ├── dropdown-menu.tsx
        │   │   │   ├── form.tsx
        │   │   │   ├── hover-card.tsx
        │   │   │   ├── input-otp.tsx
        │   │   │   ├── input.tsx
        │   │   │   ├── label.tsx
        │   │   │   ├── menubar.tsx
        │   │   │   ├── navigation-menu.tsx
        │   │   │   ├── pagination.tsx
        │   │   │   ├── popover.tsx
        │   │   │   ├── progress.tsx
        │   │   │   ├── radio-group.tsx
        │   │   │   ├── resizable.tsx
        │   │   │   ├── scroll-area.tsx
        │   │   │   ├── select.tsx
        │   │   │   ├── separator.tsx
        │   │   │   ├── sheet.tsx
        │   │   │   ├── sidebar.tsx
        │   │   │   ├── skeleton.tsx
        │   │   │   ├── slider.tsx
        │   │   │   ├── sonner.tsx
        │   │   │   ├── switch.tsx
        │   │   │   ├── table.tsx
        │   │   │   ├── tabs.tsx
        │   │   │   ├── textarea.tsx
        │   │   │   ├── toast.tsx
        │   │   │   ├── toaster.tsx
        │   │   │   ├── toggle-group.tsx
        │   │   │   ├── toggle.tsx
        │   │   │   ├── tooltip.tsx
        │   │   │   └── use-toast.ts
        │   │   ├── ApprovalDrawer.tsx
        │   │   ├── ChangeOrderGateDialog.tsx
        │   │   ├── ChecklistActions.tsx
        │   │   ├── ChecklistBucket.tsx
        │   │   ├── ChecklistHeader.tsx
        │   │   ├── ChecklistProgress.tsx
        │   │   ├── ContactPickerCombobox.tsx
        │   │   ├── ContractManagerEmptyState.tsx
        │   │   ├── ContractManagerErrorBoundary.tsx
        │   │   ├── ContractWizardStepper.tsx
        │   │   ├── CreateTakeoffForm.tsx
        │   │   ├── CustomerAdminInfo.tsx
        │   │   ├── CustomerPickerCombobox.tsx
        │   │   ├── DispatchSchedule.tsx
        │   │   ├── DocumentsFormsStep.tsx
        │   │   ├── EquipmentProfileDialog.tsx
        │   │   ├── EquipmentSummary.tsx
        │   │   ├── EquipmentUtilization.tsx
        │   │   ├── GanttTimelineDialog.tsx
        │   │   ├── MaterialTakeoff.tsx
        │   │   ├── MPTSignTable.tsx
        │   │   ├── NavLink.tsx
        │   │   ├── OrderStatusTimeline.tsx
        │   │   ├── PermanentSignTable.tsx
        │   │   ├── ProjectFooter.tsx
        │   │   ├── ProjectInfoFields.tsx
        │   │   ├── RentalInfoDialog.tsx
        │   │   ├── RentalInspectionDialog.tsx
        │   │   ├── RentalInventory.tsx
        │   │   ├── ReturnInventoryCard.tsx
        │   │   ├── RoleGuard.tsx
        │   │   ├── RoleRedirect.tsx
        │   │   ├── SaveStatusIndicator.tsx
        │   │   ├── ScheduleOfValues.tsx
        │   │   ├── SignShapeIcon.tsx
        │   │   ├── TakeoffStatusBadge.tsx
        │   │   └── WorkOrderLineItemsTable.tsx
        │   ├── context
        │   │   ├── AuthContext.tsx
        │   │   └── JobsContext.tsx
        │   ├── data
        │   │   ├── branches.ts
        │   │   ├── customers.ts
        │   │   ├── masterItems.ts
        │   │   ├── paCountyMunicipalities.ts
        │   │   ├── products.ts
        │   │   ├── signCatalog.ts
        │   │   └── users.ts
        │   ├── hooks
        │   │   ├── use-mobile.tsx
        │   │   ├── use-toast.ts
        │   │   ├── useBranchSettings.ts
        │   │   ├── useBuildRequests.ts
        │   │   ├── useContractDraft.ts
        │   │   ├── useCreatePickupWorkOrder.ts
        │   │   ├── useCreateRevision.ts
        │   │   ├── useDispatches.ts
        │   │   ├── useGoogleMapsKey.ts
        │   │   ├── useJobFromDB.ts
        │   │   ├── useNotifications.ts
        │   │   ├── usePermissions.ts
        │   │   ├── useProjectPhases.ts
        │   │   ├── useScheduleOfValues.ts
        │   │   ├── useSignOrders.ts
        │   │   ├── useTcpAnnotations.ts
        │   │   ├── useTcpItemTypes.ts
        │   │   ├── useTcpLoadOrder.ts
        │   │   ├── useTcpPlans.ts
        │   │   ├── useTcpProjectItems.ts
        │   │   ├── useTcpProjectPhases.ts
        │   │   ├── useTcpProjects.ts
        │   │   ├── useUpsertSignOrder.ts
        │   │   ├── useUpsertTakeoff.ts
        │   │   └── useWorkOrders.ts
        │   ├── integrations
        │   │   └── supabase
        │   │       ├── client.ts
        │   │       └── types.ts
        │   ├── lib
        │   │   └── utils.ts
        │   ├── pages
        │   │   ├── dashboards
        │   │   │   ├── AdminDashboard.tsx
        │   │   │   ├── BuildShopLaborerDashboard.tsx
        │   │   │   ├── PCADashboard.tsx
        │   │   │   ├── RoadLaborerDashboard.tsx
        │   │   │   ├── SignShopLaborerDashboard.tsx
        │   │   │   ├── SignShopProductivity.tsx
        │   │   │   ├── UserManagement.tsx
        │   │   │   └── WageRateManager.tsx
        │   │   ├── tcp
        │   │   │   ├── TcpDashboard.tsx
        │   │   │   ├── TcpItemTypesPage.tsx
        │   │   │   ├── TcpPlanMarkup.tsx
        │   │   │   └── TcpProjectDetail.tsx
        │   │   ├── AuthPage.tsx
        │   │   ├── BillingTrackerJobDetail.tsx
        │   │   ├── BuildRequestDetail.tsx
        │   │   ├── BuildShopManager.tsx
        │   │   ├── ContractChecklist.tsx
        │   │   ├── ContractManager.tsx
        │   │   ├── CreateTakeoffPage.tsx
        │   │   ├── CreateWorkOrderPage.tsx
        │   │   ├── CustomerManager.tsx
        │   │   ├── DispatchDetail.tsx
        │   │   ├── EquipmentOnJobReport.tsx
        │   │   ├── JobList.tsx
        │   │   ├── MySignOrders.tsx
        │   │   ├── NotFound.tsx
        │   │   ├── PayAppDueDates.tsx
        │   │   ├── ProjectDetail.tsx
        │   │   ├── RentalSchedulePage.tsx
        │   │   ├── RouteBuilderPage.tsx
        │   │   ├── SignOrderPage.tsx
        │   │   ├── SignShopManager.tsx
        │   │   ├── SignShopPurchasing.tsx
        │   │   └── WorkOrderDetail.tsx
        │   ├── test
        │   │   ├── example.test.ts
        │   │   └── setup.ts
        │   ├── types
        │   │   ├── contractList.ts
        │   │   ├── document.ts
        │   │   └── job.ts
        │   ├── utils
        │   │   ├── contractErrors.ts
        │   │   ├── generateBillingPacketPdf.ts
        │   │   ├── generateBuildShopTakeoffPdf.ts
        │   │   ├── generateContractPdf.ts
        │   │   ├── generatePurchaseOrderPdf.ts
        │   │   ├── generateRentalBillingPdf.ts
        │   │   ├── generateRentalCalendarPdf.ts
        │   │   ├── generateReturnTakeoffPdf.ts
        │   │   ├── generateSignOrderPdf.ts
        │   │   ├── generateTakeoffPdf.ts
        │   │   ├── generateUtilizationReportPdf.ts
        │   │   └── signMaterial.ts
        │   ├── App.css
        │   ├── App.tsx
        │   ├── index.css
        │   └── main.tsx
        ├── supabase
        │   └── functions
        │       ├── cancel-takeoff
        │       ├── create-or-update-dispatch
        │       ├── create-pickup-work-order
        │       ├── create-takeoff-revision
        │       ├── delete-job
        │       ├── delete-takeoff
        │       ├── delete-work-order
        │       ├── generate-work-order-from-takeoff
        │       ├── get-tcp-plan-download-url
        │       ├── google-maps-key
        │       ├── rental-operation
        │       ├── reopen-takeoff
        │       ├── submit-takeoff-to-build-shop
        │       ├── submit-takeoff-to-sign-shop
        │       ├── upsert-build-request
        │       ├── upsert-contract-draft
        │       ├── upsert-project-phase
        │       ├── upsert-sign-order
        │       ├── upsert-sov-items
        │       ├── upsert-takeoff
        │       └── upsert-work-order
        ├── eslint.config.js
        ├── index.html
        ├── postcss.config.js
        ├── tailwind.config.ts
        ├── vite.config.ts
        └── vitest.config.ts
```

---

## Key Pages & Features

### 1. PayAppDueDates.tsx
- **Description**: Billing tracker showing all active projects with pay app due day configuration
- **Features**:
  - Sortable table with columns for job number, project owner, contract #, customer, billing status
  - Branch filtering via dropdown
  - Stats cards showing total active, due date set, missing due date, billing in progress
  - Click to navigate to BillingTrackerJobDetail
  - Query: filters jobs by `billing_status IN ['NOT STARTED', 'IN PROGRESS']` and `contract_status IN ['CONTRACT_SIGNED', 'SOURCE_OF_SUPPLY']`

### 2. CustomerManager.tsx
- **Description**: Three-panel customer management interface
- **Features**:
  - Left panel: Searchable customer list
  - Middle panel: Customer details with edit mode, bill-to/ship-to addresses
  - Right panel: Customer contacts management
  - Associated documents section showing linked contracts/quotes
  - CRUD operations for customers and contacts

### 3. ContractManager.tsx
- **Description**: Kanban-style contract pipeline management
- **Features**:
  - Pipeline stages: Contract Received → Returned to Customer → Contract Signed → Source of Supply
  - Drag-and-drop between stages
  - File upload for signed contracts (max 25MB)
  - Missing requirements modal
  - Kanban and List view modes
  - Delete contract confirmation
  - Pipeline progress bar in header

### 4. ProjectDetail.tsx
- **Description**: 360° project view with tabs
- **Features**:
  - Top header with project info (job name, ETC job #, customer, contract #, county)
  - Quick actions bar: Create Takeoff, Create Work Order, Schedule Rental, etc.
  - Side cards: Project Timeline, Order Tab (sign/build shop counts), Work Orders
  - Tabs: Bid Items/SOV, Takeoffs, Equipment, Job Contacts, Labor & Time, Sign Orders, Dispatch, Notes & Photos, Documents, Purchase Orders
  - Alerts panel with rental overdays, pending time approvals
  - Google Maps embed for job location
  - Project notes with edit mode
  - Edit job dialog for extension dates and customer PM info

### 5. SignShopManager.tsx
- **Description**: Sign shop kanban board
- **Features**:
  - Board/List/Completed view modes
  - Kanban columns with drag-and-drop
  - Urgency indicators (critical, high, upcoming)
  - Size classification (SMALL, MEDIUM, LARGE) based on sign count
  - Production progress tracking
  - Assign to laborers functionality
  - Priority scoring for sorting

### 6. SignShopPurchasing.tsx
- **Description**: Sign shop purchasing and demand aggregation
- **Features**:
  - Demand tab: Shows all sign order items with need date
  - PO creation from selected items
  - Urgent need date warning (within 7 days)
  - Purchase order tracking with status updates
  - PDF generation for POs
  - Status: draft, ordered, partial_received, received, cancelled

### 7. CreateTakeoffPage.tsx
- **Description**: Takeoff creation/edit page
- **Features**:
  - Salesforce-style breadcrumb navigation
  - Reuses CreateTakeoffForm component

### 8. JobList.tsx
- **Description**: Main job list with branch tabs
- **Features**:
  - "My Jobs" tab filtered by PM
  - Ready to Schedule queue (WOs ready but not scheduled)
  - Branch-filtered tabs
  - Overdays alerts for MPT takeoffs
  - Sortable columns: Job Number, Contract #, Project, Owner, Contractor, County/Branch, PM, Job Status, Billing Status, Start Date, End Date, Created
  - Checkbox selection for batch operations

### 9. DispatchDetail.tsx
- **Description**: Dispatch detail page for field crews
- **Features**:
  - Job info card
  - Dispatch details (arrival time, crew members)
  - Billing line items table
  - WO notes (read-only)
  - Crew notes (editable for road laborers)
  - Customer not on site checkbox
  - Customer signature name field
  - Mark complete functionality

### 10. AuthPage.tsx
- **Description**: Authentication page with login/signup
- **Features**:
  - Tabs for Sign In and Sign Up
  - Supabase auth integration
  - Full name capture for signup

### 11. MySignOrders.tsx
- **Description**: User's sign orders list
- **Features**:
  - Expandable rows showing order items
  - Tab filtering: All, Job Orders, Sale Orders
  - Sort by newest/oldest
  - Search by order number, customer, sign designation
  - Duplicate order functionality
  - Delete draft orders
  - Progress tracking per order

### 12. RouteBuilderPage.tsx
- **Description**: Map-based route builder for sign placement
- **Features**:
  - Google Maps integration
  - Builder/Crew view modes
  - Click-to-place signs on map
  - Drag-and-drop reorder
  - Photo capture for placements
  - Status updates (pending, placed, removed)
  - Real-time subscription updates
  - Navigate to location via Google Maps

### 13. BillingTrackerJobDetail.tsx
- **Description**: Detailed billing review for a single job
- **Features**:
  - Three-panel layout: WO list, PDF viewer, billing review panel
  - PDF generation for work orders and takeoffs
  - Billing review status: not_reviewed, reviewed, pending
  - Billing notes field
  - Auto-updates job's billing_last_modified_at/by

### 14. BuildRequestDetail.tsx
- **Description**: Build shop request detail with procurement tracking
- **Features**:
  - Status pipeline: NEW → UNDER_REVIEW → AWAITING_SIGNS → MATERIALS_READY → BUILD_QUEUE → IN_BUILD → READY_FOR_PM → COMPLETED
  - Procurement fields: stock qty, full qty, overlay qty
  - Order signs to sign shop
  - Revision diff tracking
  - Audit log
  - Completion location tracking (trailer, etc.)

---

## Role-Based Access Control

The app uses `RoleGuard` and `RoleRedirect` components with these roles:
- `system_admin`
- `project_manager`
- `project_contract_admin`
- `sign_shop_manager`
- `sign_shop_laborer`
- `build_shop_laborer`
- `road_laborer`

### Route Permissions:
- `/admin` - system_admin only
- `/jobs` - office + sign shop manager
- `/contracts` - office only
- `/sign-shop/*` - sign shop roles
- `/build-shop/*` - build shop roles
- `/my-work` - road laborer, system_admin, project_manager
- `/tcp/*` - office only

---

## Supabase Edge Functions

Located in `supabase/functions/`:
- `upsert-contract-draft` - Update contract with version conflict handling
- `upsert-sign-order` - Create/update sign orders
- `upsert-takeoff` - Create/update takeoffs
- `upsert-build-request` - Build shop request management
- `upsert-work-order` - Work order operations
- `rental-operation` - Rental equipment operations
- `create-or-update-dispatch` - Dispatch management
- And more...

---

## Key Components

### RoleGuard.tsx
```tsx
// Wraps content, only visible to users with allowed roles
<RoleGuard allowed={["system_admin", "project_manager"]}>
  {children}
</RoleGuard>
```

### RoleRedirect.tsx
```tsx
// Redirects to appropriate dashboard based on user role
```

### GanttTimelineDialog.tsx
- Visual timeline for project schedule

### DispatchSchedule.tsx
- Schedule dispatches for work orders

### EquipmentSummary.tsx
- Equipment usage summary per job

### MaterialTakeoff.tsx
- Material takeoff management

### ScheduleOfValues.tsx
- SOV table with line item editing

---

## Notes for Implementation

1. **Tailwind Config**: Extended with sidebar colors, success/warning colors, custom border radius
2. **Auth**: Uses Supabase auth with profile metadata for full_name
3. **Database**: Jobs, customers, contacts, takeoffs, sign_orders, work_orders, dispatches, build_requests, documents
4. **Realtime**: Supabase realtime subscriptions for live updates
5. **PDF Generation**: Uses jspdf and html2canvas for various report PDFs
6. **Maps**: Google Maps API for route builder

---

*The full source code files are attached in the source text file.*
