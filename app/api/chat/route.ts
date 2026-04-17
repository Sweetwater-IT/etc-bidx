import { NextRequest, NextResponse } from "next/server";
import { executeTool, hasTool } from "@/lib/chat/executor";
import { SYSTEM_PROMPT, isCancellation, isConfirmation } from "@/lib/chat/prompt";
import { ActionResult, ChatMessage, ChatResponse, ToolProposal } from "@/lib/chat/types";
import {
  TOOLS,
  getEntityFromTool,
  getOperationFromTool,
  getToolByName,
  requiresConfirmation,
} from "@/lib/chat/tools";

interface ChatState {
  messages: ChatMessage[];
  pendingProposal: ToolProposal | null;
}

interface ParsedIntent {
  toolName: string;
  params: Record<string, unknown>;
}

const chatStateMap = new Map<string, ChatState>();
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_MODEL = process.env.XAI_MODEL || "grok-4.20";

function getChatState(sessionId: string): ChatState {
  if (!chatStateMap.has(sessionId)) {
    chatStateMap.set(sessionId, { messages: [], pendingProposal: null });
  }
  return chatStateMap.get(sessionId)!;
}

function makeMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
    timestamp: new Date(),
  };
}

function hasXaiKey() {
  return Boolean(process.env.XAI_API_KEY);
}

function serializeHistory(messages: ChatMessage[], currentUserMessage?: string) {
  const history = messages.slice(-8).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (currentUserMessage) {
    history.push({ role: "user", content: currentUserMessage });
  }

  return history;
}

async function callGrok(messages: Array<{ role: string; content: string }>, system?: string) {
  if (!process.env.XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || "";
}

function extractId(message: string): string | undefined {
  const match = message.match(/\b(?:id\s*)?(\d+)\b/i);
  return match?.[1];
}

function extractQuotedOrTrailing(message: string, label: string): string | undefined {
  const quoted = message.match(new RegExp(`${label}\\s+(?:to\\s+)?["']([^"']+)["']`, "i"));
  if (quoted?.[1]) return quoted[1].trim();

  const trailing = message.match(new RegExp(`${label}\\s+(?:to\\s+)?([a-z0-9 .,@#&()\\-/]+)`, "i"));
  return trailing?.[1]?.trim();
}

function extractEmail(message: string): string | undefined {
  return message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function extractPhone(message: string): string | undefined {
  return message.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}/)?.[0];
}

function extractDateForLabel(message: string, label: string): string | undefined {
  const match = message.match(new RegExp(`${label}\\s+(?:to\\s+)?(\\d{4}-\\d{2}-\\d{2})`, "i"));
  return match?.[1];
}

function extractBoolean(message: string, label: string): boolean | undefined {
  if (new RegExp(`${label}.*\\b(true|yes|enabled)\\b`, "i").test(message)) return true;
  if (new RegExp(`${label}.*\\b(false|no|disabled)\\b`, "i").test(message)) return false;
  return undefined;
}

function extractSearchPhrase(message: string, entityPattern: RegExp): string | undefined {
  const stripped = message
    .replace(/\b(show|list|find|search|get|view|lookup)\b/gi, "")
    .replace(entityPattern, "")
    .replace(/\bfor\b/gi, "")
    .trim();

  return stripped || undefined;
}

function parseCustomerFields(message: string): Record<string, unknown> {
  const email = extractEmail(message);
  const phone = extractPhone(message);
  const fields: Record<string, unknown> = {};

  const name =
    extractQuotedOrTrailing(message, "display name") ??
    extractQuotedOrTrailing(message, "name") ??
    message.match(/\bcustomer\s+(?:named\s+|for\s+)?([a-z0-9 .,&'-]+)/i)?.[1]?.trim();
  if (name) fields.name = name;

  const displayName = extractQuotedOrTrailing(message, "display name");
  if (displayName) fields.displayName = displayName;

  const customerNumber = extractQuotedOrTrailing(message, "customer number");
  if (customerNumber) fields.customerNumber = customerNumber;

  const address = extractQuotedOrTrailing(message, "address");
  if (address) fields.address = address;

  const city = extractQuotedOrTrailing(message, "city");
  if (city) fields.city = city;

  const state = extractQuotedOrTrailing(message, "state");
  if (state) fields.state = state;

  const zip = extractQuotedOrTrailing(message, "zip");
  if (zip) fields.zip = zip;

  const paymentTerms = extractQuotedOrTrailing(message, "payment terms");
  if (paymentTerms) fields.paymentTerms = paymentTerms;

  const url = extractQuotedOrTrailing(message, "website") ?? extractQuotedOrTrailing(message, "url");
  if (url) fields.url = url;

  if (phone) fields.mainPhone = phone;
  if (email) fields.email = email;

  const creditFlag = extractBoolean(message, "credit");
  if (creditFlag !== undefined) fields.wouldLikeToApplyForCredit = creditFlag;

  return fields;
}

function parseContactFields(message: string): Record<string, unknown> {
  const email = extractEmail(message);
  const phone = extractPhone(message);
  const fields: Record<string, unknown> = {};

  const contractorIdMatch = message.match(/\b(?:contractor|customer)\s+(\d+)\b/i);
  if (contractorIdMatch?.[1]) fields.contractorId = contractorIdMatch[1];

  const name =
    extractQuotedOrTrailing(message, "name") ??
    message.match(/\bcontact\s+(?:named\s+|for\s+)?([a-z0-9 .,&'-]+)/i)?.[1]?.trim();
  if (name) fields.name = name;

  const role = extractQuotedOrTrailing(message, "role") ?? extractQuotedOrTrailing(message, "title");
  if (role) fields.role = role;
  if (email) fields.email = email;
  if (phone) fields.phone = phone;

  return fields;
}

function parseContractFields(message: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  const projectName = extractQuotedOrTrailing(message, "project name") ?? extractQuotedOrTrailing(message, "job name");
  if (projectName) fields.projectName = projectName;

  const contractNumber = extractQuotedOrTrailing(message, "contract number");
  if (contractNumber) fields.contractNumber = contractNumber;

  const customerName = extractQuotedOrTrailing(message, "customer name");
  if (customerName) fields.customerName = customerName;

  const projectOwner = extractQuotedOrTrailing(message, "project owner") ?? extractQuotedOrTrailing(message, "owner");
  if (projectOwner) fields.projectOwner = projectOwner;

  const county = extractQuotedOrTrailing(message, "county");
  if (county) fields.county = county;

  const etcBranch = extractQuotedOrTrailing(message, "branch");
  if (etcBranch) fields.etcBranch = etcBranch;

  const etcProjectManager = extractQuotedOrTrailing(message, "project manager");
  if (etcProjectManager) fields.etcProjectManager = etcProjectManager;

  const start = extractDateForLabel(message, "start date");
  if (start) fields.projectStartDate = start;

  const end = extractDateForLabel(message, "end date");
  if (end) fields.projectEndDate = end;

  const contractStatus = extractQuotedOrTrailing(message, "contract status") ?? extractQuotedOrTrailing(message, "status");
  if (contractStatus) fields.contractStatus = contractStatus;

  const billingStatus = extractQuotedOrTrailing(message, "billing status");
  if (billingStatus) fields.billingStatus = billingStatus;

  const notes = extractQuotedOrTrailing(message, "notes") ?? extractQuotedOrTrailing(message, "note");
  if (notes) fields.additionalNotes = notes;

  return fields;
}

function parseQuoteFields(message: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const email = extractEmail(message);

  const customerIdMatch = message.match(/\bcustomer\s+(\d+)\b/i);
  if (customerIdMatch?.[1]) fields.customerId = customerIdMatch[1];

  const estimateIdMatch = message.match(/\bestimate\s+(\d+)\b/i);
  if (estimateIdMatch?.[1]) fields.estimateId = estimateIdMatch[1];

  const jobIdMatch = message.match(/\bjob\s+(\d+)\b/i);
  if (jobIdMatch?.[1]) fields.jobId = jobIdMatch[1];

  const contactIdMatch = message.match(/\bcontact\s+(\d+)\b/i);
  if (contactIdMatch?.[1]) fields.contactId = contactIdMatch[1];

  const customerName = extractQuotedOrTrailing(message, "customer name") ?? extractQuotedOrTrailing(message, "customer");
  if (customerName) fields.customerName = customerName;

  const customerContact = extractQuotedOrTrailing(message, "contact") ?? extractQuotedOrTrailing(message, "point of contact");
  if (customerContact) fields.customerContact = customerContact;

  if (email) fields.customerEmail = email;

  const county = extractQuotedOrTrailing(message, "county");
  if (county) fields.county = county;

  const typeQuote = extractQuotedOrTrailing(message, "quote type") ?? extractQuotedOrTrailing(message, "type");
  if (typeQuote) fields.typeQuote = typeQuote;

  const subject = extractQuotedOrTrailing(message, "subject");
  if (subject) fields.subject = subject;

  const body = extractQuotedOrTrailing(message, "body") ?? extractQuotedOrTrailing(message, "message");
  if (body) fields.body = body;

  const notes = extractQuotedOrTrailing(message, "notes") ?? extractQuotedOrTrailing(message, "note");
  if (notes) fields.notes = notes;

  const status = extractQuotedOrTrailing(message, "status");
  if (status) fields.status = status;

  const paymentTerms = extractQuotedOrTrailing(message, "payment terms");
  if (paymentTerms) fields.paymentTerms = paymentTerms;

  return fields;
}

function parseSignOrderFields(message: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  const contractorIdMatch = message.match(/\b(?:contractor|customer)\s+(\d+)\b/i);
  if (contractorIdMatch?.[1]) fields.contractorId = contractorIdMatch[1];

  const contactIdMatch = message.match(/\bcontact\s+(\d+)\b/i);
  if (contactIdMatch?.[1]) fields.contactId = contactIdMatch[1];

  const contractNumber = extractQuotedOrTrailing(message, "contract number");
  if (contractNumber) fields.contractNumber = contractNumber;

  const requestor = extractQuotedOrTrailing(message, "requestor");
  if (requestor) fields.requestor = requestor;

  const branch = extractQuotedOrTrailing(message, "branch");
  if (branch) fields.branch = branch;

  const jobNumber = extractQuotedOrTrailing(message, "job number");
  if (jobNumber) fields.jobNumber = jobNumber;

  const status = extractQuotedOrTrailing(message, "status");
  if (status) fields.status = status;

  const orderType = extractQuotedOrTrailing(message, "order type") ?? extractQuotedOrTrailing(message, "type");
  if (orderType) fields.orderType = orderType;

  const orderDate = extractDateForLabel(message, "order date");
  if (orderDate) fields.orderDate = orderDate;

  const needDate = extractDateForLabel(message, "need date");
  if (needDate) fields.needDate = needDate;

  const startDate = extractDateForLabel(message, "start date");
  if (startDate) fields.startDate = startDate;

  const endDate = extractDateForLabel(message, "end date");
  if (endDate) fields.endDate = endDate;

  return fields;
}

function parseAvailableBidFields(message: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  const contractNumber = extractQuotedOrTrailing(message, "contract number");
  if (contractNumber) fields.contractNumber = contractNumber;

  const county = extractQuotedOrTrailing(message, "county");
  if (county) fields.county = county;

  const branch = extractQuotedOrTrailing(message, "branch");
  if (branch) fields.branch = branch;

  const location = extractQuotedOrTrailing(message, "location");
  if (location) fields.location = location;

  const owner = extractQuotedOrTrailing(message, "owner");
  if (owner) fields.owner = owner;

  const platform = extractQuotedOrTrailing(message, "platform");
  if (platform) fields.platform = platform;

  const requestor = extractQuotedOrTrailing(message, "requestor");
  if (requestor) fields.requestor = requestor;

  const stateRoute = extractQuotedOrTrailing(message, "state route");
  if (stateRoute) fields.stateRoute = stateRoute;

  const status = extractQuotedOrTrailing(message, "status");
  if (status) fields.status = status;

  const noBidReason = extractQuotedOrTrailing(message, "no bid reason");
  if (noBidReason) fields.noBidReason = noBidReason;

  const dueDate = extractDateForLabel(message, "due date");
  if (dueDate) fields.dueDate = dueDate;

  const lettingDate = extractDateForLabel(message, "letting date");
  if (lettingDate) fields.lettingDate = lettingDate;

  const entryDate = extractDateForLabel(message, "entry date");
  if (entryDate) fields.entryDate = entryDate;

  const dbeMatch = message.match(/\bdbe(?: percentage)?\s+(?:to\s+)?(\d+(?:\.\d+)?)\b/i);
  if (dbeMatch?.[1]) fields.dbePercentage = Number(dbeMatch[1]);

  return fields;
}

function parseActiveBidFields(message: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  const contractNumber = extractQuotedOrTrailing(message, "contract number");
  if (contractNumber) fields.contractNumber = contractNumber;

  const estimator = extractQuotedOrTrailing(message, "estimator");
  if (estimator) fields.estimator = estimator;

  const owner = extractQuotedOrTrailing(message, "owner");
  if (owner) fields.owner = owner;

  const county = extractQuotedOrTrailing(message, "county");
  if (county) fields.county = county;

  const location = extractQuotedOrTrailing(message, "location");
  if (location) fields.location = location;

  const division = extractQuotedOrTrailing(message, "division");
  if (division) fields.division = division;

  const status = extractQuotedOrTrailing(message, "status");
  if (status) fields.status = status;

  const notes = extractQuotedOrTrailing(message, "notes") ?? extractQuotedOrTrailing(message, "note");
  if (notes) fields.notes = notes;

  return fields;
}

function parseIntent(message: string): ParsedIntent | null {
  const lower = message.toLowerCase();
  const id = extractId(message);

  const entityMatchers: Array<{ pattern: RegExp; base: string }> = [
    { pattern: /\bcustomer contacts?\b|\bcontacts?\b/i, base: "customer_contact" },
    { pattern: /\bcustomers?\b/i, base: "customer" },
    { pattern: /\bcontracts?\b/i, base: "contract" },
    { pattern: /\bavailable bids?\b|\bbid board\b/i, base: "available_bid" },
    { pattern: /\bactive bids?\b/i, base: "active_bid" },
    { pattern: /\bquotes?\b/i, base: "quote" },
    { pattern: /\bsign orders?\b/i, base: "sign_order" },
    { pattern: /\bjobs?\b/i, base: "job" },
  ];

  const entity = entityMatchers.find((candidate) => candidate.pattern.test(message));
  if (!entity) return null;

  const searchVerb = /\b(show|list|find|search|lookup)\b/i.test(message);
  const getVerb = /\b(get|view|open)\b/i.test(message);
  const createVerb = /\b(create|add|new)\b/i.test(message);
  const updateVerb = /\b(update|edit|change|set)\b/i.test(message);

  let params: Record<string, unknown> = {};
  if (entity.base === "customer") params = parseCustomerFields(message);
  if (entity.base === "customer_contact") params = parseContactFields(message);
  if (entity.base === "contract") params = parseContractFields(message);
  if (entity.base === "quote") params = parseQuoteFields(message);
  if (entity.base === "sign_order") params = parseSignOrderFields(message);
  if (entity.base === "available_bid") params = parseAvailableBidFields(message);
  if (entity.base === "active_bid") params = parseActiveBidFields(message);
  if (id) params.id = id;

  if (createVerb) {
    return { toolName: `create_${entity.base}`, params };
  }
  if (updateVerb) {
    return { toolName: `update_${entity.base}`, params };
  }
  if ((getVerb && id) || (!searchVerb && id)) {
    return { toolName: `get_${entity.base}`, params: { id } };
  }
  if (searchVerb || getVerb || lower.includes("all ")) {
    const search = extractSearchPhrase(message, entity.pattern);
    if (search) params.search = params.search ?? search;
    return { toolName: `search_${entity.base}s`, params };
  }

  return null;
}

function parseRefinementForTool(toolName: string, message: string): Record<string, unknown> {
  if (toolName.includes("customer_contact")) return parseContactFields(message);
  if (toolName.includes("customer")) return parseCustomerFields(message);
  if (toolName.includes("contract")) return parseContractFields(message);
  if (toolName.includes("quote")) return parseQuoteFields(message);
  if (toolName.includes("sign_order")) return parseSignOrderFields(message);
  if (toolName.includes("available_bid")) return parseAvailableBidFields(message);
  if (toolName.includes("active_bid")) return parseActiveBidFields(message);
  return {};
}

function proposalFieldLabel(key: string): string {
  return key
    .replace(/clientVersion/g, "Client Version")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function getMissingFields(toolName: string, input: Record<string, unknown>): string[] {
  const tool = getToolByName(toolName);
  if (!tool) return [];

  const required = tool.inputSchema.required ?? [];
  const missing = required.filter((key) => {
    const value = input[key];
    return value === undefined || value === null || value === "";
  });

  if (
    toolName.startsWith("update_") &&
    Object.keys(input).filter((key) => key !== "id" && key !== "clientVersion").length === 0
  ) {
    missing.push("At least one field to update");
  }

  return missing;
}

async function buildProposal(toolName: string, input: Record<string, unknown>): Promise<ToolProposal> {
  const tool = getToolByName(toolName)!;
  const proposalInput = { ...input };

  if (toolName === "update_contract" && proposalInput.id && proposalInput.clientVersion === undefined) {
    const current = await executeTool("get_contract", { id: proposalInput.id });
    const version = current.success ? current.data?.version : undefined;
    if (typeof version === "number") {
      proposalInput.clientVersion = version;
    }
  }

  const fields = Object.entries(proposalInput)
    .filter(([key]) => key !== "clientVersion")
    .map(([key, value]) => ({
      key,
      label: proposalFieldLabel(key),
      value,
    }));

  const missingFields = getMissingFields(toolName, proposalInput);
  const summaryParts = [
    `${getOperationFromTool(toolName).toUpperCase()} ${getEntityFromTool(toolName).replace(/_/g, " ")}`,
    missingFields.length > 0 ? `Missing: ${missingFields.join(", ")}` : "Ready for confirmation",
  ];

  return {
    toolName,
    operation: getOperationFromTool(toolName),
    entityType: getEntityFromTool(toolName),
    input: proposalInput,
    fields,
    missingFields,
    capabilityStatus: tool.capabilityStatus,
    summary: summaryParts.join(" | "),
  };
}

function formatSearchResults(result: ActionResult): string {
  const summary = result.summary;
  const items = Array.isArray((result.data as { items?: unknown[] } | undefined)?.items)
    ? ((result.data as { items: Array<{ id: string; label: string; secondary?: string; status?: string }> }).items)
    : [];

  if (items.length === 0) return `${summary}\n\nNo results found.`;

  return `${summary}\n\n${items
    .map((item) => `• **${item.label}**${item.secondary ? ` - ${item.secondary}` : ""}${item.status ? ` [${item.status}]` : ""} (ID: ${item.id})`)
    .join("\n")}`;
}

function formatProposalText(proposal: ToolProposal): string {
  const lines = [`**Proposed ${proposal.operation}: ${proposal.entityType.replace(/_/g, " ")}**`];

  if (proposal.fields.length > 0) {
    lines.push("", "**Fields:**");
    for (const field of proposal.fields) {
      lines.push(`- ${field.label}: ${field.value === "" || field.value === undefined ? "[empty]" : String(field.value)}`);
    }
  }

  if (proposal.missingFields.length > 0) {
    lines.push("", `Missing before execution: ${proposal.missingFields.join(", ")}`);
    lines.push("Reply with more details to refine this proposal, or say cancel.");
  } else {
    lines.push("", 'Reply "confirm" to execute this change, or say cancel.');
  }

  return lines.join("\n");
}

function formatExecutedResult(result: ActionResult): string {
  if (!result.success) {
    return `❌ ${result.summary}${result.error ? `\n\n${result.error}` : ""}`;
  }
  return `✅ ${result.summary}${result.recordId ? `\n\nRecord ID: ${result.recordId}` : ""}`;
}

function helpText(): string {
  const implemented = TOOLS.filter((tool) => tool.capabilityStatus !== "planned_not_executable");
  return [
    "I can help with the currently wired chat tools:",
    "",
    ...implemented.map((tool) => `- \`${tool.name}\` (${tool.capabilityStatus})`),
    "",
    "Examples:",
    '- "find customers acme"',
    '- "create customer named Acme Supply with phone 555-123-4567"',
    '- "update customer 42 set payment terms to NET30"',
    '- "find contacts for customer 42"',
    '- "show contract 17"',
    '- "update contract 17 set contract status to APPROVED"',
    '- "find quotes for york county"',
    '- "create sign order for contractor 42 with contract number 2026-18"',
    '- "show available bids in dauphin county"',
    '- "update active bid 15 set status to won"',
  ].join("\n");
}

async function grokFallbackReply(state: ChatState, message: string) {
  const capabilitySummary = TOOLS.map((tool) => `${tool.name}: ${tool.capabilityStatus}`).join("\n");
  return callGrok(serializeHistory(state.messages, message), [
    SYSTEM_PROMPT,
    "",
    "You are powering a sidebar assistant inside ETC-BIDX.",
    "Important constraints:",
    "- Customers, customer contacts, contracts, quotes, sign orders, and bids are wired to real backend flows.",
    "- Jobs are still planned and must be described as not yet wired in chat.",
    "- Never claim a mutation has happened unless the server tool executed it.",
    "- Keep answers concise and practical.",
    "",
    "Current tool capability matrix:",
    capabilitySummary,
  ].join("\n"));
}

async function grokProposalReply(state: ChatState, proposal: ToolProposal, latestUserMessage: string) {
  return callGrok(serializeHistory(state.messages, latestUserMessage), [
    SYSTEM_PROMPT,
    "",
    "You are helping the user refine a pending write proposal.",
    `Pending tool: ${proposal.toolName}`,
    `Entity: ${proposal.entityType}`,
    `Operation: ${proposal.operation}`,
    `Missing fields: ${proposal.missingFields.join(", ") || "none"}`,
    "Respond with a short assistant message that either:",
    "- asks only for the still-missing required details, or",
    "- tells the user the proposal is ready and they can confirm.",
    "Do not claim the action is executed.",
  ].join("\n"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body.sessionId === "string" && body.sessionId.trim() ? body.sessionId : "default";

    console.info("[api/chat] request received", {
      sessionId,
      hasMessage: Boolean(message),
      messagePreview: message.slice(0, 120),
    });

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const state = getChatState(sessionId);
    const lower = message.toLowerCase();
    let responseMessage: ChatMessage;
    let pendingProposal = state.pendingProposal;
    let executedResult;

    if (pendingProposal && isCancellation(message)) {
      pendingProposal = null;
      responseMessage = makeMessage("Cancelled the pending change.");
    } else if (pendingProposal && isConfirmation(message)) {
      if (pendingProposal.missingFields.length > 0) {
        responseMessage = makeMessage(
          `I still need these details before I can execute: ${pendingProposal.missingFields.join(", ")}.`
        );
      } else {
        const result = await executeTool(pendingProposal.toolName, pendingProposal.input);
        executedResult = result;
        pendingProposal = null;
        responseMessage = makeMessage(formatExecutedResult(result));
      }
    } else if (pendingProposal) {
      const refinement = parseIntent(message);
      const refinedFields =
        refinement && refinement.toolName === pendingProposal.toolName
          ? refinement.params
          : parseRefinementForTool(pendingProposal.toolName, message);

      if (Object.keys(refinedFields).length === 0) {
        if (hasXaiKey()) {
          const grokReply = await grokProposalReply(state, pendingProposal, message);
          responseMessage = makeMessage(
            grokReply ||
              `You still have a pending ${pendingProposal.operation} for ${pendingProposal.entityType.replace(/_/g, " ")}. Reply with more details, "confirm", or "cancel".`
          );
        } else {
          responseMessage = makeMessage(
            `You still have a pending ${pendingProposal.operation} for ${pendingProposal.entityType.replace(/_/g, " ")}. Reply with more details, "confirm", or "cancel".`
          );
        }
      } else {
        pendingProposal = await buildProposal(pendingProposal.toolName, {
          ...pendingProposal.input,
          ...refinedFields,
        });
        if (hasXaiKey()) {
          const grokReply = await grokProposalReply(state, pendingProposal, message);
          responseMessage = makeMessage(
            `${grokReply || "I updated the proposal."}\n\n${formatProposalText(pendingProposal)}`
          );
        } else {
          responseMessage = makeMessage(formatProposalText(pendingProposal));
        }
      }
    } else if (lower === "help" || lower === "what can you do") {
      if (hasXaiKey()) {
        const grokReply = await grokFallbackReply(state, message);
        responseMessage = makeMessage(grokReply || helpText());
      } else {
        responseMessage = makeMessage(helpText());
      }
    } else {
      const intent = parseIntent(message);

      if (!intent || !hasTool(intent.toolName)) {
        if (hasXaiKey()) {
          const grokReply = await grokFallbackReply(state, message);
          responseMessage = makeMessage(
            grokReply || 'I can handle customers, contacts, contracts, quotes, sign orders, and bids right now. Try "help" for examples.'
          );
        } else {
          responseMessage = makeMessage(
            'I can handle customers, contacts, contracts, quotes, sign orders, and bids right now. Try "help" for examples.'
          );
        }
      } else if (requiresConfirmation(intent.toolName)) {
        pendingProposal = await buildProposal(intent.toolName, intent.params);
        if (hasXaiKey()) {
          const grokReply = await grokProposalReply(state, pendingProposal, message);
          responseMessage = makeMessage(
            `${grokReply || "I prepared a proposal for you."}\n\n${formatProposalText(pendingProposal)}`
          );
        } else {
          responseMessage = makeMessage(formatProposalText(pendingProposal));
        }
      } else {
        const result = await executeTool(intent.toolName, intent.params);
        executedResult = result;

        // Always use deterministic formatting for search operations to prevent hallucinations
        if (result.operation === "search") {
          responseMessage = makeMessage(formatSearchResults(result));
        } else {
          // For non-search operations, Grok can help with formatting
          const deterministicText = formatExecutedResult(result);
          if (hasXaiKey()) {
            const grokReply = await callGrok(
              [{ role: "user", content: message }],
              [
                SYSTEM_PROMPT,
                "",
                "You are summarizing a tool result for the user.",
                "Do not invent facts beyond the provided result.",
                `Tool: ${intent.toolName}`,
                `Result summary: ${result.summary}`,
                `Success: ${String(result.success)}`,
                `Structured result:\n${JSON.stringify(result.data ?? {}, null, 2)}`,
              ].join("\n")
            );
            responseMessage = makeMessage(grokReply || deterministicText);
          } else {
            responseMessage = makeMessage(deterministicText);
          }
        }
      }
    }

    state.pendingProposal = pendingProposal;
    state.messages.push(responseMessage);
    if (state.messages.length > 50) {
      state.messages = state.messages.slice(-50);
    }

    const payload: ChatResponse = {
      message: responseMessage,
      pendingProposal,
      executedResult,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    tools: TOOLS,
  });
}
