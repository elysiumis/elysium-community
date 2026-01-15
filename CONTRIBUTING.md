# Contributing to Elysium Community Plugins

Thank you for your interest in contributing a plugin to the Elysium community! This guide will walk you through the submission process.

## Before You Start

### Prerequisites

1. **Public GitHub Repository**: Your plugin must be hosted in a public GitHub repository
2. **Valid Manifest**: Your repo must contain a valid `manifest.json` at the root
3. **Working Plugin**: Your plugin should be tested and functional

### Plugin Requirements

Your plugin must:
- Follow the [Elysium Plugin API](https://elysium.is/docs/plugins/api)
- Not contain malicious code or hidden data collection
- Clearly document what permissions it needs and why
- Respect user privacy

## Submission Process

### Step 1: Prepare Your Plugin Repository

Ensure your repository has:

```
your-plugin-repo/
├── manifest.json      # Required - plugin metadata
├── main.js            # Required - entry point (name must match manifest.main)
├── styles.css         # Optional - custom styles
└── README.md          # Recommended - documentation
```

### Step 2: Create Your Manifest

Your `manifest.json` must include:

```json
{
  "id": "com.yourname.plugin-name",
  "name": "Your Plugin Name",
  "version": "1.0.0",
  "minAppVersion": "1.0.0",
  "author": "Your Name",
  "description": "A clear description of what your plugin does",
  "main": "main.js",
  "permissions": [
    "read:goals",
    "notifications"
  ]
}
```

#### Plugin ID Rules

- Must use reverse domain notation: `com.author.plugin-name`
- Use lowercase letters, numbers, and hyphens only
- Must be unique across all community plugins

#### Available Permissions

**Read Permissions** (safe):
- `read:goals`, `read:tasks`, `read:habits`, `read:odysseys`
- `read:appointments`, `read:reminders`, `read:categories`, `read:tags`
- `read:timeline`, `read:settings`, `read:schedules`

**Write Permissions** (requires justification):
- `write:goals`, `write:tasks`, `write:habits`, `write:odysseys`
- `write:appointments`, `write:reminders`, `write:categories`, `write:tags`
- `write:timeline`, `write:settings`

**Special Permissions** (requires justification):
- `notifications` - Show system notifications
- `shortcuts` - Trigger Apple Shortcuts
- `network` - Make network requests
- `clipboard` - Access clipboard
- `filesystem` - Access plugin sandbox folder
- `theme` - Customize app appearance
- `customize:ui` - Add custom UI elements

### Step 3: Fork and Submit

1. **Fork** this repository
2. **Create** a file in `plugins/` named `{your-plugin-id}.json`:

```json
{
  "id": "com.yourname.plugin-name",
  "name": "Your Plugin Name",
  "description": "A clear description",
  "author": "Your Name",
  "repo": "https://github.com/yourname/your-plugin-repo"
}
```

3. **Open a Pull Request** to this repository

### Step 4: Automated Validation

Our bot will automatically validate your submission and comment on your PR with results:

**Checks performed:**
- ✅ Valid JSON format
- ✅ Required fields present
- ✅ Plugin ID format correct
- ✅ Repository accessible
- ✅ Manifest valid and complete
- ✅ Version format (semver)
- ✅ Permissions are valid

**Warnings for:**
- ⚠️ Dangerous permissions (will need justification)
- ⚠️ Missing optional fields (helpUrl, category)
- ⚠️ Potentially dangerous code patterns

### Step 5: Review

A maintainer will review your submission. You may be asked to:
- Explain why certain permissions are needed
- Fix any issues found during review
- Improve documentation

### Step 6: Merge

Once approved, your PR will be merged and your plugin will appear in Elysium's community browser!

## Updating Your Plugin

To update your plugin:

1. Update `manifest.json` in your repository with a new version
2. That's it! The directory auto-rebuilds nightly

**No PR needed for updates** - just bump your version number.

## Removing Your Plugin

To remove your plugin:

1. Open a PR deleting your `plugins/{plugin-id}.json` file
2. Once merged, your plugin will be removed from the directory

## Best Practices

### Security
- Never use `eval()` or `new Function()` with user input
- Validate and sanitize any data before use
- Don't make network requests to untrusted domains
- Don't collect user data without explicit consent

### Performance
- Keep your main.js file small (< 100KB recommended)
- Avoid blocking operations
- Use async/await properly
- Clean up timers and listeners when disabled

### User Experience
- Provide clear error messages
- Document your plugin's features
- Include a help URL for support
- Respond to user feedback and issues

### Permissions
- Request only the permissions you need
- Document why each permission is required
- Prefer read permissions over write permissions

## Getting Help

- [Plugin Development Docs](https://elysium.is/docs/plugins)
- [Plugin API Reference](https://elysium.is/docs/plugins/api)
- [Community Discord](https://elysium.is/community)
- [Open an Issue](https://github.com/elysiumis/elysium-community/issues)

## Code of Conduct

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md). We're committed to providing a welcoming and inclusive community.

---

Thank you for contributing to Elysium! 🎉
