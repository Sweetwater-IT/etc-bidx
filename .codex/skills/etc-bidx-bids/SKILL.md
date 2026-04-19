---
name: etc-bidx-bids
description: Use when handling ETC-BIDX bid work in chat: finding available bid board entries, finding active bids, reviewing bid details, proposing bid creates or updates with confirmation, and clearly explaining that job lookup is not yet executable from the chat tools.
---

# ETC-BIDX Bids

Use this skill for day-to-day bid operations across both bid tables.

## Use this skill when

- The user wants to find an available bid board entry
- The user wants to find an active bid
- The user wants details for a specific bid
- The user wants to create or update a bid through chat
- The user asks for "the job" from bid context and you need to explain that jobs are not yet executable in chat

## Tool surface

Available bid tools:

- `search_available_bids`
- `get_available_bid`
- `create_available_bid`
- `update_available_bid`

Active bid tools:

- `search_active_bids`
- `get_active_bid`
- `create_active_bid`
- `update_active_bid`

## Workflow

1. Search first. Never guess IDs or assume which bid record the user means.
2. Keep the tables distinct:
   - Available bids are bid board entries awaiting action
   - Active bids are let or won bids tracked separately
3. For record questions, search first and then use `get_*` when the user needs full detail.
4. For writes, propose the exact action first and wait for explicit confirmation before execution.
5. If the user asks for a job from bid context, say clearly that chat job tools are still planned and not executable yet. Do not invent a job result.

## Write rules

- Always search or load the record before proposing an update
- Show entity, operation, record ID when relevant, and field-level changes
- Execute only after an explicit confirmation such as `confirm`, `yes`, `proceed`, or `do it`

## Response guidance

- Be clear about whether you are working with an available bid or an active bid
- Prefer compact result lists when searching
- Convert backend errors into plain operational language
- If a user requests schedules, inventory, or equipment levels, say those are not supported in the current chat toolset

## Acceptance checks

- Find an available bid by search terms
- Find an active bid by contract number or owner
- Propose a create or update without executing immediately
- Refuse to fake a job lookup and state that job tools are planned but not executable
