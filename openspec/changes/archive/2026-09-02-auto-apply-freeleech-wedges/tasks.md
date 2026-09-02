## 1. Settings schema and validation

- [x] 1.1 Add `wedges: { enabled: false, thresholds: { books: { value: null, unit: "MB" }, audiobooks: { value: null, unit: "MB" } } }` to `getDefaults()` in `src/lib/settings.js`
- [x] 1.2 Add a `wedges` validation block to `validateSettings()` in `src/lib/settings.js` (unit must be `"KB"`, `"MB"`, or `"GB"`; value must be `null` or a positive finite number), and verify with new cases in `__tests__/settings.test.mjs`
- [x] 1.3 Verify `readSettings()`'s existing `deepMerge` picks up the new `wedges` default for a settings file saved before this change (add/extend a test in `__tests__/settings.test.mjs`)

## 2. Auto-apply decision helper

- [x] 2.1 Add `thresholdToBytes({ value, unit })` to `src/lib/utilities.js`, returning `null` for a `null`/invalid value and the correct byte count for `"KB"`/`"MB"`/`"GB"` otherwise
- [x] 2.2 Add `shouldAutoApplyWedge({ sizeBytes, thresholdBytes, vip, freeleech, snatched, wedgesAvailable })` to `src/lib/utilities.js`, implementing the eligibility rule from `specs/freeleech-wedges/spec.md` ("Auto-apply wedge on eligible downloads")
- [x] 2.3 Add unit tests for both helpers covering: threshold met/unmet, missing threshold, VIP item, already-freeleech item, already-snatched item, and zero wedges available

## 3. Settings UI — Wedges tab

- [x] 3.1 Add `{ id: "wedges", label: "Auto Wedge" }` to the `TABS` array in `app/settings/page.jsx`, positioned after "Categories"
- [x] 3.2 Add local form state for `wedgesEnabled` and per-medium `{ value, unit }` thresholds, seeded from `fetchSettings()`, following the same pattern as the Categories tab
- [x] 3.3 Compute `isWedgesDirty` and fold it into the existing `isDirty`/`isCurrentTabDirty` checks
- [x] 3.4 Implement `handleSaveWedges()` and include `wedges` in `buildCurrentSettings()` so other tabs' saves don't clobber it
- [x] 3.5 Build the Wedges tab content: enable toggle, a number input + MB/GB unit dropdown per medium (books, audiobooks), and advisory text noting MAM has its own auto-wedge feature and to use only one of the two, not both
- [x] 3.6 Manually verify in the browser: toggling enable, setting/clearing thresholds per medium, saving, reloading the page, and confirming the advisory text renders

## 4. Wire auto-apply into the review flows

- [x] 4.1 In `app/page.jsx`, extract a small local helper that takes an item + its medium/category and returns the initial `useWedge` boolean using `appSettings.wedges`, `userStats.flWedges`, and the item's `size`/`vip`/`freeleech`/`snatched` fields via `thresholdToBytes`/`shouldAutoApplyWedge`
- [x] 4.2 Update `openSingleReview` to use that helper instead of hardcoding `useWedge: false`, and add `appSettings`/`userStats` to its `useCallback` dependency array
- [x] 4.3 Update `openDualReview` to apply the helper independently to both the book and audiobook items (each against its own medium's threshold), and add `appSettings`/`userStats` to its `useCallback` dependency array
- [x] 4.4 Manually verify: single audiobook flow, single ebook flow, and dual flow each pre-select the wedge toggle when the configured threshold is met, leave it off when not configured/not met, and never pre-select for a VIP or already-freeleech result
- [x] 4.5 Manually verify the toggle remains user-editable after auto-apply (click to deselect an auto-applied wedge, confirm the download proceeds without a wedge for that item)

## 5. Final checks

- [x] 5.1 Run the full test suite and confirm it passes
- [x] 5.2 Run `openspec validate --change "auto-apply-freeleech-wedges" --strict` and resolve any reported issues
