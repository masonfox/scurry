# Tags, Review Step & Settings Implementation Plan

Tracking document for [#26](https://github.com/masonfox/scurry/issues/26)

## Phase 1: Settings Infrastructure (Backend)

- [x] 1.1 Settings persistence module (`src/lib/settings.js`)
- [x] 1.2 Settings API route (`app/api/settings/route.js`)
- [x] 1.3 Connection test API (`app/api/settings/test-connection/route.js`)
- [x] 1.4 Update config module (`src/lib/config.js`)
- [x] 1.5 Add constants (`src/lib/constants.js`)
- [x] 1.6 Update `.env.example`

## Phase 2: Settings Page (Frontend)

- [x] 2.1 Settings page with tab layout (`app/settings/page.jsx`)
- [x] 2.2 qBittorrent tab (URL, username, password, test connection)
- [x] 2.3 Tags tab (enable/disable, add/remove, defaults per medium)
- [x] 2.4 Categories tab (enable/disable, defaults per medium)
- [x] 2.5 MAM Token tab (migrate TokenManager)
- [x] 2.6 Update Header (settings link, remove inline token manager)

## Phase 3: Review Step (Download Modal/Bottomsheet)

- [x] 3.1 TagPills component (`app/components/TagPills.jsx`)
- [x] 3.2 DownloadReviewModal — responsive (modal on desktop, bottomsheet on mobile) (`app/components/DownloadReviewModal.jsx`)
- [x] 3.3 ~~Separate ReviewBottomSheet~~ — merged into DownloadReviewModal as responsive component
- [x] 3.4 Refactor single-mode download flow
- [x] 3.5 Refactor dual-mode download flow
- [x] 3.6 Responsive rendering of review step

## Phase 4: qBittorrent Tag & Category Integration (Backend)

- [x] 4.1 Extend `qbAddUrl` with tags support
- [x] 4.2 Update `/api/add` route for tags and settings-aware categories
- [x] 4.3 Update existing tests
- [x] 4.4 New settings tests

## Phase 5: Client Integration (Wiring It Together)

- [x] 5.1 Fetch settings on search page
- [x] 5.2 Tag defaults in review step
- [x] 5.3 Category-aware downloads
- [x] 5.4 Remove `NEXT_PUBLIC_DEFAULT_CATEGORY` usage
