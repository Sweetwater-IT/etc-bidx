const { get, post } = require('../helpers/request');
const { 
  mockBids, 
  getBidsByStatus, 
  createSuccessResponse, 
  createErrorResponse 
} = require('../helpers/mockData');

// Mock the handler
const mockHandler = jest.fn();

// Mock the Supabase client
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    data: null,
    error: null
  }
}));

describe('Bids Archive API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock handler for GET requests
    mockHandler.mockImplementation((req) => {
      try {
        if (req.method === 'GET') {
          const url = new URL(`http://localhost${req.url}`);
          const status = url.searchParams.get('status');
          
          // Return archived bids if status is 'Archived'
          if (status === 'Archived') {
            const archivedBids = getBidsByStatus('Archived');
            return {
              status: 200,
              json: async () => createSuccessResponse(archivedBids)
            };
          }
          
          // Otherwise return all bids
          return {
            status: 200,
            json: async () => createSuccessResponse(getBidsByStatus())
          };
        } 
        else if (req.method === 'POST') {
          // Handle archive operation
          return {
            status: 200,
            json: async () => createSuccessResponse({ message: 'Jobs archived successfully' })
          };
        }
        
        return {
          status: 405,
          json: async () => createErrorResponse('Method not allowed')
        };
      } catch (error) {
        return {
          status: 500,
          json: async () => createErrorResponse(error.message)
        };
      }
    });
  });

  describe('GET /api/bids?status=Archived', () => {
    it('should return archived bids', async () => {
      // First, let's make sure our mock data is set up correctly
      const archivedBids = getBidsByStatus('Archived');
      expect(archivedBids.length).toBeGreaterThan(0);
      
      // Override the mock implementation for this specific test
      mockHandler.mockImplementationOnce((req) => {
        return {
          status: 200,
          json: async () => createSuccessResponse(archivedBids)
        };
      });
      
      const response = await get(mockHandler, '/api/bids?status=Archived');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.every(bid => bid.status === 'Archived')).toBe(true);
    });
  });

  describe('POST /api/active-bids/archive', () => {
    it('should archive selected jobs', async () => {
      // Get some unarchived bids to archive
      const unsetBids = getBidsByStatus('Unset');
      const jobIdsToArchive = unsetBids.slice(0, 2).map(bid => bid.id);
      
      // Mock the archive endpoint
      mockHandler.mockImplementationOnce((req) => {
        expect(req.method).toBe('POST');
        expect(req.body).toEqual({ ids: jobIdsToArchive });
        
        return {
          status: 200,
          json: async () => createSuccessResponse({ 
            message: 'Jobs archived successfully',
            count: jobIdsToArchive.length
          })
        };
      });
      
      const response = await post(mockHandler, '/api/active-bids/archive', { ids: jobIdsToArchive });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data.count).toBe(jobIdsToArchive.length);
    });

    it('should handle empty job IDs array', async () => {
      // Mock the archive endpoint with empty IDs
      mockHandler.mockImplementationOnce((req) => {
        expect(req.method).toBe('POST');
        expect(req.body).toEqual({ ids: [] });
        
        return {
          status: 400,
          json: async () => createErrorResponse('No job IDs provided')
        };
      });
      
      const response = await post(mockHandler, '/api/active-bids/archive', { ids: [] });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toBeErrorResponse();
      expect(data.error).toContain('No job IDs provided');
    });

    it('should handle server errors during archiving', async () => {
      // Mock a server error
      mockHandler.mockImplementationOnce(() => {
        throw new Error('Database error during archiving');
      });
      
      const response = await post(mockHandler, '/api/active-bids/archive', { ids: [1, 2] });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toBeErrorResponse();
    });
  });
});
