# Hajime B2B Operations App — Product Requirements

This folder contains the full **Product Requirements Document (PRD)** for the Hajime B2B platform.

| Document | Contents |
|----------|----------|
| [PRD-part-1-overview.md](./PRD-part-1-overview.md) | §§1–7 — Overview, goals, users, stories, workflows |
| [PRD-part-2-functional.md](./PRD-part-2-functional.md) | §§8–16 — Functional requirements, real-time, data model, business rules, UX, technical, integrations, security, MVP scope |
| [PRD-part-3-wireframes-technical.md](./PRD-part-3-wireframes-technical.md) | §§17–23 — Phase 2 roadmap, success metrics, open questions, acceptance, handoff, wireframes, routes, DB/API outline, realtime events, sprint order |

**Product name:** Hajime B2B Operations App  

**One-line goal:** A single source of truth for Hajime’s B2B business — inventory, sales, accounts, manufacturer coordination, shipments, and reporting in one live system.

**Current codebase note:** The app today uses a consolidated `GET/PUT /api/app` JSON snapshot plus Stripe routes. The PRD describes a target **API-first** shape (REST resources, auth, audit, CSV, notifications). Use the PRD to prioritize features and evolve the backend toward those endpoints.
