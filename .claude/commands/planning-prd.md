---
allowed-tools: AskUserQuestion, Read, Write, Glob, Grep
description: Create a PLANNING.md from PRD.md with phases, tasks, and subtasks following Baby Step philosophy
---

## Instructions

You are a senior software architect creating a detailed implementation plan from a PRD (Product Requirements Document).

### Step 1: Read the PRD

First, read the PRD.md file at the project root:

```
Read PRD.md
```

### Step 2: Understand the Existing Codebase

Before planning, explore the existing codebase to understand:
- Current project structure
- Existing components, services, and utilities that can be reused
- Authentication setup (read `docs/AUTH.md` if auth is involved)
- Database schema (read `docs/DATABASE.md` if database changes are involved)
- Testing patterns (read `docs/TESTING.md`)
- I18N setup (read `docs/I18N.md` if UI text is involved)

### Step 3: Ask Clarifying Questions

Use `AskUserQuestion` to clarify any ambiguities. Ask about:

- **Priorities:** Which features are MVP vs nice-to-have?
- **Technical decisions:** Any preferences on specific libraries or approaches?
- **Scope clarification:** Any features that should be deferred?
- **Integration points:** External services, APIs, or dependencies not clear in the PRD
- **Timeline constraints:** Any hard deadlines affecting prioritization?
- **Existing code:** Should we reuse/refactor existing code or start fresh?

Continue asking questions until you have complete clarity on the implementation approach.

### Step 4: Create PLANNING.md

Write a `PLANNING.md` file at the project root with the following structure:

```markdown
# PLANNING.md - [Project Name]

## Overview
Brief summary of the project and this planning document.

---

## Phases

### Phase 1: [Phase Name]
**Goal:** [What this phase accomplishes]
**Prerequisite:** [Previous phase or "None"]

#### Tasks

##### Task 1.1: [Task Name]
**Objective:** [Clear description of what this task accomplishes]
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 1.1.1 - [Subtask description]
- [ ] 1.1.2 - [Subtask description]
- [ ] 1.1.3 - [Subtask description]

**Files to modify/create:**
- `path/to/file.ts` - [Brief description of changes]

**Definition of Done:**
- [ ] All subtasks completed
- [ ] `npm run test:e2e` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

---

##### Task 1.2: [Next Task]
...

---

### Phase 2: [Next Phase]
...

---

## Implementation Order

Sequential list of all tasks in recommended order:

1. Task 1.1 - [Name]
2. Task 1.2 - [Name]
3. Task 2.1 - [Name]
...

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk description] | [High/Medium/Low] | [How to mitigate] |

---

## Open Questions

- [ ] [Any remaining questions to resolve during implementation]

---

## Progress Tracker

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | 1.1 | ⬜ Not Started | |
| 1 | 1.2 | ⬜ Not Started | |
...

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked
```

### Planning Rules (MUST FOLLOW)

1. **Baby Step Philosophy:**
   - Each task MUST be small enough to complete with all checks passing
   - After EVERY task: tests green, lint clean, types valid
   - No task should break the build, even temporarily
   - If a task is too large, break it into smaller subtasks

2. **Logical Dependencies:**
   - Order tasks so each builds on previous work
   - Database schema before services using it
   - Services before UI consuming them
   - Core functionality before edge cases

3. **Architecture Compliance:**
   - Follow the project's architecture rules from CLAUDE.md
   - Pages are puzzles (minimal UI in routes)
   - Loaders/actions are thin (call services, return data)
   - Business logic in services, not components
   - UI orchestration in hooks, not inline

4. **Testing Strategy:**
   - Plan E2E tests alongside features
   - Each phase should include test tasks
   - Regression tests for each user-facing feature

5. **I18N Awareness:**
   - Plan i18n keys for all user-facing text
   - Group i18n tasks logically with their UI tasks

6. **Incremental Delivery:**
   - Prefer working features over partial implementations
   - Each phase should deliver usable functionality
   - MVP features before premium features

### Phase Structure Guidelines

Typical phase structure for a SaaS project:

1. **Phase 0: Foundation** - Database schema, core models, base configuration
2. **Phase 1: Core Feature** - The main value proposition of the app
3. **Phase 2: Authentication** - User accounts, sessions (if not already in template)
4. **Phase 3: Premium/Payments** - Monetization features
5. **Phase 4: Polish** - Error handling, edge cases, accessibility
6. **Phase 5: Launch Prep** - SEO, analytics, monitoring

Adjust phases based on the specific PRD requirements.

**Start by reading the PRD.md file now.**
