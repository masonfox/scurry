## Why

MAM torrents can be flagged for personal freeleech with a "wedge," and Scurry already lets a user manually toggle a wedge on in the download review modal/bottomsheet. Users currently have to remember to do this by hand for every large download. MAM offers a similar auto-wedge feature itself (issue #40), but the requester wants the option to configure it in Scurry instead, scoped per medium (audiobooks vs. books), consistent with how tags and categories are already configured.

## What Changes

- Add a new `wedges` settings section (`enabled` flag + a per-medium `books`/`audiobooks` file-size threshold), persisted the same way as `tags`/`categories`.
- Add a dedicated "Wedges" tab to the Settings page with an enable toggle, a number + unit (MB/GB) threshold input per medium, and advisory copy telling users to pick either Scurry's auto-apply or MAM's own auto-wedge beta, not both.
- When opening the download review modal/bottomsheet (single audiobook flow, single ebook flow, or the dual audiobook+ebook flow), pre-toggle the freeleech wedge state per item when: auto-apply is enabled, a threshold is configured for that item's medium, the item's file size meets or exceeds it, the item is not VIP, not already freeleech, not already snatched, and the user has at least one wedge available.
- The wedge toggle remains fully user-editable after auto-apply pre-selects it — this only changes the default state, never removes manual control. In the dual flow, if both items are auto-selected but only one wedge is actually available, the user is expected to manually deselect one before confirming (no automatic scarcity arbitration).

## Capabilities

### New Capabilities
- `freeleech-wedges`: user-configurable per-medium file-size thresholds that auto-select the freeleech wedge toggle in the download review flow, subject to existing wedge eligibility rules (not VIP, not already freeleech, not snatched, wedge available).

### Modified Capabilities
(none — no existing capability specs exist yet in this repo; wedge toggling itself has no prior spec to amend)

## Impact

- `src/lib/settings.js`: new `wedges` key in defaults + validation.
- `src/lib/utilities.js`: new pure helper(s) to convert a threshold to bytes and decide auto-apply eligibility.
- `app/settings/page.jsx`: new "Wedges" settings tab.
- `app/page.jsx`: `openSingleReview` / `openDualReview` compute the initial `useWedge` value instead of hardcoding `false`.
- `app/components/DownloadReviewModal.jsx`: no structural change expected — it already renders whatever `useWedge` value it's given and exposes the manual toggle.
- Tests: `__tests__/settings.test.mjs` (validation) and a new test file for the auto-apply helper logic.
