// This file runs before all tests to set up the testing environment
const { createClient } = require('@supabase/supabase-js');

// Note: jest-extended is now imported via jest.config.api.js

// Global variables that will be available in all test files
global.testTimeout = 30000; // 30 seconds timeout for tests

// Custom matchers
expect.extend({
  /**
   * Check if response is a success response
   */
  toBeSuccessResponse(received) {
    const pass = received && 
                received.success === true && 
                received.data !== undefined;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a success response`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a success response with { success: true, data: [...] }`,
        pass: false
      };
    }
  },
  
  /**
   * Check if response is an error response
   */
  toBeErrorResponse(received) {
    const pass = received && 
                received.success === false && 
                (received.error !== undefined || received.message !== undefined);
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be an error response`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be an error response with { success: false, error: '...' }`,
        pass: false
      };
    }
  }
});

// Create a test Supabase client if needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  global.supabase = createClient(supabaseUrl, supabaseKey);
}

// Add custom matchers if needed
expect.extend({
  toBeSuccessResponse(received) {
    const pass = received && 
                 received.success === true && 
                 received.data !== undefined;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a success response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a success response with { success: true, data: [...] }`,
        pass: false,
      };
    }
  },
  
  toBeErrorResponse(received) {
    const pass = received && 
                 received.success === false && 
                 received.error !== undefined;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be an error response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be an error response with { success: false, error: "..." }`,
        pass: false,
      };
    }
  },
});

// Global beforeAll hook
beforeAll(async () => {
  console.log('Starting API tests...');
  // You could set up a test database or other resources here
});

// Global afterAll hook
afterAll(async () => {
  console.log('Finished API tests');
  // Clean up resources here
});
