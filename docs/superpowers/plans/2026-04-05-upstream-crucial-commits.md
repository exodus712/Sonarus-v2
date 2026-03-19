# Upstream Crucial Commits Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the requested upstream Handy commits into Sonarus with the lowest practical conflict risk while preserving Sonarus-specific history, post-processing, overlay, sound, and settings behavior.

**Architecture:** Apply the requested upstream commits in upstream order inside an isolated worktree, but prefer manual porting over blind cherry-picks when a commit overlaps heavily with Sonarus-owned files. Treat history/transcription/model/runtime changes as the high-risk core, then layer lower-risk tray, translation, UI, and installer updates after the backend is stable.

**Tech Stack:** Git worktrees, Tauri 2, Rust, Bun, React, TypeScript, Specta bindings

---

## Chunk 1: Baseline And Dependency Mapping

### Task 1: Verify clean integration workspace

**Files:**

- Modify: `docs/superpowers/plans/2026-04-05-upstream-crucial-commits.md`

- [ ] **Step 1: Verify the isolated worktree is clean**

Run: `git status --short --branch`
Expected: branch `codex/upstream-crucial-commits` with no file changes

- [ ] **Step 2: Install project dependencies**

Run: `bun install`
Expected: dependency install completes without lockfile drift

- [ ] **Step 3: Run baseline frontend verification**

Run: `bun run lint`
Expected: current worktree lints clean, or existing failures are captured before integration

- [ ] **Step 4: Run baseline Rust verification**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: current worktree builds/tests clean, or existing failures are captured before integration

### Task 2: Freeze the upstream integration order

**Files:**

- Modify: `docs/superpowers/plans/2026-04-05-upstream-crucial-commits.md`

- [ ] **Step 1: Use upstream main order for requested SHAs**

Ordered set:
`a301502`
`e35f0a7`
`58cda3f`
`17277cf`
`714ce0c`
`c6576ac`
`a6eec9e`
`2b7231e`
`32687d1`
`18ce41a`
`2cb0e78`
`075fb5f`
`320dfb2`
`be2c584`
`5bf7646`
`7ed8a55`
`d1d3393`
`552ebe5`
`892658e`
`4609db7`
`743d8a5`
`b123c1e`

- [ ] **Step 2: Classify high-conflict commits**

High-conflict/manual-port candidates:
`a301502`
`e35f0a7`
`58cda3f`
`17277cf`
`a6eec9e`
`7ed8a55`
`d1d3393`
`4609db7`

- [ ] **Step 3: Classify low-risk commits**

Likely direct cherry-pick or trivial manual apply:
`714ce0c`
`c6576ac`
`32687d1`
`18ce41a`
`2cb0e78`
`075fb5f`
`320dfb2`
`be2c584`
`5bf7646`
`552ebe5`
`892658e`
`743d8a5`
`b123c1e`

## Chunk 2: Backend And Runtime Integration

### Task 3: Integrate transcription/runtime dependency updates first

**Files:**

- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock`
- Modify: `src-tauri/src/managers/transcription.rs`
- Modify: `src-tauri/src/managers/audio.rs`
- Modify: `src-tauri/src/managers/model.rs`
- Modify: `src-tauri/src/actions.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/settings.rs`
- Modify: `src-tauri/src/shortcut/mod.rs`
- Test: `src-tauri/src/managers/history.rs`

- [ ] **Step 1: Cherry-pick or port `a301502`**
- [ ] **Step 2: Run focused Rust verification for transcription/model code**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: build/test result is understood before continuing

- [ ] **Step 3: Cherry-pick or port `7ed8a55`**
- [ ] **Step 4: Cherry-pick or port `d1d3393`**
- [ ] **Step 5: Cherry-pick or port `b123c1e`**
- [ ] **Step 6: Re-run Rust verification**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: no new unresolved runtime/compiler failures

### Task 4: Integrate model download and provider changes

**Files:**

- Modify: `src-tauri/src/managers/model.rs`
- Modify: `src-tauri/src/commands/models.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock`
- Modify: `src/bindings.ts`
- Modify: `src/components/model-selector/ModelSelector.tsx`
- Modify: `src/components/model-selector/ModelStatusButton.tsx`
- Modify: `src/components/onboarding/ModelCard.tsx`
- Modify: `src/components/onboarding/Onboarding.tsx`
- Modify: `src/components/settings/models/ModelsSettings.tsx`
- Modify: `src/stores/modelStore.ts`

- [ ] **Step 1: Cherry-pick or port `58cda3f`**
- [ ] **Step 2: Cherry-pick or port `4609db7`**
- [ ] **Step 3: Run lint for touched frontend/model files**

Run: `bun run lint`
Expected: UI/state/bindings changes are syntactically valid

## Chunk 3: History Integration

### Task 5: Merge upstream history changes without losing Sonarus history extensions

**Files:**

- Modify: `src-tauri/src/managers/history.rs`
- Modify: `src-tauri/src/commands/history.rs`
- Modify: `src-tauri/src/actions.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/bindings.ts`
- Modify: `src/components/settings/history/HistorySettings.tsx`

- [ ] **Step 1: Write or extend focused regression tests around Sonarus history schema**

Targets:

- pagination keeps `post_process_requested`
- retry updates preserve `post_process_requested`
- latest completed entry ignores empty transcription rows

- [ ] **Step 2: Run the focused history tests and confirm failure if new behavior is absent**

Run: `cargo test --manifest-path src-tauri/Cargo.toml history`
Expected: either new tests fail for the expected reason or existing tests establish current behavior

- [ ] **Step 3: Port `17277cf` into Sonarus history/transcription flow**
- [ ] **Step 4: Port `e35f0a7` into Sonarus history pagination/UI flow**
- [ ] **Step 5: Regenerate or reconcile `src/bindings.ts` only after Rust commands/types settle**
- [ ] **Step 6: Re-run focused history tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml history`
Expected: history tests pass

## Chunk 4: Low-Risk Follow-Ups

### Task 6: Apply small runtime, UI, translation, and packaging commits

**Files:**

- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/tray.rs`
- Modify: `src-tauri/nsis/installer.nsi`
- Modify: `src/i18n/languages.ts`
- Modify: `src/i18n/locales/*/translation.json`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/settings/GlobalShortcutInput.tsx`
- Modify: `src/components/settings/HandyKeysShortcutInput.tsx`
- Modify: `src/components/settings/debug/DebugSettings.tsx`
- Modify: `src/components/settings/general/GeneralSettings.tsx`
- Modify: `src-tauri/src/actions.rs`

- [ ] **Step 1: Apply `714ce0c`, `18ce41a`, `743d8a5`**
- [ ] **Step 2: Apply `32687d1`**
- [ ] **Step 3: Apply `c6576ac`**
- [ ] **Step 4: Apply `320dfb2`**
- [ ] **Step 5: Apply `2cb0e78` and `075fb5f`**
- [ ] **Step 6: Apply `552ebe5` and `892658e` if still relevant to Sonarus packaging**
- [ ] **Step 7: Fold in bindings-only commits `be2c584` and `5bf7646` only if their generated output still matches the final command surface**

## Chunk 5: Final Verification

### Task 7: Prove the integrated branch is healthy

**Files:**

- Modify: any files touched above

- [ ] **Step 1: Run full Rust verification**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: all Rust tests/build steps pass

- [ ] **Step 2: Run frontend verification**

Run: `bun run lint`
Expected: linter completes without errors

- [ ] **Step 3: If bindings changed, regenerate and verify no unexpected drift**

Run: `bun run lint`
Expected: generated bindings do not break TS consumers

- [ ] **Step 4: Inspect git diff for accidental regressions to Sonarus-owned features**

Run: `git diff --stat`
Expected: changes align with requested upstream commits plus conflict-resolution glue

- [ ] **Step 5: Commit integration branch once verification evidence is captured**

```bash
git add .
git commit -m "merge: integrate crucial upstream Handy commits"
```
