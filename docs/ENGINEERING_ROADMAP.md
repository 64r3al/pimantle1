# Pimantle Engineering Roadmap

**Status:** In progress  
**Baseline branch:** `master`  
**Implementation policy:** small, reviewed changes with regression coverage

## Product direction

Evolve Pimantle into a polished, responsive semantic word game while preserving its defining experience: a hidden word, semantic similarity rankings, an interactive map, hints, archives and optional multiplayer.

The project should become easier to use, more engaging and more reliable without turning every idea into a dependency or forcing players to create accounts.

## Delivery principles

1. Preserve scoring, ranking, puzzle formats and existing user progress unless a separately reviewed change explicitly requires otherwise.
2. Keep production changes behind pull requests and automated checks.
3. Make migrations additive, idempotent and recoverable.
4. Keep the game usable when optional services such as multiplayer or analytics are unavailable.
5. Measure performance before replacing established libraries.
6. Never claim that a feature is complete until the browser behavior and regression checks have been verified.
7. Do not add a license until upstream ownership and reuse permissions have been established.

## Phases

### Phase 0 — Baseline and repository protection
- Record the baseline commit and branch state.
- Inventory runtime dependencies, build configuration and deployment settings.
- Document current data flow, puzzle formats and local-save keys.
- Capture representative desktop, tablet and mobile behavior.
- Identify external dependencies and unresolved ownership/licensing questions.

**Exit criteria:** reproducible baseline and a documented list of protected behaviors.

### Phase 1 — Quality and data-safety foundation
- Correct legacy save migration to use the bundled puzzle availability manifest.
- Test the newest bundled archive indexes and existing IndexedDB precedence.
- Ensure malformed legacy records do not abort migration of other valid records.
- Standardize the Node runtime used locally and in CI.
- Add architecture and quality-gate documentation.
- Expand automated coverage before changing gameplay code.

**Exit criteria:** migrations are tested and non-destructive; CI uses a supported Node LTS line.

### Phase 2 — Build-system modernization
- Evaluate a controlled Create React App to Vite migration.
- Verify React, TypeScript, Plotly, Fabric and Socket.IO compatibility.
- Preserve static asset paths, environment variables, routing and deployment behavior.
- Keep this separate from game-engine changes.

**Exit criteria:** development, tests and production builds work with equivalent application behavior.

### Phase 3 — Puzzle and data reliability
- Design a versioned puzzle manifest with release metadata and checksums.
- Establish a verified daily puzzle publishing process.
- Define UTC release semantics and local-time display behavior.
- Improve missing-data and delayed-publication states.
- Optimize historical dataset delivery through immutable assets and caching.
- Decide whether daily answers require server-side validation.
- Preserve local archive/practice play where appropriate.

**Exit criteria:** puzzle availability and release messaging are accurate; existing archive data remains verifiably intact.

### Phase 4 — Design system and interface
- Introduce centralized design tokens and reusable UI primitives.
- Redesign header, guess panel, map controls, archive, settings and victory states.
- Add a coherent theme system: system, dark, light and selected accent themes.
- Ensure all themes preserve contrast and responsive behavior.
- Review and selectively integrate the existing UI refresh pull request.

**Exit criteria:** all main screens follow one design system and pass visual checks at defined viewport sizes.

### Phase 5 — Motion and interaction
- Define motion tokens and interaction states.
- Refine guess, hint, map, dialog and victory transitions.
- Respect operating-system and in-app reduced-motion preferences.
- Avoid unnecessary continuous effects and expensive blur/filter animation.

**Exit criteria:** motion is consistent, useful, accessible and performant on mobile.

### Phase 6 — Gameplay and engagement
- Improve hint explanation and presentation without altering ranking semantics.
- Add isolated practice mode and a safe random-puzzle pool.
- Improve personal statistics and result sharing.
- Consider optional achievements and friend challenges.
- Keep accounts optional.

**Exit criteria:** new modes cannot corrupt daily progress or reveal future daily answers.

### Phase 7 — Multiplayer and community
- Review the Socket.IO backend and event contracts.
- Validate all incoming data at runtime.
- Test reconnection, room isolation, rate limits and disconnect handling.
- Add meaningful connection/error states.
- Keep multiplayer effects optional.

**Exit criteria:** multiplayer is verified independently from the local game.

### Phase 8 — Accessibility and performance
- Test keyboard and screen-reader flows.
- Target WCAG 2.2 AA.
- Test reduced motion, contrast and non-color cues.
- Benchmark map rendering and memory use.
- Optimize initial loading, puzzle data, archive access and third-party resources.
- Monitor Core Web Vitals at the 75th percentile.

**Exit criteria:** documented accessibility and performance checks pass on representative devices.

### Phase 9 — Release readiness
- Complete end-to-end and regression testing.
- Verify production configuration and puzzle availability.
- Verify deployment rollback.
- Update user and developer documentation.
- Release through a reviewed pull request and tagged version.

**Exit criteria:** critical player journeys are verified in the production candidate and rollback is available.

## Decisions intentionally left open

These decisions require evidence or owner approval before implementation:

- Daily answer protection: accept client-side visibility or move answer verification server-side.
- Daily puzzle source and publishing ownership.
- Historical asset hosting provider and migration approach.
- Whether account synchronization is needed.
- Whether Plotly remains the best visualization engine after benchmarking.
- Appropriate upstream licensing permissions.
- Analytics provider, consent requirements and data-retention policy.

## Immediate implementation slice

The first engineering-foundation change is deliberately limited to:
- a shared Node 24 runtime declaration,
- CI reading that runtime declaration,
- save migration driven by the archive availability manifest,
- tests for high-index migration, IndexedDB precedence and malformed legacy records,
- architecture and quality-gate documentation.

It does not change scoring, ranking, puzzle binaries, word data, save keys or the live UI.
