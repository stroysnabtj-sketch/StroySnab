# Referral Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** invitations and private statistics, without monetary accrual.
**Architecture:** existing Next.js routes and services, transactional PostgreSQL/PGlite registration; additive migration.
**Tech Stack:** Next.js, React, Drizzle, PostgreSQL, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-14-referrals.md; original REF requirements in docs/reference/new-functions-spec-2026-10-30.md.

## Tasks
- [x] Write failing integration tests: stable concurrent code, linkage in both registration paths, invalid/deleted/blocked inviter, uniqueness/self protection, no monetary accrual, private stats and rollback.
- [x] Add schema/migration 0029, referrals/service.ts; wire atomic linkage into password and OTP registration. Run tests.
- [x] Add redirect/cookie, account API and page, copy/share controls, account navigation and RU/TG copy. Test cookie referral and denied roles; browser mobile accessibility and stats. Update affected visual baselines after inspection.
- [ ] Update audit/report and remaining scope. Full tests/build/browser checks, fresh review, backup before additive production migration, push and verify services/CI. No real external SMS/AI requests for tests.

Ruling: user-approved existing invitation-only scope is the design approval. Preserve existing authorized shared repository workflow and unrelated user files. Unexpected database errors roll back registration rather than silently lose a referral; invalid codes never block it.
