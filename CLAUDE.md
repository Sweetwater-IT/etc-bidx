# ETC-BIDX Development Guide

## Overview

ETC-BIDX is a comprehensive business management application built for ETC (a construction/traffic control company). It handles bidding, job management, customer relations, contract management, and reporting for traffic control services including flagging, signage, and equipment rental.

## Tech Stack

- **Frontend**: Next.js 15.3.0 (App Router), React 18.2, TypeScript
- **UI Framework**: Tailwind CSS v4, Radix UI components, shadcn/ui
- **State Management**: Zustand, React Context API, SWR for data fetching
- **Database**: Supabase (PostgreSQL)
- **Testing**: Jest, React Testing Library, Cypress
- **Email**: SendGrid
- **PDF Generation**: React PDF, pdf-lib
- **Forms**: React Hook Form with Zod validation
- **Tables**: TanStack Table
- **Charts**: Recharts

## Common Development Commands

### Development
```bash
# Start development server with Turbopack
npm run dev

# Start development server (alternative package managers)
yarn dev
pnpm dev
bun dev
```

### Building & Production
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Code Quality
```bash
# Run ESLint
npm run lint
```

### Testing

#### Unit & Component Tests
```bash
# Run all Jest tests
npm test

# Run component tests only
npm run test:components

# Run component tests in watch mode
npm run test:components:watch

# Run API tests only
npm run test:api

# Run API tests in watch mode
npm run test:api:watch

# Run all tests (components + API)
npm run test:all
```

#### End-to-End Tests
```bash
# Open Cypress interactive test runner
npm run cypress

# Run Cypress tests headlessly
npm run cypress:run

# Run specific Cypress test suites
npm run cypress:available-jobs
npm run cypress:integration
```

## High-Level Architecture

### Directory Structure

```
etc-bidx/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   ├── [page-routes]/     # Frontend pages
│   └── layout.tsx         # Root layout with providers
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── pages/            # Page-specific components
│   └── sheets/           # Sheet/modal components
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── types/                # TypeScript type definitions
├── __tests__/            # Test files
├── cypress/              # E2E tests
└── supabase/             # Database migrations
```

### Key Architectural Patterns

#### 1. **API Architecture**
- RESTful API endpoints in `/app/api/`
- Each resource has its own directory with route handlers
- Consistent response format with success/error handling
- Supabase client for database operations

#### 2. **Component Architecture**
- Atomic design with UI primitives in `/components/ui/`
- Compound components for complex features
- Sheet/Modal pattern for forms and details views
- Data tables with filtering, sorting, and pagination

#### 3. **State Management**
- **Zustand**: Global state for user preferences, loading states
- **React Context**: Feature-specific state (estimates, customers)
- **SWR**: Server state management with caching and revalidation
- **React Hook Form**: Form state with validation

#### 4. **Data Flow**
```
User Action → Component → API Route → Supabase → Response → SWR Cache → UI Update
```

#### 5. **Authentication & Security**
- Cookie-based authentication via middleware
- Protected routes redirect to password entry
- API routes validate authentication

### Core Features & Their Implementation

#### 1. **Bidding System** (`/app/active-bid/`)
- Multi-step form wizard for creating bids
- Handles equipment rental, flagging, signs, and service work
- Complex pricing calculations with labor and material costs
- PDF generation for bid worksheets

#### 2. **Job Management** (`/app/jobs/`)
- Track active jobs from bid to completion
- Phase-based job tracking
- Document management and file uploads
- Integration with contract management

#### 3. **Customer Management** (`/app/customers/`)
- Customer profiles with contact information
- Relationship tracking between customers and jobs
- Customer-specific pricing and terms

#### 4. **Contract Management** (`/app/contracts/`)
- Document upload and storage
- Prevailing wage tracking
- Employment verification
- Email notifications

#### 5. **Sign Orders** (`/app/takeoffs/`)
- Create and manage sign orders
- Sign shop order management
- Equipment and material tracking
- Export to Excel functionality

#### 6. **Quotes System** (`/app/quotes/`)
- Generate professional quotes
- Email delivery with PDF attachments
- Template-based proposal generation
- Digital signature support

#### 7. **Reporting & Analytics** (`/app/` dashboard)
- Real-time metrics and KPIs
- Revenue and profit analysis
- Win/loss tracking
- Interactive charts and visualizations

### Database Schema

The application uses Supabase with the following key tables:
- `bids` - Available job opportunities
- `jobs` - Active jobs (won bids)
- `customers` & `customer_contacts` - Customer data
- `branches` & `counties` - Geographic organization
- `users` - User accounts and permissions
- `sign_orders` & `sign_shop_orders` - Sign management
- `quotes` - Quote generation and tracking
- `files` - Document storage metadata

Views are used to aggregate complex data:
- `estimates_view` - Combined bid estimate data
- `jobs_complete_view` - Full job details with relationships
- `complete_quotes_view` - Quote data with line items

### Design Decisions

1. **Next.js App Router**: Leverages React Server Components for better performance and SEO
2. **Supabase**: Provides real-time capabilities, built-in auth, and PostgreSQL power
3. **Component Library**: shadcn/ui for consistent, accessible, and customizable components
4. **TypeScript**: Full type safety across the application
5. **SWR**: Optimistic updates and intelligent caching for better UX
6. **Modular Architecture**: Features are self-contained for maintainability

### Development Workflow

1. **Feature Development**:
   - Create feature branch from main
   - Implement components in isolation
   - Add tests (component + API)
   - Test with Cypress for critical paths

2. **API Development**:
   - Create route handler in `/app/api/`
   - Use consistent error handling
   - Add TypeScript types
   - Write API tests

3. **Database Changes**:
   - Create migration in `/supabase/migrations/`
   - Update TypeScript types
   - Test locally before deploying

4. **Testing Strategy**:
   - Unit tests for utilities
   - Component tests for UI logic
   - API tests for endpoints
   - E2E tests for critical user flows

### Performance Considerations

- Turbopack for faster development builds
- Dynamic imports for code splitting
- Image optimization with Next.js Image
- Data fetching with SWR caching
- Debounced search inputs
- Virtual scrolling for large lists

### Security Measures

- Authentication middleware
- API route protection
- Input validation with Zod
- SQL injection prevention via Supabase
- XSS protection via React
- CSRF protection built into Next.js