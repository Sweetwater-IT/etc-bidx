# Testing Guide for ETC-BIDX

This document provides an overview of the testing structure for the ETC-BIDX project and instructions for adding new tests.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Test Structure](#test-structure)
- [Component Tests](#component-tests)
- [API Tests](#api-tests)
- [Running Tests](#running-tests)
- [Adding New Tests](#adding-new-tests)

## Testing Overview

The ETC-BIDX project uses a comprehensive testing approach with three main types of tests:

1. **Component Tests**: Unit tests for React components using Jest and React Testing Library
2. **API Tests**: Tests for backend API endpoints using Jest

## Test Structure

```
etc-bidx/
├── __tests__/                  # Main test directory
│   ├── components/             # Component tests
│   │   └── *.test.tsx          # Component test files
│   ├── api/                    # API tests
│   │   ├── bids/               # Tests for bids endpoints
│   │   ├── reference-data/     # Tests for reference data endpoints
│   │   ├── helpers/            # Helper utilities for API tests
│   │   └── utils/              # Utility files for API tests
│   └── mocks/                  # Mock data and components
│       ├── components/         # Mock components
│       └── data/               # Mock data
├── jest.config.js              # Jest configuration for component tests
└── jest.config.api.js          # Jest configuration for API tests
```

## Component Tests

Component tests use Jest and React Testing Library to test React components in isolation.

### Key Files and Directories

- `__tests__/components/`: Contains component test files
- `__tests__/mocks/components/`: Contains mock components for testing
- `__tests__/mocks/data/`: Contains mock data for component tests
- `jest.config.js`: Configuration for component tests

### Example Component Test

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyComponent } from '../../components/MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## API Tests

API tests use Jest to test backend API endpoints.

### Key Files and Directories

- `__tests__/api/`: Contains API test files
- `__tests__/api/helpers/`: Contains helper utilities for API tests
- `__tests__/api/utils/`: Contains utility files for API tests
- `jest.config.api.js`: Configuration for API tests

### Example API Test

```javascript
const { get } = require('../helpers/request');
const { mockData, createSuccessResponse } = require('../helpers/mockData');

// Mock handler for API endpoint
const mockHandler = jest.fn();

describe('API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandler.mockImplementation((req) => {
      return {
        status: 200,
        json: async () => createSuccessResponse(mockData)
      };
    });
  });

  it('should return expected data', async () => {
    const response = await get(mockHandler, '/api/endpoint');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toBeSuccessResponse();
    expect(data.data).toEqual(mockData);
  });
});
```

## Running Tests

The following npm scripts are available for running tests:

- `npm test`: Run all Jest tests
- `npm run test:components`: Run component tests only
- `npm run test:api`: Run API tests only
- `npm run test:all`: Run both component and API tests

## Adding New Tests

### Adding a New Component Test

1. Create a new test file in `__tests__/components/` with the naming convention `ComponentName.test.tsx`
2. Import the component and testing utilities
3. Write test cases using Jest and React Testing Library
4. Run the test using `npm run test:components`

Example:

```javascript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../../components/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Adding a New API Test

1. Create a new test file in the appropriate directory under `__tests__/api/` with the naming convention `endpoint-name.test.js`
2. Import the necessary helpers and mock data
3. Set up mock handlers for the API endpoint
4. Write test cases using Jest
5. Run the test using `npm run test:api`

Example:

```javascript
// __tests__/api/jobs/jobs.test.js
const { get } = require('../helpers/request');
const { mockJobs, createSuccessResponse } = require('../helpers/mockData');

const mockHandler = jest.fn();

describe('Jobs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandler.mockImplementation((req) => {
      try {
        const url = new URL(`http://localhost${req.url}`);
        return {
          status: 200,
          json: async () => createSuccessResponse(mockJobs)
        };
      } catch (error) {
        return {
          status: 500,
          json: async () => ({ success: false, error: error.message })
        };
      }
    });
  });

  it('should return all jobs', async () => {
    const response = await get(mockHandler, '/api/jobs');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toBeSuccessResponse();
    expect(data.data).toEqual(mockJobs);
  });
});
```

## Best Practices

### Component Tests
- Test component rendering, props, state changes, and user interactions
- Use data-testid attributes for reliable element selection
- Mock external dependencies and API calls
- Test both success and error states

### API Tests
- Test all API endpoints with various parameters
- Test both success and error responses
- Use mock data to simulate database responses
- Test edge cases and validation
