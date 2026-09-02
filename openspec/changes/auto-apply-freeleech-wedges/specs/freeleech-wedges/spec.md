## Purpose

Lets users configure a per-medium file-size threshold that automatically pre-selects the freeleech wedge toggle in the download review flow, so they don't have to manually flag large downloads for a wedge every time.

## ADDED Requirements

### Requirement: Configure auto-apply wedge settings
The system SHALL let a user enable or disable auto-apply wedges, and independently configure a file-size threshold for the "books" medium and the "audiobooks" medium. A medium with no threshold configured SHALL NOT be auto-applied even when the feature is enabled overall.

#### Scenario: Enabling the feature with only one medium's threshold set
- **WHEN** the user enables auto-apply wedges and sets a threshold only for audiobooks, leaving books blank
- **THEN** the system saves the setting, and future book downloads are never auto-selected for a wedge while audiobook downloads are evaluated against the configured threshold

#### Scenario: Rejecting an invalid threshold
- **WHEN** the user enters a non-positive or non-numeric threshold value for a medium and attempts to save
- **THEN** the system rejects the save and reports a validation error for that medium

### Requirement: Advisory about MAM's own auto-wedge feature
The Settings UI SHALL display advisory copy explaining that MAM offers its own equivalent auto-wedge feature, and that the user should use only one of Scurry's auto-apply or MAM's own feature at a time, not both.

#### Scenario: User opens the Wedges settings tab
- **WHEN** the user navigates to the Wedges tab in Settings
- **THEN** the system displays the enable toggle, per-medium threshold inputs, and the advisory text about not combining Scurry's auto-apply with MAM's built-in auto-wedge feature

### Requirement: Auto-apply wedge on eligible downloads
When a user opens the download review modal/bottomsheet for a single audiobook, a single ebook, or the dual audiobook+ebook flow, the system SHALL default an item's freeleech wedge toggle to active when all of the following hold for that item: auto-apply is enabled, a threshold is configured for the item's medium, the item's file size is greater than or equal to that threshold, the item is not VIP, the item is not already freeleech, the item is not already snatched, and the user has at least one freeleech wedge available. Every other item SHALL default to inactive, matching current behavior.

#### Scenario: Single audiobook over threshold
- **WHEN** a user opens the review flow for a single audiobook whose file size meets or exceeds the configured audiobooks threshold, and the item is not VIP, not freeleech, not snatched, and the user has a wedge available
- **THEN** the wedge toggle for that item defaults to active

#### Scenario: VIP item is never auto-applied
- **WHEN** an item meets or exceeds its medium's threshold but is flagged VIP
- **THEN** the wedge toggle for that item defaults to inactive, regardless of the threshold

#### Scenario: No wedges available
- **WHEN** an item meets or exceeds its medium's threshold but the user has zero freeleech wedges available
- **THEN** the wedge toggle for that item defaults to inactive

#### Scenario: Dual flow evaluates each item independently
- **WHEN** the dual review flow opens with a book and an audiobook, each meeting or exceeding its own medium's threshold and otherwise eligible
- **THEN** both items' wedge toggles default to active, independent of how many wedges the user actually has available

### Requirement: Auto-applied wedge state remains user-editable
An auto-applied wedge default SHALL NOT prevent the user from manually toggling that item's wedge state before confirming the download, and manually toggling an item SHALL NOT be overridden back by the auto-apply logic.

#### Scenario: User deselects an auto-applied wedge
- **WHEN** the review flow auto-applies a wedge to an item and the user clicks that item's wedge toggle before confirming
- **THEN** the wedge toggle switches to inactive and the download proceeds without a wedge for that item
