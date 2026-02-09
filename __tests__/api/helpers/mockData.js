/**
 * Mock data for API tests
 */

// Mock bids data
const mockBids = [
  {
    id: 1,
    jobNumber: "TEST001",
    contractNumber: "C901234",
    county: "Adams",
    status: "Unset",
    owner: "PENNDOT",
    requestor: "Garret Brunton"
  },
  {
    id: 2,
    jobNumber: "DATE TEST",
    contractNumber: "C567890",
    county: "Adams",
    status: "Unset",
    owner: "PENNDOT",
    requestor: "Fran Kelby"
  },
  {
    id: 3,
    jobNumber: "525TEST-1",
    contractNumber: "C123456",
    county: "Washington",
    status: "Bid",
    owner: "TURNPIKE",
    requestor: "IT"
  },
  {
    id: 4,
    jobNumber: "524-TEST",
    contractNumber: "C345678",
    county: "Franklin",
    status: "No Bid",
    owner: "TURNPIKE",
    requestor: "IT"
  },
  {
    id: 5,
    jobNumber: "ARCHIVED-001",
    contractNumber: "C111222",
    county: "Adams",
    status: "Archived",
    owner: "PENNDOT",
    requestor: "Garret Brunton"
  }
];

// Mock reference data
const mockCounties = [
  { id: 1, name: "Adams" },
  { id: 2, name: "Bradford" },
  { id: 3, name: "Franklin" },
  { id: 4, name: "Washington" },
  { id: 5, name: "Bucks" }
];

const mockOwners = [
  { id: 1, name: "PENNDOT" },
  { id: 2, name: "TURNPIKE" },
  { id: 3, name: "PRIVATE" },
  { id: 4, name: "SEPTA" },
  { id: 5, name: "OTHER" }
];

const mockBranches = [
  { id: 1, name: "Bridge" },
  { id: 2, name: "Highway" },
  { id: 3, name: "Maintenance" },
  { id: 4, name: "Construction" },
  { id: 5, name: "Design" }
];

// Helper functions to get filtered data
function getBidsByStatus(status) {
  if (status === undefined) {
    return mockBids;
  }
  return mockBids.filter(bid => bid.status === status);
}

function getReferenceData(type) {
  switch (type) {
    case 'counties':
      return mockCounties;
    case 'owners':
      return mockOwners;
    case 'branches':
      return mockBranches;
    default:
      return [];
  }
}

// Mock response builders
function createSuccessResponse(data) {
  return {
    success: true,
    data
  };
}

function createErrorResponse(message, statusCode = 400) {
  return {
    success: false,
    error: message,
    statusCode
  };
}

module.exports = {
  mockBids,
  mockCounties,
  mockOwners,
  mockBranches,
  getBidsByStatus,
  getReferenceData,
  createSuccessResponse,
  createErrorResponse
};
