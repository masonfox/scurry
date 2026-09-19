## Context

See proposal.md - Why. Relevant existing structure:

- Settings persist as a flat JSON blob via `src/lib/settings.js` (`getDefaults`, `readSettings`, `writeSettings`, `validateSettings`); `tags` and `categories` already follow an `{ enabled, defaults: { books, audiobooks } }`-shaped schema, and `app/settings/page.jsx` already implements a tab per feature with the same load/dirty-check/save pattern.
- File size arrives on search results as a formatted string (e.g. `"450 MB"`) in `result.size`, already parsed to bytes via `parseSizeToBytes()` in `src/lib/utilities.js` for ratio-impact math.
- The review modal (`app/components/DownloadReviewModal.jsx`) never decides wedge eligibility itself for the *default* value — `app/page.jsx`'s `openSingleReview`/`openDualReview` currently hardcode `useWedge: false` when building the `reviewItems` passed to the modal. The modal already independently guards whether the toggle is even shown (`hasWedges && !snatched && !freeleech && !vip`).
- `userStats` (including `flWedges`) and `appSettings` are both fetched into `page.jsx` state on mount/token-availability, before a user can realistically reach the review flow.

## Goals / Non-Goals

**Goals:**
- Reuse the existing settings tab pattern exactly (no new persistence mechanism, no new settings API route).
- Make the auto-apply decision a pure, unit-testable function independent of React state, since existing tests only cover `src/lib/*` and API routes, not components.
- Keep `DownloadReviewModal`/`ItemCard` structurally unchanged — they already accept a `useWedge` value per item and expose a toggle.

**Non-Goals:**
- No wedge-scarcity arbitration across dual-flow items (confirmed with user: auto-apply both, let the user manually deselect).
- No change to how a wedge is actually redeemed (`app/api/add/route.js`'s `buildFLDownloadUrl` flow is untouched).
- No per-user/account VIP concept — VIP stays a per-torrent flag as it is today.

## Decisions

**Threshold storage shape**: `{ value: number|null, unit: "KB"|"MB"|"GB" }` per medium, rather than a raw byte integer or a free-text size string. `KB` was added after manual testing showed some ebooks are well under 1 MB, making an MB/GB-only dropdown unable to express a meaningful threshold for that medium.
- Alternative considered: reuse the free-text size-string convention (like `result.size`) and parse with `parseSizeToBytes`. Rejected per user preference — structured `{value, unit}` avoids re-parsing user-typed strings and lets the Settings UI render a plain number input + unit dropdown without round-tripping bytes back into a display string.
- `null` value means "no threshold configured for this medium" (auto-apply never fires for it), distinct from `0` which would mean "always apply." This also lets the two mediums be independently on/off without a second pair of enable flags.

**New pure helper functions in `src/lib/utilities.js`**:
- `thresholdToBytes({ value, unit })` -> `number|null`. Returns `null` when `value` is `null`/not a positive finite number.
- `shouldAutoApplyWedge({ sizeBytes, thresholdBytes, vip, freeleech, snatched, wedgesAvailable })` -> `boolean`. Pure boolean AND of all eligibility conditions from the spec's "Auto-apply wedge on eligible downloads" requirement.

Keeping these as plain functions (no React, no fetch) means they can be tested the same way `parseSizeToBytes`/`formatBytesToSize` already are, and `app/page.jsx` just calls them with values it already holds (`appSettings.wedges`, `userStats.flWedges`, `item.size`, `item.vip`, `item.freeleech`, `item.snatched`).

**Wiring point**: compute `useWedge` inline where `openSingleReview`/`openDualReview` currently hardcode `useWedge: false`, using the medium (`category`) already computed there to pick the right threshold. No new state, no new effect — `appSettings` and `userStats` are already in scope, just need to be added to those `useCallback` dependency arrays.

**Settings tab placement**: new tab id `wedges`, label "Wedges", inserted after "Categories" and before "MAM Token" in the `TABS` array, matching the existing single-word tab-label convention.

## Risks / Trade-offs

- [`appSettings` or `userStats` not yet loaded when a review flow opens (fast click right after page load)] -> Both are fetched on mount; treat a missing/null value the same as "feature disabled" / "no wedges available" (fail closed to no auto-apply), consistent with how `hasWedges` already defaults falsy when `userStats` is null.
- [User has auto-apply enabled in Scurry AND MAM's own beta feature] -> Not preventable programmatically (Scurry has no visibility into MAM's own auto-wedge config); addressed via the advisory copy in Settings only, per proposal.
- [Dual flow can pre-select more wedges than the user actually has] -> Accepted trade-off per user decision; the toggle stays editable and the review modal already shows the projected ratio impact, giving the user a chance to catch it before confirming.

## Migration Plan

Additive only: `readSettings()`'s existing `deepMerge(defaults, saved)` means older `config/settings.json` files without a `wedges` key automatically pick up `{ enabled: false, thresholds: { books: {value: null, unit: "MB"}, audiobooks: {value: null, unit: "MB"} } }` on next read, with no auto-apply behavior change for existing users until they opt in. No rollback concerns beyond a normal code revert.
