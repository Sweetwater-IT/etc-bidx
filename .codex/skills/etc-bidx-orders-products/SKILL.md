---
name: etc-bidx-orders-products
description: Use when handling ETC-BIDX quotes, sign orders, and sign product-reference work in chat: finding quotes, finding sign orders, proposing quote or sign-order writes with confirmation, and answering sign catalog questions from the signs_all table.
---

# ETC-BIDX Orders And Products

Use this skill for quotes, sign orders, and current sign-related product lookup.

## Use this skill when

- The user needs a quote
- The user needs a sign order
- The user wants to create or update a quote
- The user wants to create or update a sign order
- The user asks product-list or sign-reference questions that should be answered from `signs_all`

## Tool surface

Quote tools:

- `search_quotes`
- `get_quote`
- `create_quote`
- `update_quote`

Sign order tools:

- `search_sign_orders`
- `get_sign_order`
- `create_sign_order`
- `update_sign_order`

Sign catalog tools:

- `search_signs`
- `get_sign`

## Workflow

1. Search first to find the right quote, sign order, or sign.
2. Use `get_quote`, `get_sign_order`, or `get_sign` when the user needs full detail.
3. Treat `signs_all` as the current product-reference surface for sign-related questions.
4. Use quote and sign-order tools for transactional work, not `signs_all`.
5. For writes, present a structured proposal and wait for confirmation before execution.

## Product-reference guidance

- Answer sign or product-list questions from `signs_all`
- Be explicit that broader inventory, schedules, and equipment-level views are not yet available in the chat tools
- Do not imply stock counts or live inventory levels unless the retrieved data actually contains them

## Write rules

- Search or load the target record first before updates
- Show the intended fields in plain business terms
- Execute only after explicit confirmation

## Acceptance checks

- Find a quote
- Find a sign order
- Answer a sign or product question using `search_signs` or `get_sign`
- Propose a quote or sign-order write without executing it
- Clearly state that general inventory and equipment levels are future capabilities
