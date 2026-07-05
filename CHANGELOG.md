## [0.6.1-alpha.5] - 2026-07-04

## New Features

- **Glimmerwood Non-Web Support**: Handled Glimmerwood as a non-web game in the hub. Clicking "Install" now redirects to its details section, preventing "Launch Game" buttons from showing since it is a standalone client game.
- **Direct PC/Linux Builds**: Added direct download links for the PC (Windows) and Linux builds of Glimmerwood.

## Bug Fixes

- **Catalog Restore Hang**: Fixed an issue where restoring the minimized browser window caused the game catalog database loading to hang indefinitely.
- **Crucible Database Link**: Updated the production database URL for Alchemist's Crucible to `https://alchemy.kbs-cloud.com`.

## [0.6.1-alpha.4] - 2026-06-24

# Next Changelog

- No changes yet.

## [0.6.1-alpha.3] - 2026-06-24

## New Features

- Added a portable Windows x64 ZIP package build (`kbs-cloud-hub-setup.zip`).

## Bug Fixes

- Fixed blank white screen in play windows when launching installed games from the library.
- Enabled loading the local standalone version of games when launched in packaged desktop mode.

## [0.6.1-alpha.2] - 2026-06-24

## Bug Fixes

- Fixed a blank white screen issue when launching the packaged Windows desktop application by using relative assets paths.

## [0.6.1-alpha.1] - 2026-06-24

# Changelog

## New Features
- **Offline Mode Support**: You can now play installed, offline-compatible games even when disconnected. You can manually toggle offline simulation using the network badge in the header.
- **Data Caching & Cloud Syncing**: Game catalogs, installations, and profiles are cached locally on your device. Any offline edits (such as installations or achievements) are queued and synced to the cloud automatically once online connection returns.
- **Client Downloads Portal**: A dedicated Downloads tab has been added where you can download custom desktop and mobile wrappers for Windows, macOS, Linux, Android, and iOS, linking to the latest GitHub release assets.
- **Desktop & Mobile Support**: Native configurations for Electron and Capacitor are now integrated, making it possible to wrap and bundle the hub for all desktop and mobile devices.
- **Release Integration**: Add the centralized `npm run release` script to support automated versioning, git tagging, changelog rolling, and GitHub release publishing.

## Changes
- Updated game storefront and library cards to display "Install" and "Play" statuses.
- Added a Sync Pending widget to the header that glows when there are unsynced changes.
