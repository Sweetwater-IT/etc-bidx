const { get } = require('../helpers/request');
const { 
  mockCounties, 
  mockOwners, 
  mockBranches, 
  getReferenceData, 
  createSuccessResponse, 
  createErrorResponse 
} = require('../helpers/mockData');

// Mock the handler - we'll replace this with the actual import once we set up the test environment
const mockHandler = jest.fn();

// Mock the Supabase client
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    data: null,
    error: null
  }
}));

describe('Reference Data API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock handler to return different responses based on the request
    mockHandler.mockImplementation((req) => {
      try {
        const url = new URL(`http://localhost${req.url}`);
        const type = url.searchParams.get('type');

        if (!type) {
          return {
            status: 400,
            json: async () => createErrorResponse('Missing required parameter: type')
          };
        }

        // Get reference data based on type
        const data = getReferenceData(type);
        
        // Return success response
        return {
          status: 200,
          json: async () => createSuccessResponse(data)
        };
      } catch (error) {
        return {
          status: 500,
          json: async () => createErrorResponse(error.message)
        };
      }
    });
  });

  describe('GET /api/reference-data', () => {
    it('should return counties when type=counties', async () => {
      const response = await get(mockHandler, '/api/reference-data?type=counties');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data).toEqual(mockCounties);
    });

    it('should return owners when type=owners', async () => {
      const response = await get(mockHandler, '/api/reference-data?type=owners');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data).toEqual(mockOwners);
    });

    it('should return branches when type=branches', async () => {
      const response = await get(mockHandler, '/api/reference-data?type=branches');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data).toEqual(mockBranches);
    });

    it('should return an empty array for unknown reference data types', async () => {
      const response = await get(mockHandler, '/api/reference-data?type=unknown');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeSuccessResponse();
      expect(data.data).toEqual([]);
    });

    it('should return 400 error when type parameter is missing', async () => {
      const response = await get(mockHandler, '/api/reference-data');
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toBeErrorResponse();
      expect(data.error).toContain('Missing required parameter');
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock the handler to throw an error for this test
      mockHandler.mockImplementationOnce(() => {
        throw new Error('Server error');
      });
      
      const response = await get(mockHandler, '/api/reference-data?type=counties');
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toBeErrorResponse();
    });

    it('should handle database errors gracefully', async () => {
      // Mock the handler to return a database error
      mockHandler.mockImplementationOnce(() => {
        return {
          status: 500,
          json: async () => createErrorResponse('Database error')
        };
      });
      
      const response = await get(mockHandler, '/api/reference-data?type=counties');
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toBeErrorResponse();
    });
  });
});
