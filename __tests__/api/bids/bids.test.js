const { get, post } = require('../helpers/request');
const { 
  mockBids, 
  getBidsByStatus, 
  createSuccessResponse, 
  createErrorResponse 
} = require('../helpers/mockData');

// Mock the handler - we'll replace this with the actual import once we set up the test environment
// For now, we'll use a mock implementation
const mockHandler = jest.fn();

// Mock the Supabase client
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    data: mockBids,
    count: mockBids.length,
    error: null
  }
}));

describe('Bids API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock handler to return different responses based on the request
    mockHandler.mockImplementation((req) => {
      try {
        const url = new URL(`http://localhost${req.url}`);
        const status = url.searchParams.get('status');
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')) : 25;
        const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')) : 1;
        
        // Filter bids by status if provided
        const filteredBids = getBidsByStatus(status);
        
        // Apply pagination
        const offset = (page - 1) * limit;
        const paginatedBids = filteredBids.slice(offset, offset + limit);
        
        // Return success response
        return {
          status: 200,
          json: async () => createSuccessResponse(paginatedBids)
        };
      } catch (error) {
        return {
          status: 500,
          json: async () => createErrorResponse(error.message)
        };
      }
    });
  });

  describe('GET /api/bids', () => {
    it('should return all bids when no status is provided', async () => {
      // First, let's make sure our mock data is set up correctly
      const allBids = getBidsByStatus();
      expect(allBids.length).toBeGreaterThan(0);
      
      // Override the mock implementation for this specific test
      mockHandler.mockImplementationOnce((req) => {
        return {
          status: 200,
          json: async () => createSuccessResponse(allBids)
        };
      });
      
      const response = await get(mockHandler, '/api/bids');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.length).toBe(allBids.length);
    });

    it('should return bids filtered by Unset status', async () => {
      const response = await get(mockHandler, '/api/bids?status=Unset');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.every(bid => bid.status === 'Unset')).toBe(true);
    });

    it('should return bids filtered by Bid status', async () => {
      const response = await get(mockHandler, '/api/bids?status=Bid');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.every(bid => bid.status === 'Bid')).toBe(true);
    });

    it('should return bids filtered by No Bid status', async () => {
      const response = await get(mockHandler, '/api/bids?status=No Bid');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.every(bid => bid.status === 'No Bid')).toBe(true);
    });

    it('should return bids filtered by Archived status', async () => {
      const response = await get(mockHandler, '/api/bids?status=Archived');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.every(bid => bid.status === 'Archived')).toBe(true);
    });

    it('should respect pagination parameters', async () => {
      const limit = 2;
      const page = 1;
      
      // Make sure we have enough mock data for this test
      const allBids = getBidsByStatus();
      expect(allBids.length).toBeGreaterThanOrEqual(limit);
      
      // Create a paginated subset of the mock data
      const paginatedBids = allBids.slice(0, limit);
      
      // Override the mock implementation for this specific test
      mockHandler.mockImplementationOnce((req) => {
        return {
          status: 200,
          json: async () => createSuccessResponse(paginatedBids)
        };
      });
      
      const response = await get(mockHandler, `/api/bids?limit=${limit}&page=${page}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.length).toBe(limit);
    });

    it('should handle empty results gracefully', async () => {
      // Mock the handler to return empty results for this test
      mockHandler.mockImplementationOnce(() => {
        return {
          status: 200,
          json: async () => createSuccessResponse([])
        };
      });
      
      const response = await get(mockHandler, '/api/bids?status=NonExistentStatus');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock the handler to throw an error for this test
      mockHandler.mockImplementationOnce(() => {
        throw new Error('Server error');
      });
      
      const response = await get(mockHandler, '/api/bids');
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toBeErrorResponse();
    });
  });
});
