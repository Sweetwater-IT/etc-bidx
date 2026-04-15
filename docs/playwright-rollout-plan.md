# Playwright Rollout Plan

This document captures how we should introduce Playwright into ETC-BIDX now that Cypress has been removed.

## Goal

Set up Playwright once, then add coverage incrementally as pages are spec'd and stabilized.

The right sequence is:

1. Finish the Playwright harness setup
2. Add a small baseline of passing smoke tests
3. Add page-level coverage as each app area is actively being spec'd

## Setup First

Before writing broad end-to-end coverage, the repo should have a real Playwright harness in place.

Required setup tasks:

- Install `@playwright/test`
- Update `package-lock.json`
- Keep `playwright.config.ts`
- Keep the `playwright/` folder structure
- Add at least one passing smoke test
- Add CI execution later once local runs are stable

Current scaffold already added locally:

- [playwright.config.ts](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/playwright.config.ts)
- [playwright/tests/auth-smoke.spec.ts](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/playwright/tests/auth-smoke.spec.ts)
- updated [package.json](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/package.json) scripts
- updated [TESTING.md](/Users/kenny/Documents/GitHub/Sweetwater-IT/etc-bidx/TESTING.md)

Note:

- the dependency install was blocked by local disk-space limits (`ENOSPC`)
- do not treat the harness as complete until the package is installed and lockfile is updated

## Priority Features

These are the app areas where Playwright will provide the most value first.

### 1. Auth / App Entry

Cover:

- unauthenticated redirect to `/password-entry`
- password entry page renders
- protected routes do not dead-end

Why first:

- every user flow depends on this
- easy smoke coverage

### 2. Global App Shell

Cover:

- sidebar persistence
- fullscreen page behavior
- top header behavior
- global search modal open/close
- global search routing

Why:

- this shell is shared everywhere
- regressions here impact the whole app

### 3. Quote Flow

Cover:

- `/quotes/create` loads
- add item opens the SOV picker
- edit item sheet reopens with saved values
- close/X works
- PDF generation/download path works

Why:

- quote flow is high-value and already has complex state
- recent regressions happened here

### 4. Active Bid Flow

Cover:

- `/active-bid/new`
- `/active-bid/edit`
- fullscreen behavior
- tucked sidebar behavior
- exit returns user correctly

Why:

- fullscreen and shell behavior are easy to regress

### 5. Sign Order Flow

Cover:

- add sign modal opens
- search/select in the picker
- repeated open/close behavior
- export PDF works

Why:

- heavily used workflow
- modal/picker behavior has had repeated cleanup work

### 6. `l/takeoffs`

Cover:

- create/edit/view page loads
- PDF download
- pickup and return inventory actions
- work-order generation entry points

Why:

- major operational workflow
- closely tied to spec work still in progress

### 7. `l/work-orders`

Cover:

- new/edit/view page loads
- billing packet / PDF download
- combined packet filename behavior
- related takeoff download behavior

Why:

- core post-takeoff operational flow

### 8. Customers / Contacts

Cover:

- add customer modal opens with backdrop
- add contact from customer page works
- no provider crash

Why:

- known regression area
- lightweight but important confidence coverage

## Rollout Strategy

Do not wait until the entire app is done before writing tests.

Best practice for this repo:

- finish the Playwright harness once
- as each page is spec'd, add 1 to 3 Playwright tests for that page
- keep coverage focused on real business-critical interactions

This avoids:

- a giant end-of-project testing backlog
- outdated tests written against old UI assumptions
- wasted time covering unstable screens too early

## Recommended Order

### Phase 1: Harness

- install Playwright
- confirm scripts run
- confirm one smoke test passes

### Phase 2: Core Smoke

- auth entry
- global shell
- fullscreen route behavior

### Phase 3: Core Revenue / Workflow Pages

- quotes
- active bids
- sign orders

### Phase 4: Operations Pages

- `l/takeoffs`
- `l/work-orders`
- return inventory

### Phase 5: Secondary Flows

- customers / contacts
- supporting dashboards or utility flows

## What To Test Per Page

For each page being spec'd, prefer 1 to 3 high-value tests:

- page loads successfully
- primary user action works
- regression-prone exit / modal / save behavior works

Avoid starting with broad exhaustive coverage.

Focus first on:

- routing
- modal/sheet behavior
- save/edit persistence
- PDF/export triggers
- critical table filtering or selection flows

## Initial Test Targets

When work resumes, these are the best next Playwright tasks:

1. Finish package install and lockfile update
2. Run the auth smoke spec successfully
3. Add global shell tests
4. Add quote create/edit smoke coverage
5. Add `l/takeoffs` smoke coverage while that spec work is active
6. Add `l/work-orders` smoke coverage next

## Working Rule

As the app is spec'd page by page:

- each major page should leave the spec phase with Playwright coverage for its most important interactions

That is the cleanest way to keep quality aligned with the product spec instead of treating testing as a separate cleanup project later.
