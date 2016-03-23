# Change Log
All notable changes to BrightCast will be documented in this file.

## [Unreleased]

## 0.8.0 - 2016-03-23
### Changed
- Started using browserify for bundling of dependencies.
- Move server and localizations code to separate file.
- Refactor js code and gulpfile tasks.

## 0.7.1 - 2016-03-21
### Added
- Package.json file for installing all the dependencies via `npm install`.
- Some explanations to settings page.
- "http://" to address, which is coppied to clipboard.

### Changed
- Broadcast icon, added tooltip for it.

## 0.7.0 - 2016-03-09
### Added
- Ability to download songs.
- Handling vk error 5 (User authorization failed) and showing instruction how to fix it.
- App shortcuts (ctrl + arrow left - skip prev, ctrl + arrow right - skip next, ctrl + space - play/pause, ctrl + arrow up - increase volume, ctrl + arrow down - decrease volume).
- Showing error message on mobile when connection with desktop lost.
- Saving value of volume range and restoring it on launch.
- Copying address to clipboard on click.

### Removed
- Cleaning users' broadcast on app close.

### Changed
- Started using mdl 1.1.1 instead of 1.0.6, mdl-toast instead of madtaras-toast.
- Default lang to EN.
- address encoded in QR code (added "http://") to be automatically opened via scanners.

## [0.6.0 - 0.7.0]
- Haven't logged changes.

## 0.6.0 - 2016-01-11
- First published version of app.
