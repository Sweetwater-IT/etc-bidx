# App Shell Architecture Spec

This document defines the target app-shell architecture for this repo and the migration path away from duplicated sidebar and header implementations.

## Summary

The target architecture is:

- 1 shared route-level app shell for standard authenticated app flows
- 1 shared nested header wrapper for routes that use the standard `SiteHeader`
- 0 page-level ad hoc shells in the steady state
- 0 exceptional standalone shells by default

An exceptional standalone shell is allowed only when a route intentionally opts out of normal app chrome for a documented reason such as print, kiosk, fullscreen workflow, public page, or embed context.

## Why This Exists

The repo currently mixes multiple shell patterns across layouts and page components. That duplication is the root cause of several recurring UI bugs:

- sticky headers that overlap content
- inconsistent scroll behavior between list, detail, and edit pages
- sidebar state resetting or behaving differently across route transitions
- inconsistent page framing and spacing
- layout bugs caused by multiple `SidebarProvider` instances or conditional shell composition

These are architecture problems, not isolated page bugs. The shell must have one owner.

## 1. Current State

### Multiple shell implementations exist
The repo currently has multiple route-level and page-level shell implementations that recreate some combination of:

- `SidebarProvider`
- `AppSidebar`
- `SidebarInset`
- `SiteHeader`

### Page components still own layout infrastructure
Many individual `page.tsx` files directly instantiate shell components. That means pages are making independent decisions about:

- sidebar context ownership
- inset sizing and overflow behavior
- whether `SiteHeader` is rendered
- sticky header placement
- page background and frame behavior

This is the primary anti-pattern to remove.

### One nested header wrapper already exists
`app/(app-shell)/(bid-pages)/layout.tsx` is currently the correct pattern shape for a nested standard-header wrapper.

It is **not** a full shell. It exists only to add `SiteHeader` on top of the canonical shell.

This exact file/path should be kept as the standard nested header wrapper during the migration unless there is a deliberate future rename. The architecture in this spec assumes that this path remains the shared standard-header wrapper.

## 2. Recommended Final Architecture

### Canonical shell owner
`app/(app-shell)/layout.tsx` is the single canonical shell for authenticated internal app routes.

It owns:

- `SidebarProvider`
- `AppSidebar`
- `SidebarInset`
- shell-level sidebar/chat coordination
- baseline app frame behavior

It does **not** own route-specific content headers.

### Canonical standard-header owner
`app/(app-shell)/(bid-pages)/layout.tsx` is the shared nested header wrapper for routes that use the standard app header.

It owns:

- `SiteHeader`

It does **not** own:

- `SidebarProvider`
- `AppSidebar`
- `SidebarInset`

### Feature page responsibility
Feature pages and feature content components should render page content only.

They must not instantiate:

- `SidebarProvider`
- `AppSidebar`
- `SidebarInset`
- `SiteHeader`

The only allowed exception for `SiteHeader` is a route with an intentionally custom top section that replaces the standard header pattern.

### Structural model

```text
app/
  layout.tsx                              # root providers only
  (app-shell)/
    layout.tsx                            # canonical shell
    (bid-pages)/
      layout.tsx                          # canonical standard-header wrapper
      ...
    ...
```

### URL behavior
Route groups must be used for layout ownership without changing public URLs.

Routes should be physically moved under route groups where needed, but URL paths should remain unchanged because route-group folder names do not appear in the URL.

## 3. Rules

1. **Use the main shell by default**
   All authenticated internal app routes should live under `app/(app-shell)/`.

2. **Use the standard header wrapper by default**
   Any route that uses the standard top app header should live under `app/(app-shell)/(bid-pages)/`.

3. **Pages do not own shell infrastructure**
   `page.tsx` files and feature content components must not render `SidebarProvider`, `AppSidebar`, or `SidebarInset`.

4. **Pages do not own `SiteHeader`**
   `page.tsx` files and feature content components must not render `SiteHeader` unless the route intentionally uses a custom top section instead of the shared standard-header wrapper.

5. **Custom top sections are allowed, but intentional**
   A route may skip the nested standard-header wrapper only when it intentionally replaces it with a route-specific top section.

6. **Exactly one sidebar context for standard app flows**
   Standard authenticated app flows must mount exactly one `SidebarProvider`.

7. **No conditional shell ownership**
   Do not conditionally mount shell infrastructure inside pages or route layouts for normal app flows.

## 4. Migration Map

### Keep
Keep these layouts as the long-term architecture:

- `app/(app-shell)/layout.tsx`
- `app/(app-shell)/(bid-pages)/layout.tsx`

### Fold into the canonical shell architecture
These route-level layouts should not remain separate full shells:

- `app/l/contracts/layout.tsx`
- `app/quotes/layout.tsx`
- `app/takeoffs/load-sheet/layout.tsx` unless load-sheet is explicitly approved as an exception

### Migration mechanism
For each route area currently using its own shell:

1. Move the route under `app/(app-shell)/` if it is a standard authenticated internal route.
2. Move it under `app/(app-shell)/(bid-pages)/` if it should use the shared `SiteHeader`.
3. Keep the route URL unchanged by relying on route groups rather than URL-bearing folder renames.
4. Delete the local route-level shell layout once the route is successfully using the shared shell.
5. If immediate deletion is risky, temporarily reduce the local layout to a pass-through wrapper and remove it in the next cleanup step.
6. Remove all page-level shell composition from the migrated pages.

### Specific direction
- `l/contracts` should be folded into the main shell architecture, not kept as a separate shell.
- `quotes` should be folded into the main shell architecture unless it is intentionally a separate product surface.
- `takeoffs/load-sheet` should be folded into the main shell architecture unless it is explicitly approved as an exception.
- Existing page-level shell usage across `app/l/*`, `app/takeoffs/*`, `app/contracts/*`, root `app/*`, `app/reports/*`, `app/sales/*`, `app/customers/*`, `app/project-management/*`, `app/documents/*`, and similar internal routes should be replaced with layout-owned shell usage.

### Refactoring pattern

Before:

```tsx
export default function SomePage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader showTitleBlock={false} />
        <FeatureContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

After:

```tsx
export default function SomePage() {
  return <FeatureContent />;
}
```

Shell ownership moves to:

- `app/(app-shell)/layout.tsx` for sidebar infrastructure
- `app/(app-shell)/(bid-pages)/layout.tsx` for the standard header when used

## 5. Acceptance Criteria

The architecture is considered complete when all of the following are true:

- all normal internal routes share the same sidebar persistence behavior
- standard authenticated app flows mount exactly one `SidebarProvider`
- headers no longer overlap or cover content due to per-page shell composition
- scroll behavior is consistent across list, detail, and edit pages
- feature pages do not instantiate their own sidebar shell
- feature pages do not instantiate `SiteHeader` unless using an intentionally custom top section
- shell responsibilities live in layouts, not pages
- no normal internal route keeps a standalone full shell outside the canonical shell architecture
- no shell infrastructure is mounted conditionally inside pages

## Exceptions Policy

### Default policy
The target steady state is **0 exceptional standalone shells**.

No exception should exist by default.

### When an exception is allowed
A standalone shell is allowed only when the route is intentionally outside the normal authenticated app-chrome model, for example:

- print or export view
- kiosk or fullscreen workflow
- public or unauthenticated page
- third-party embed context

### Approval requirement
A new standalone shell requires explicit approval and must be documented.

### Required documentation for an exception
Any approved exception must include:

- an inline comment in the layout file stating why it is an exception
- a note in this architecture doc or a linked architecture doc stating why the route cannot use the canonical shell
- a brief note describing what would have to change for the exception to be removed later

### Graduation path
When an exception is no longer needed:

1. move the route under `app/(app-shell)/` or `app/(app-shell)/(bid-pages)/`
2. remove the local `SidebarProvider` / `AppSidebar` / `SidebarInset`
3. remove local `SiteHeader` ownership if the route uses the standard header
4. verify sidebar persistence, header positioning, and scroll behavior
5. delete the exceptional layout

## Assumptions

- this doc lives in `docs/shell-architecture-spec.md`
- `app/(app-shell)/layout.tsx` remains the canonical authenticated app shell
- `app/(app-shell)/(bid-pages)/layout.tsx` remains the canonical shared standard-header wrapper during this migration
- route groups are the preferred mechanism for consolidation because they preserve URLs while changing layout ownership
- this is a migration-oriented architecture spec, not just a high-level note
