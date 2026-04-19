---
name: etc-bidx-contracts
description: Use when handling ETC-BIDX contract operations in chat: finding contracts, loading contract details, answering operational contract questions, and proposing safe contract updates while acknowledging that contract creation is not yet wired.
---

# ETC-BIDX Contracts

Use this skill for contract lookup and contract-related questions.

## Use this skill when

- The user needs to find a contract
- The user wants details for a known contract
- The user asks questions about contract status, billing status, dates, owners, customers, or notes
- The user wants to update an existing contract in chat

## Tool surface

- `search_contracts`
- `get_contract`
- `update_contract`

Not yet executable:

- `create_contract`

## Workflow

1. Search first to find the correct contract ID.
2. Load the contract when the user needs a detailed answer or before proposing an update.
3. Optimize for lookup and Q&A first. Updates are supported, but they are secondary to finding and understanding the contract.
4. If the user asks to create a contract, say plainly that contract creation is planned but not wired yet.

## Update rules

- Use `get_contract` before proposing a meaningful update
- Surface the record ID and current context before editing
- If a workflow includes `clientVersion`, preserve version-conflict awareness and explain mismatches clearly
- Wait for explicit confirmation before execution

## Response guidance

- Use operational language, not raw backend wording
- Treat schedules, equipment levels, and general inventory as out of scope for the current contract tools
- Be careful not to imply create support where none exists

## Acceptance checks

- Find a contract by contract number, project name, customer, or owner
- Answer a contract-status or billing-status question from loaded data
- Propose a contract update without executing immediately
- Correctly state that contract creation is unavailable in the current chat tools
