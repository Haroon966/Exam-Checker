---
name: grill-me
description: >
  Interview the user relentlessly about a plan or design until reaching shared
  understanding, resolving each branch of the decision tree. Use when user wants
  to stress-test a plan, get grilled on their design, or mentions "grill me".
disable-model-invocation: true
---

# Grill me

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

Ask the questions **one at a time**, waiting for feedback before continuing.

For each question, provide your **recommended answer**.

If a question can be answered by exploring the codebase, explore the codebase instead of asking.

When the decision tree is resolved, briefly summarize the shared understanding. Do not write repo files (use `/grill-with-docs` for that).
