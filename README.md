# Elysium Community Directory

This repository contains the directory listings for community plugins and recipes.

**Plugins are hosted in their own repositories** - this repo only contains the JSON index.

## Structure

```
elysium-community/
├── plugins.json          # Plugin directory listing (points to author repos)
├── recipes.json          # Recipe directory listing
└── README.md
```

## For Plugin Authors

1. Create your own public GitHub repository for your plugin
2. Include `manifest.json` and `main.js` in the repo root
3. Submit a Pull Request to add your plugin to `plugins.json`

## Submitting a Plugin

Add an entry to `plugins.json`:

```json
{
  "id": "com.yourname.your-plugin",
  "name": "Your Plugin Name",
  "description": "What your plugin does",
  "author": "Your Name",
  "version": "1.0.0",
  "min_app_version": "2.0.0",
  "repo": "https://github.com/yourname/your-plugin-repo",
  "funding_url": "https://ko-fi.com/yourname",
  "support_links": [
    { "label": "Ko-fi", "url": "https://ko-fi.com/yourname" },
    { "label": "Patreon", "url": "https://patreon.com/yourname" }
  ],
  "downloads": 0,
  "verified": false,
  "permissions": ["read:habits"],
  "tags": ["your", "tags"],
  "category": "workflow",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}

## Plugin Manifest Schema

```json
{
  "id": "com.yourname.plugin-name",
  "name": "Plugin Display Name",
  "version": "1.0.0",
  "minAppVersion": "2.0.0",
  "author": "Your Name",
  "authorUrl": "https://yourwebsite.com",
  "description": "What your plugin does",
  "repo": "https://github.com/yourname/your-plugin",
  "category": "workflow",
  "main": "main.js",
  "permissions": ["read:habits", "write:tasks"],
  "fundingUrl": "https://ko-fi.com/yourname",
  "supportLinks": [
    { "label": "Ko-fi", "url": "https://ko-fi.com/yourname" },
    { "label": "GitHub Sponsors", "url": "https://github.com/sponsors/yourname" }
  ],
  "events": ["habit:completed", "task:created"],
  "commands": [
    {
      "id": "command-id",
      "name": "Command Name",
      "description": "What the command does"
    }
  ],
  "settings": [
    {
      "id": "settingId",
      "type": "boolean|string|number|select",
      "title": "Setting Title",
      "description": "Setting description",
      "default": true
    }
  ]
}
```

## Support Links

Plugin developers can add support links to encourage users to support their work. These appear as a heart icon on installed plugins and in a "Support the Developer" section on the install screen.

**In plugins.json (directory listing):**
```json
{
  "support_links": [
    { "label": "Ko-fi", "url": "https://ko-fi.com/yourname" },
    { "label": "PayPal", "url": "https://paypal.me/yourname" },
    { "label": "My Website", "url": "https://yourwebsite.com/support" },
    { "label": "Venmo", "url": "https://venmo.com/yourname", "icon": "dollarsign.circle.fill" }
  ]
}
```

**In manifest.json (plugin repo):**
```json
{
  "supportLinks": [
    { "label": "Patreon", "url": "https://patreon.com/yourname" },
    { "label": "GitHub Sponsors", "url": "https://github.com/sponsors/yourname" },
    { "label": "Buy Me a Coffee", "url": "https://buymeacoffee.com/yourname" },
    { "label": "Donate via PayPal", "url": "https://paypal.me/yourname" },
    { "label": "My Website", "url": "https://yourwebsite.com" }
  ]
}
```

The `label` field is freeform - you can use any text you want!

**Auto-detected icons (based on label text):**
| Label contains | Icon |
|----------------|------|
| Patreon | heart.fill |
| Ko-fi, Coffee | cup.and.saucer.fill |
| PayPal | creditcard.fill |
| GitHub, Sponsor | star.fill / heart.circle.fill |
| Donate, Donation | gift.fill |
| Website, Site | globe |
| Discord | bubble.left.and.bubble.right.fill |
| Twitter, X.com | at |

**Custom icons:** For platforms not listed above (like Venmo, Cash App, etc.), specify any [SF Symbol](https://developer.apple.com/sf-symbols/) using the optional `icon` field:
```json
{ "label": "Venmo", "url": "https://venmo.com/you", "icon": "dollarsign.circle.fill" }
{ "label": "Cash App", "url": "https://cash.app/$you", "icon": "banknote.fill" }
```

## Plugin Categories

- `workflow` - Workflow automation plugins
- `template` - Template plugins
- `automation` - Automation plugins
- `theme` - Theme/appearance plugins
- `dashboard` - Dashboard widgets
- `habits` - Habit tracking plugins
- `productivity` - Productivity tools
- `other` - Other plugins

## Available Permissions

- `read:goals` - Read goal data
- `write:goals` - Create/update/delete goals
- `read:tasks` - Read task data
- `write:tasks` - Create/update/delete tasks
- `read:habits` - Read habit data
- `write:habits` - Create/update/delete habits
- `read:events` - Read calendar events
- `write:events` - Create/update/delete events
- `storage` - Use plugin-specific storage
- `notifications` - Show notifications
- `ui` - Access UI components

## Available Events

- `habit:completed` - When a habit is marked complete
- `habit:created` - When a new habit is created
- `task:completed` - When a task is marked complete
- `task:created` - When a new task is created
- `goal:completed` - When a goal is marked complete
- `goal:created` - When a new goal is created

## Plugin API

```javascript
// Habits
elysium.habits.list()
elysium.habits.get(id)
elysium.habits.complete(id, count)

// Tasks
elysium.tasks.list()
elysium.tasks.get(id)
elysium.tasks.complete(id)

// Goals
elysium.goals.list()
elysium.goals.get(id)

// Storage (plugin-specific)
elysium.storage.get()
elysium.storage.set(data)

// UI
elysium.ui.showNotification({ title, message, type })

// Console
elysium.console.log(message)
elysium.console.error(message)
elysium.console.warn(message)

// Events
elysium.events.on(eventName, handler)

// Commands
elysium.commands.register(commandId, handler)
```
