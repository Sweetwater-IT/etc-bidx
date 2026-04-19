import * as bidsActions from "./actions/bids";
import * as contractsActions from "./actions/contracts";
import * as customersActions from "./actions/customers";
import * as quotesActions from "./actions/quotes";
import * as signsActions from "./actions/signs";
import { ActionResult } from "./types";
import { getEntityFromTool, getOperationFromTool, getToolByName, getToolCapability } from "./tools";

interface ActionFn {
  (input: Record<string, unknown>): Promise<ActionResult>;
}

const ACTION_MAP: Record<string, ActionFn> = {
  search_customers: (input) =>
    customersActions.searchCustomers(input as Parameters<typeof customersActions.searchCustomers>[0]),
  get_customer: (input) => customersActions.getCustomer(String(input.id)),
  create_customer: (input) =>
    customersActions.createCustomer(input as Parameters<typeof customersActions.createCustomer>[0]),
  update_customer: (input) =>
    customersActions.updateCustomer(String(input.id), input as Parameters<typeof customersActions.updateCustomer>[1]),

  search_customer_contacts: (input) =>
    customersActions.searchCustomerContacts(input as Parameters<typeof customersActions.searchCustomerContacts>[0]),
  get_customer_contact: (input) => customersActions.getCustomerContact(String(input.id)),
  create_customer_contact: (input) =>
    customersActions.createCustomerContact(input as Parameters<typeof customersActions.createCustomerContact>[0]),
  update_customer_contact: (input) =>
    customersActions.updateCustomerContact(
      String(input.id),
      input as Parameters<typeof customersActions.updateCustomerContact>[1]
    ),

  search_contracts: (input) =>
    contractsActions.searchContracts(input as Parameters<typeof contractsActions.searchContracts>[0]),
  get_contract: (input) => contractsActions.getContract(String(input.id)),
  create_contract: (input) =>
    contractsActions.createContract(input as Parameters<typeof contractsActions.createContract>[0]),
  update_contract: (input) =>
    contractsActions.updateContract(String(input.id), input as Parameters<typeof contractsActions.updateContract>[1]),

  search_quotes: (input) => quotesActions.searchQuotes(input as Parameters<typeof quotesActions.searchQuotes>[0]),
  get_quote: (input) => quotesActions.getQuote(String(input.id)),
  create_quote: (input) => quotesActions.createQuote(input as Parameters<typeof quotesActions.createQuote>[0]),
  update_quote: (input) => quotesActions.updateQuote(String(input.id), input as Parameters<typeof quotesActions.updateQuote>[1]),

  search_sign_orders: (input) =>
    quotesActions.searchSignOrders(input as Parameters<typeof quotesActions.searchSignOrders>[0]),
  get_sign_order: (input) => quotesActions.getSignOrder(String(input.id)),
  create_sign_order: (input) =>
    quotesActions.createSignOrder(input as Parameters<typeof quotesActions.createSignOrder>[0]),
  update_sign_order: (input) =>
    quotesActions.updateSignOrder(String(input.id), input as Parameters<typeof quotesActions.updateSignOrder>[1]),

  search_available_bids: (input) =>
    bidsActions.searchAvailableBids(input as Parameters<typeof bidsActions.searchAvailableBids>[0]),
  get_available_bid: (input) => bidsActions.getAvailableBid(String(input.id)),
  create_available_bid: (input) =>
    bidsActions.createAvailableBid(input as Parameters<typeof bidsActions.createAvailableBid>[0]),
  update_available_bid: (input) =>
    bidsActions.updateAvailableBid(String(input.id), input as Parameters<typeof bidsActions.updateAvailableBid>[1]),

  search_active_bids: (input) =>
    bidsActions.searchActiveBids(input as Parameters<typeof bidsActions.searchActiveBids>[0]),
  get_active_bid: (input) => bidsActions.getActiveBid(String(input.id)),
  create_active_bid: (input) =>
    bidsActions.createActiveBid(input as Parameters<typeof bidsActions.createActiveBid>[0]),
  update_active_bid: (input) =>
    bidsActions.updateActiveBid(String(input.id), input as Parameters<typeof bidsActions.updateActiveBid>[1]),

  search_signs: (input) =>
    signsActions.searchSigns(input as Parameters<typeof signsActions.searchSigns>[0]),
  get_sign: (input) => signsActions.getSign(String(input.id)),
};

function unsupportedToolResult(toolName: string): ActionResult {
  const capabilityStatus = getToolCapability(toolName);
  const entityType = getEntityFromTool(toolName);
  const operation = getOperationFromTool(toolName);

  return {
    success: false,
    entityType,
    operation,
    capabilityStatus,
    summary: `${entityType.replace(/_/g, " ")} is planned but not yet executable in chat`,
    error: "planned_not_executable",
  };
}

export async function executeTool(toolName: string, input: Record<string, unknown>): Promise<ActionResult> {
  const tool = getToolByName(toolName);
  console.info("[chat/executor] dispatch", {
    toolName,
    input,
    toolRegistered: Boolean(tool),
  });
  if (!tool) {
    return {
      success: false,
      entityType: toolName,
      operation: "get",
      capabilityStatus: "planned_not_executable",
      summary: `Unknown tool: ${toolName}`,
      error: `Tool "${toolName}" is not registered`,
    };
  }

  const actionFn = ACTION_MAP[toolName];
  if (!actionFn) {
    return unsupportedToolResult(toolName);
  }

  try {
    const result = await actionFn(input);
    console.info("[chat/executor] result", {
      toolName,
      success: result.success,
      summary: result.summary,
      error: result.error ?? null,
      recordId: result.recordId ?? null,
      targetPath: result.targetPath ?? null,
      data: result.data ?? null,
    });
    return {
      ...result,
      capabilityStatus: result.capabilityStatus ?? tool.capabilityStatus,
    };
  } catch (error) {
    console.error("[chat/executor] failure", {
      toolName,
      input,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      entityType: getEntityFromTool(toolName),
      operation: getOperationFromTool(toolName),
      capabilityStatus: tool.capabilityStatus,
      summary: `Failed to execute ${toolName}`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function hasTool(toolName: string): boolean {
  return Boolean(getToolByName(toolName));
}
