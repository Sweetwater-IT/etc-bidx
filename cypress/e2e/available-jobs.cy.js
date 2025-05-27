/**
 * Tests for the Available Jobs page
 * Verifies that the table loads and displays job data with correct filtering
 *
 * Tests implemented:
 * - Basic page loading and table visibility
 * - Table column headers verification
 * - Data values verification
 * - Filter tabs existence
 * - Unset filter functionality
 * - Bid filter functionality
 * - No Bid filter functionality
 * - All filter functionality
 */
describe("Available Jobs Page", () => {
  beforeEach(() => {
    // Set up intercepts for all API requests
    // Default jobs (Unset status)
    cy.intercept("GET", "**/api/bids?status=Unset&limit=1000", {
      fixture: "unset-jobs.json",
    }).as("getUnsetJobs");

    // Bid status jobs
    cy.intercept("GET", "**/api/bids?status=Bid&limit=1000", {
      fixture: "bid-jobs.json",
    }).as("getBidJobs");

    // No Bid status jobs
    cy.intercept("GET", "**/api/bids?status=No+Bid&limit=1000", {
      fixture: "no-bid-jobs.json",
    }).as("getNoBidJobs");

    // All jobs (no status filter)
    cy.intercept("GET", "**/api/bids?limit=1000", {
      fixture: "available-jobs.json",
    }).as("getAllJobs");


    // Reference data
    cy.intercept("GET", "**/api/reference-data?type=counties", {
      fixture: "counties.json",
    }).as("getCounties");

    cy.intercept("GET", "**/api/reference-data?type=owners", {
      fixture: "owners.json",
    }).as("getOwners");

    cy.intercept("GET", "**/api/reference-data?type=branches", {
      fixture: "branches.json",
    }).as("getBranches");

    // Visit the available jobs page
    cy.visit("/jobs/available");
  });

  it("should display the available jobs page with data", () => {
    cy.wait("@getUnsetJobs");

    cy.contains("Available Jobs").should("be.visible");

    cy.get("table").should("be.visible");

    cy.contains("Contract Number").should("be.visible");
    cy.contains("Status").should("be.visible");
    cy.contains("Owner").should("be.visible");
    cy.contains("County").should("be.visible");

    cy.contains("PENNDOT").should("be.visible");

    cy.get("tbody tr").should("have.length.gt", 1);

    cy.contains("All").should("be.visible");
    cy.contains("Unset").should("be.visible");
    cy.contains("No Bid").should("be.visible");
    cy.contains("Bid").should("be.visible");
  });

  it("should show Unset jobs when Unset filter is active", () => {
    cy.wait("@getUnsetJobs");

    cy.get("table").should("be.visible");

    cy.contains("Unset").should("be.visible");

    cy.get("tbody tr").should("have.length.gt", 0);
  });

  it("should show Bid jobs when Bid filter is clicked", () => {
    cy.wait("@getUnsetJobs");

    cy.intercept("GET", "**/api/bids**", {
      fixture: "bid-jobs.json",
    }).as("getBidJobsFlexible");

    cy.contains("Bid").click();

    cy.wait(1000);

    cy.get("table").should("be.visible");

    cy.get("tbody tr").should("have.length.gt", 0);
  });

  it("should show No Bid jobs when No Bid filter is clicked", () => {
    cy.wait("@getUnsetJobs");

    cy.intercept("GET", "**/api/bids?status=No+Bid*", {
      fixture: "no-bid-jobs.json",
    }).as("getNoBidJobs");

    cy.contains("No Bid").click();

    cy.wait("@getNoBidJobs", { timeout: 10000 });

    cy.contains("524-TEST").should("be.visible");

    cy.contains("td", "No Bid").should("be.visible");

    cy.contains("TEST001").should("not.exist");
    cy.contains("525TEST-1").should("not.exist");
  });

  it("should show All jobs when All filter is clicked", () => {
    cy.wait("@getUnsetJobs");

    cy.intercept("GET", "**/api/bids?limit=1000", {
      fixture: "available-jobs.json",
    }).as("getAllJobs");

    cy.contains("All").click();

    cy.wait("@getAllJobs", { timeout: 10000 });

    cy.get("table").should("be.visible");
    cy.get("tbody tr").should("have.length.gt", 1);
  });

});
