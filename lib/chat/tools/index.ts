import { ToolCapabilityStatus, ToolOperation } from "../types";

type ToolSchemaType = "string" | "number" | "boolean";

export interface ToolDefinition {
  name: string;
  description: string;
  capabilityStatus: ToolCapabilityStatus;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: ToolSchemaType; description?: string }>;
    required?: string[];
  };
}

function defineTool(definition: ToolDefinition): ToolDefinition {
  return definition;
}

export const TOOLS: ToolDefinition[] = [
  defineTool({
    name: "search_available_bids",
    description: "Search available bid board records from available_jobs.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search contract number, owner, location, or county" },
        status: { type: "string", description: "Bid board status such as Bid, No Bid, or Unset" },
        county: { type: "string", description: "County name" },
      },
    },
  }),
  defineTool({
    name: "get_available_bid",
    description: "Get one available bid board record by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "available_jobs id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_available_bid",
    description: "Create a bid board record in available_jobs.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        contractNumber: { type: "string", description: "Contract number" },
        county: { type: "string", description: "County name" },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
        lettingDate: { type: "string", description: "Letting date in YYYY-MM-DD format" },
        entryDate: { type: "string", description: "Entry date in YYYY-MM-DD format" },
        location: { type: "string", description: "Township or location" },
        owner: { type: "string", description: "Owner name" },
        branch: { type: "string", description: "Branch such as Hatfield or Turbotville" },
        platform: { type: "string", description: "Source platform" },
        requestor: { type: "string", description: "Requestor name" },
        dbePercentage: { type: "number", description: "DBE percentage" },
        stateRoute: { type: "string", description: "State route" },
        status: { type: "string", description: "Bid board status" },
      },
      required: ["contractNumber", "county", "dueDate", "lettingDate", "location", "owner", "branch", "platform", "requestor"],
    },
  }),
  defineTool({
    name: "update_available_bid",
    description: "Update a bid board record in available_jobs.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "available_jobs id" },
        status: { type: "string", description: "Bid board status" },
        owner: { type: "string", description: "Owner name" },
        location: { type: "string", description: "Location label" },
        lettingDate: { type: "string", description: "Letting date" },
        dueDate: { type: "string", description: "Due date" },
        contractNumber: { type: "string", description: "Contract number" },
        county: { type: "string", description: "County name" },
        branch: { type: "string", description: "Branch name" },
        platform: { type: "string", description: "Source platform" },
        requestor: { type: "string", description: "Requestor name" },
        dbePercentage: { type: "number", description: "DBE percentage" },
        stateRoute: { type: "string", description: "State route" },
        noBidReason: { type: "string", description: "No-bid reason" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "search_active_bids",
    description: "Search active bid estimates from bid_estimates/admin_data_entries.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search contract number, owner, or location" },
        status: { type: "string", description: "Bid estimate status" },
      },
    },
  }),
  defineTool({
    name: "get_active_bid",
    description: "Get one active bid estimate by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "bid_estimates id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_active_bid",
    description: "Create a bid estimate and admin data entry.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        contractNumber: { type: "string", description: "Contract number" },
        estimator: { type: "string", description: "Estimator name" },
        owner: { type: "string", description: "Owner name" },
        county: { type: "string", description: "County name" },
        location: { type: "string", description: "Location label" },
        division: { type: "string", description: "Division such as PUBLIC or PRIVATE" },
        status: { type: "string", description: "Bid status" },
      },
      required: ["contractNumber", "county"],
    },
  }),
  defineTool({
    name: "update_active_bid",
    description: "Update a bid estimate and related admin data.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "bid_estimates id" },
        status: { type: "string", description: "Bid estimate status" },
        notes: { type: "string", description: "Bid notes" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "search_jobs",
    description: "Search job records.",
    capabilityStatus: "planned_not_executable",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search job number, contract number, contractor, or county" },
        status: { type: "string", description: "Project status" },
        branch: { type: "string", description: "Branch alias" },
      },
    },
  }),
  defineTool({
    name: "get_job",
    description: "Get one job record by id.",
    capabilityStatus: "planned_not_executable",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "jobs id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_job",
    description: "Create a job and its admin_data_entries record.",
    capabilityStatus: "planned_not_executable",
    inputSchema: {
      type: "object",
      properties: {
        customer: { type: "string", description: "Customer label" },
        contractNumber: { type: "string", description: "Contract number" },
        estimator: { type: "string", description: "Estimator name" },
        owner: { type: "string", description: "Owner name" },
        county: { type: "string", description: "County name" },
        township: { type: "string", description: "Township or location" },
        division: { type: "string", description: "Division such as PUBLIC or PRIVATE" },
      },
    },
  }),
  defineTool({
    name: "update_job",
    description: "Update a job record.",
    capabilityStatus: "planned_not_executable",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "jobs id" },
        projectStatus: { type: "string", description: "Project status" },
        billingStatus: { type: "string", description: "Billing status" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "search_contracts",
    description: "Search contract manager records from jobs_l.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search contract number, project name, customer, or owner" },
        status: { type: "string", description: "Contract status" },
      },
    },
  }),
  defineTool({
    name: "get_contract",
    description: "Get one contract manager record by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "jobs_l id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_contract",
    description: "Create a contract manager record in jobs_l.",
    capabilityStatus: "planned_not_executable",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "Project name" },
        contractNumber: { type: "string", description: "Project owner contract number" },
        customerName: { type: "string", description: "Customer name" },
        projectOwner: { type: "string", description: "Project owner" },
      },
    },
  }),
  defineTool({
    name: "update_contract",
    description: "Update a contract manager record in jobs_l.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "jobs_l id" },
        projectName: { type: "string", description: "Project name" },
        contractNumber: { type: "string", description: "Project owner contract number" },
        customerName: { type: "string", description: "Customer name" },
        projectOwner: { type: "string", description: "Project owner" },
        county: { type: "string", description: "County" },
        etcBranch: { type: "string", description: "ETC branch" },
        etcProjectManager: { type: "string", description: "ETC project manager" },
        projectStartDate: { type: "string", description: "Project start date" },
        projectEndDate: { type: "string", description: "Project end date" },
        contractStatus: { type: "string", description: "Contract status" },
        billingStatus: { type: "string", description: "Billing status" },
        additionalNotes: { type: "string", description: "Contract notes" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "search_customers",
    description: "Search customer contractor records.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search customer name, display name, number, or phone" },
      },
    },
  }),
  defineTool({
    name: "get_customer",
    description: "Get one customer contractor record by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "contractors id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_customer",
    description: "Create a customer contractor record.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Legal/customer name" },
        displayName: { type: "string", description: "Display name" },
        customerNumber: { type: "string", description: "Customer number" },
        mainPhone: { type: "string", description: "Main phone number" },
        url: { type: "string", description: "Website" },
        address: { type: "string", description: "Street address" },
        city: { type: "string", description: "City" },
        state: { type: "string", description: "State" },
        zip: { type: "string", description: "ZIP" },
        paymentTerms: { type: "string", description: "Payment terms" },
        wouldLikeToApplyForCredit: { type: "boolean", description: "Credit application flag" },
      },
      required: ["name"],
    },
  }),
  defineTool({
    name: "update_customer",
    description: "Update a customer contractor record.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "contractors id" },
        name: { type: "string", description: "Legal/customer name" },
        displayName: { type: "string", description: "Display name" },
        customerNumber: { type: "string", description: "Customer number" },
        mainPhone: { type: "string", description: "Main phone number" },
        url: { type: "string", description: "Website" },
        address: { type: "string", description: "Street address" },
        city: { type: "string", description: "City" },
        state: { type: "string", description: "State" },
        zip: { type: "string", description: "ZIP" },
        paymentTerms: { type: "string", description: "Payment terms" },
        wouldLikeToApplyForCredit: { type: "boolean", description: "Credit application flag" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "search_customer_contacts",
    description: "Search customer contacts.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search contact name, role, email, or phone" },
        contractorId: { type: "string", description: "Filter by contractors id" },
      },
    },
  }),
  defineTool({
    name: "get_customer_contact",
    description: "Get one customer contact by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "customer_contacts id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_customer_contact",
    description: "Create a customer contact.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        contractorId: { type: "string", description: "contractors id" },
        name: { type: "string", description: "Contact name" },
        role: { type: "string", description: "Contact role" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
      },
      required: ["contractorId", "name"],
    },
  }),
  defineTool({
    name: "update_customer_contact",
    description: "Update a customer contact.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "customer_contacts id" },
        name: { type: "string", description: "Contact name" },
        role: { type: "string", description: "Contact role" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "search_sign_orders",
    description: "Search sign order records.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search order number, contract number, or requestor" },
        status: { type: "string", description: "Order status" },
      },
    },
  }),
  defineTool({
    name: "get_sign_order",
    description: "Get one sign order by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "sign_orders id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_sign_order",
    description: "Create a sign order.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        contractorId: { type: "string", description: "Contractor id" },
        contractNumber: { type: "string", description: "Contract number" },
        requestor: { type: "string", description: "Requestor name" },
        branch: { type: "string", description: "Branch name" },
        jobNumber: { type: "string", description: "Job number" },
        orderDate: { type: "string", description: "Order date" },
        needDate: { type: "string", description: "Need date" },
        startDate: { type: "string", description: "Start date" },
        endDate: { type: "string", description: "End date" },
        status: { type: "string", description: "Order status" },
        orderType: { type: "string", description: "Order type list such as sale,rental" },
        contactId: { type: "string", description: "Customer contact id" },
      },
    },
  }),
  defineTool({
    name: "update_sign_order",
    description: "Update a sign order.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "sign_orders id" },
        status: { type: "string", description: "Order status" },
        contractorId: { type: "string", description: "Contractor id" },
        contractNumber: { type: "string", description: "Contract number" },
        requestor: { type: "string", description: "Requestor name" },
        branch: { type: "string", description: "Branch name" },
        jobNumber: { type: "string", description: "Job number" },
        needDate: { type: "string", description: "Need date" },
        orderType: { type: "string", description: "Order type list such as sale,rental" },
        contactId: { type: "string", description: "Customer contact id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "search_quotes",
    description: "Search quote records.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search quote number, customer, county, or creator" },
        status: { type: "string", description: "Quote status" },
      },
    },
  }),
  defineTool({
    name: "search_signs",
    description: "Search the MUTCD sign catalog from signs_all.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search sign designation, description, or category" },
        category: { type: "string", description: "Filter by sign category" },
      },
    },
  }),
  defineTool({
    name: "get_sign",
    description: "Get one sign from the MUTCD catalog by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "signs_all id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "get_quote",
    description: "Get one quote by id.",
    capabilityStatus: "read_only",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "quotes id" },
      },
      required: ["id"],
    },
  }),
  defineTool({
    name: "create_quote",
    description: "Create a quote draft.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "Contractor id" },
        customerName: { type: "string", description: "Customer name" },
        customerContact: { type: "string", description: "Customer contact" },
        customerEmail: { type: "string", description: "Customer email" },
        county: { type: "string", description: "County" },
        estimateId: { type: "string", description: "Estimate id" },
        jobId: { type: "string", description: "Job id" },
        typeQuote: { type: "string", description: "Quote type" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body" },
        notes: { type: "string", description: "Internal quote notes" },
        paymentTerms: { type: "string", description: "Payment terms" },
      },
    },
  }),
  defineTool({
    name: "update_quote",
    description: "Update an existing quote draft.",
    capabilityStatus: "write_requires_confirmation",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "quotes id" },
        customerId: { type: "string", description: "Contractor id" },
        customerName: { type: "string", description: "Customer name" },
        customerContact: { type: "string", description: "Customer contact" },
        customerEmail: { type: "string", description: "Customer email" },
        county: { type: "string", description: "County" },
        status: { type: "string", description: "Quote status" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body" },
        notes: { type: "string", description: "Internal quote notes" },
        paymentTerms: { type: "string", description: "Payment terms" },
      },
      required: ["id"],
    },
  }),
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.name === name);
}

export function getToolCapability(toolName: string): ToolCapabilityStatus {
  return getToolByName(toolName)?.capabilityStatus ?? "planned_not_executable";
}

export function requiresConfirmation(toolName: string): boolean {
  return getToolCapability(toolName) === "write_requires_confirmation";
}

export function getOperationFromTool(toolName: string): ToolOperation {
  if (toolName.startsWith("search_")) return "search";
  if (toolName.startsWith("get_")) return "get";
  if (toolName.startsWith("create_")) return "create";
  if (toolName.startsWith("update_")) return "update";
  return "get";
}

export function getEntityFromTool(toolName: string): string {
  const parts = toolName.split("_");
  return parts.length > 1 ? parts.slice(1).join("_") : toolName;
}
