export type ChatRole = "user" | "assistant" | "system";

export type ToolOperation = "create" | "update" | "get" | "search";

export type ToolCapabilityStatus =
  | "implemented"
  | "read_only"
  | "write_requires_confirmation"
  | "planned_not_executable";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface ToolProposalField {
  key: string;
  label: string;
  value: unknown;
}

export interface ToolProposal {
  toolName: string;
  operation: ToolOperation;
  entityType: string;
  input: Record<string, unknown>;
  summary: string;
  fields: ToolProposalField[];
  missingFields: string[];
  capabilityStatus: ToolCapabilityStatus;
}

export interface ToolExecutionResult {
  success: boolean;
  entityType: string;
  operation: ToolOperation;
  capabilityStatus: ToolCapabilityStatus;
  recordId?: string;
  summary: string;
  targetPath?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  pendingProposal: ToolProposal | null;
  executedResult?: ToolExecutionResult;
}

export interface ActionResult {
  success: boolean;
  entityType: string;
  operation: ToolOperation;
  capabilityStatus?: ToolCapabilityStatus;
  recordId?: string;
  summary: string;
  targetPath?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface RecordSummary {
  id: string;
  label: string;
  secondary?: string;
  status?: string;
  targetPath?: string;
}
