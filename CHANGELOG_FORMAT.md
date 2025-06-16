# Changelog Format Guidelines

## Standard Format

Use this format for all changelog entries:

```markdown
## [Version Number] - YYYY-MM-DD

### Added
- New features that were added

### Changed
- Changes in existing functionality

### Fixed
- Bug fixes

### Removed
- Features that were removed

### Technical
- Technical improvements, refactoring, or infrastructure changes

### TODO Completed
- List specific TODO items that were completed in this update
```

## Version Numbering

Use semantic versioning:
- **Major** (1.0.0): Breaking changes or major feature additions
- **Minor** (0.1.0): New features that don't break existing functionality
- **Patch** (0.0.1): Bug fixes and small improvements

## Example Entry

```markdown
## [0.2.0] - 2025-06-15

### Added
- Enhanced CodeMirror setup with multiple language modes
- Real-time syntax highlighting for JavaScript, CSS, and HTML
- Code folding functionality for better navigation

### Changed
- Improved file tab management with better visual indicators
- Enhanced chat panel responsiveness on mobile devices

### Fixed
- Fixed issue with file content not saving properly on tab switch
- Resolved CSS conflicts in light theme mode

### Technical
- Refactored model-manager.js for better error handling
- Optimized CodeMirror initialization performance
- Added proper event listener cleanup

### TODO Completed
- [x] Add more language modes (Python, TypeScript, React, Vue, etc.)
- [x] Implement code folding
- [x] Add bracket matching and auto-indentation improvements
```

## Guidelines

### Writing Style
- Use clear, concise descriptions
- Start each item with a verb (Added, Fixed, Improved, etc.)
- Be specific about what changed
- Include user impact when relevant

### Technical vs User-Facing
- **User-Facing**: Focus on what users will experience
- **Technical**: Focus on code improvements, refactoring, infrastructure

### TODO Integration
- Always reference completed TODO items
- Use the exact checkbox format from TODO.md
- Group related TODO completions together

### Dating
- Use ISO date format (YYYY-MM-DD)
- Update the date when releasing the changes
- Multiple changes on the same day can share one entry

## Quality Checklist

Before publishing a changelog entry:
- [ ] Version number follows semantic versioning
- [ ] Date is correct and in proper format
- [ ] All sections are relevant (remove empty sections)
- [ ] Items are clearly written and specific
- [ ] TODO items are properly referenced
- [ ] Technical changes are separated from user-facing ones
- [ ] Entry follows the established format

## Special Situations

### Hotfixes
```markdown
## [0.1.1] - 2025-06-15 (Hotfix)

### Fixed
- Critical bug that prevented file saving
```

### Beta/Alpha Releases
```markdown
## [0.2.0-beta.1] - 2025-06-15

### Added (Beta)
- Experimental AI inline suggestions (may be unstable)
```

### Breaking Changes
```markdown
## [1.0.0] - 2025-06-15

### BREAKING CHANGES
- Changed API structure for custom models
- Renamed configuration file from config.js to settings.json

### Migration Guide
- Update custom model references to use new format
- Rename your config.js file to settings.json
```

---

*Follow this format consistently to maintain a clear project history and help users understand changes.*
