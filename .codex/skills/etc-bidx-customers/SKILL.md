---
name: etc-bidx-customers
description: Use when handling ETC-BIDX customer operations in chat: finding customers, finding customer contacts, answering customer questions from loaded records, and proposing customer or contact creates or updates with confirmation.
---

# ETC-BIDX Customers

Use this skill for customer account and contact workflows.

## Use this skill when

- The user needs a customer record
- The user needs customer contacts
- The user wants to add or update a customer
- The user wants to add or update a customer contact
- The user asks operational questions about a customer and the answer should come from current record data

## Tool surface

Customer tools:

- `search_customers`
- `get_customer`
- `create_customer`
- `update_customer`

Customer contact tools:

- `search_customer_contacts`
- `get_customer_contact`
- `create_customer_contact`
- `update_customer_contact`

## Workflow

1. Search first to identify the correct customer or contact.
2. Use `get_customer` when the user needs account details or when contact context matters.
3. Answer customer questions from retrieved customer data first, then use contacts as supporting detail.
4. Keep customer and contact work together in one flow when the task spans both.
5. For creates or updates, propose the exact write first and wait for confirmation.

## Write rules

- Never create or update on the first pass
- For contact creation, confirm the target customer record first
- Show the fields that will be written in clear business language
- Only execute after explicit confirmation

## Response guidance

- Prefer customer display name when available
- Keep contact answers grounded in retrieved records rather than assumptions
- If the user asks about broader inventory, schedules, or equipment levels, state that those are future capabilities outside the current customer tools

## Acceptance checks

- Find a customer by name, number, or phone
- Find contacts for a known customer
- Propose a new customer create
- Propose a new customer contact create tied to the right contractor ID
- Answer a customer question using loaded record data
