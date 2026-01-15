#!/usr/bin/env node

/**
 * Elysium Community Plugin Directory Builder
 *
 * Aggregates all plugin submissions and fetches their manifests
 * to build the complete plugins.json directory file.
 *
 * Run this after merging plugin submissions to rebuild the directory.
 */

const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');
const OUTPUT_FILE = path.join(__dirname, '..', 'plugins.json');

/**
 * Parse GitHub repo URL to extract owner and repo name
 */
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

/**
 * Fetch manifest from GitHub repository
 */
async function fetchManifest(repoUrl, branch = 'main') {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/manifest.json`;

  const response = await fetch(rawUrl);
  if (!response.ok) {
    // Try master branch as fallback
    if (branch === 'main') {
      return fetchManifest(repoUrl, 'master');
    }
    throw new Error(`Failed to fetch manifest: ${response.status}`);
  }

  return JSON.parse(await response.text());
}

/**
 * Build the plugins directory
 */
async function buildDirectory() {
  console.log('Building plugin directory...\n');

  // Read all submission files
  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} plugin submission(s)\n`);

  const plugins = [];
  const errors = [];

  for (const file of files) {
    const filePath = path.join(PLUGINS_DIR, file);
    console.log(`Processing: ${file}`);

    try {
      // Read submission
      const submission = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Fetch manifest from repo
      const manifest = await fetchManifest(submission.repo);

      // Build plugin entry for directory
      const plugin = {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description,
        author: manifest.author,
        version: manifest.version,
        minAppVersion: manifest.minAppVersion,
        repo: submission.repo,
        permissions: manifest.permissions || [],
        // Optional fields
        ...(manifest.authorUrl && { authorUrl: manifest.authorUrl }),
        ...(manifest.helpUrl && { helpUrl: manifest.helpUrl }),
        ...(manifest.fundingUrl && { fundingUrl: manifest.fundingUrl }),
        ...(manifest.supportLinks && { supportLinks: manifest.supportLinks }),
        ...(manifest.tags && { tags: manifest.tags }),
        ...(manifest.category && { category: manifest.category }),
        // Metadata
        updatedAt: new Date().toISOString()
      };

      plugins.push(plugin);
      console.log(`  ✅ Added: ${manifest.name} v${manifest.version}\n`);

    } catch (e) {
      console.log(`  ❌ Error: ${e.message}\n`);
      errors.push({ file, error: e.message });
    }
  }

  // Sort plugins by name
  plugins.sort((a, b) => a.name.localeCompare(b.name));

  // Build final directory
  const directory = {
    version: 1,
    generatedAt: new Date().toISOString(),
    plugins: plugins
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(directory, null, 2));

  console.log('─'.repeat(50));
  console.log(`\n✅ Directory built successfully!`);
  console.log(`   Plugins: ${plugins.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Output: ${OUTPUT_FILE}\n`);

  if (errors.length > 0) {
    console.log('Errors:');
    for (const { file, error } of errors) {
      console.log(`  - ${file}: ${error}`);
    }
  }

  return { plugins, errors };
}

// Main
buildDirectory().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
