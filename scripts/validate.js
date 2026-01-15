#!/usr/bin/env node

/**
 * Elysium Community Plugin Validator
 *
 * Validates plugin submissions by:
 * 1. Checking the submission JSON format
 * 2. Fetching and validating the manifest from the plugin repo
 * 3. Running security checks on the plugin code
 * 4. Outputting results for GitHub Actions
 */

const fs = require('fs');
const path = require('path');

// Required fields in submission file
const REQUIRED_SUBMISSION_FIELDS = ['id', 'name', 'description', 'author', 'repo'];

// Required fields in manifest.json
const REQUIRED_MANIFEST_FIELDS = ['id', 'name', 'version', 'minAppVersion', 'author', 'description', 'main', 'permissions'];

// Valid permissions
const VALID_PERMISSIONS = [
  'read:goals', 'read:tasks', 'read:habits', 'read:odysseys',
  'read:appointments', 'read:reminders', 'read:categories', 'read:tags',
  'read:timeline', 'read:settings', 'read:schedules',
  'write:goals', 'write:tasks', 'write:habits', 'write:odysseys',
  'write:appointments', 'write:reminders', 'write:categories', 'write:tags',
  'write:timeline', 'write:settings',
  'notifications', 'shortcuts', 'network', 'clipboard', 'filesystem', 'theme', 'customize:ui'
];

// Dangerous permissions that require extra review
const DANGEROUS_PERMISSIONS = [
  'write:goals', 'write:tasks', 'write:habits', 'write:odysseys',
  'write:appointments', 'write:reminders', 'write:categories', 'write:tags',
  'write:timeline', 'write:settings',
  'network', 'filesystem', 'theme', 'customize:ui'
];

// Dangerous code patterns to check for
const DANGEROUS_PATTERNS = [
  { pattern: /\beval\s*\(/, name: 'eval()' },
  { pattern: /\bnew\s+Function\s*\(/, name: 'new Function()' },
  { pattern: /document\.write/, name: 'document.write' },
  { pattern: /innerHTML\s*=/, name: 'innerHTML assignment' },
  { pattern: /\bfetch\s*\([^)]*\$\{/, name: 'dynamic fetch URL' },
];

class ValidationResult {
  constructor(pluginId) {
    this.pluginId = pluginId;
    this.passed = true;
    this.checks = [];
    this.warnings = [];
    this.errors = [];
    this.manifest = null;
  }

  addCheck(name, passed, details = null) {
    this.checks.push({ name, passed, details });
    if (!passed) {
      this.passed = false;
    }
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addError(message) {
    this.errors.push(message);
    this.passed = false;
  }

  toMarkdown() {
    const status = this.passed ? '✅ Passed' : '❌ Failed';
    let md = `## 🔍 Plugin Validation Results\n\n`;
    md += `**Plugin:** \`${this.pluginId}\`\n`;
    md += `**Status:** ${status}\n\n`;

    // Checks table
    md += `### Checks\n`;
    md += `| Check | Status |\n`;
    md += `|-------|--------|\n`;
    for (const check of this.checks) {
      const icon = check.passed ? '✅' : '❌';
      const details = check.details ? ` (${check.details})` : '';
      md += `| ${check.name}${details} | ${icon} |\n`;
    }
    md += '\n';

    // Warnings
    if (this.warnings.length > 0) {
      md += `### Warnings\n`;
      for (const warning of this.warnings) {
        md += `⚠️ ${warning}\n\n`;
      }
    }

    // Errors
    if (this.errors.length > 0) {
      md += `### Errors\n`;
      for (const error of this.errors) {
        md += `❌ ${error}\n\n`;
      }
    }

    // Manifest summary
    if (this.manifest) {
      md += `### Manifest Summary\n`;
      md += `- **Version:** ${this.manifest.version}\n`;
      md += `- **Min App Version:** ${this.manifest.minAppVersion}\n`;
      md += `- **Permissions:** ${this.manifest.permissions?.join(', ') || 'none'}\n`;
      if (this.manifest.category) {
        md += `- **Category:** ${this.manifest.category}\n`;
      }
    }

    return md;
  }

  toJSON() {
    return {
      pluginId: this.pluginId,
      passed: this.passed,
      checks: this.checks,
      warnings: this.warnings,
      errors: this.errors,
      manifest: this.manifest
    };
  }
}

/**
 * Parse GitHub repo URL to extract owner and repo name
 */
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

/**
 * Fetch file from GitHub repository
 */
async function fetchFromGitHub(repoUrl, filePath, branch = 'main') {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${filePath}`;

  const response = await fetch(rawUrl);
  if (!response.ok) {
    // Try master branch as fallback
    if (branch === 'main') {
      return fetchFromGitHub(repoUrl, filePath, 'master');
    }
    throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
  }

  return response.text();
}

/**
 * Validate plugin ID format (reverse domain notation)
 */
function isValidPluginId(id) {
  // Must have at least 2 parts separated by dots
  const parts = id.split('.');
  if (parts.length < 2) return false;

  // Each part must be lowercase alphanumeric with hyphens
  const partPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
  return parts.every(part => partPattern.test(part));
}

/**
 * Validate semver format
 */
function isValidSemver(version) {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(version);
}

/**
 * Check for existing plugin in directory
 */
function checkDuplicate(pluginId, pluginsDir) {
  const existingFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.json'));
  for (const file of existingFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(pluginsDir, file), 'utf8'));
      if (content.id === pluginId) {
        return true;
      }
    } catch (e) {
      // Skip invalid files
    }
  }
  return false;
}

/**
 * Validate a single plugin submission
 */
async function validatePlugin(submissionPath, pluginsDir) {
  const filename = path.basename(submissionPath);
  let result = new ValidationResult(filename.replace('.json', ''));

  // Check 1: Valid JSON
  let submission;
  try {
    const content = fs.readFileSync(submissionPath, 'utf8');
    submission = JSON.parse(content);
    result.addCheck('Valid JSON', true);
  } catch (e) {
    result.addCheck('Valid JSON', false, e.message);
    return result;
  }

  // Check 2: Required fields
  const missingFields = REQUIRED_SUBMISSION_FIELDS.filter(f => !submission[f]);
  if (missingFields.length > 0) {
    result.addCheck('Required fields', false, `missing: ${missingFields.join(', ')}`);
    return result;
  }
  result.addCheck('Required fields', true);

  // Update result with actual plugin ID
  result.pluginId = submission.id;

  // Check 3: Plugin ID format
  if (!isValidPluginId(submission.id)) {
    result.addCheck('Plugin ID format', false, 'must be reverse domain notation (e.g., com.author.name)');
    return result;
  }
  result.addCheck('Plugin ID format', true);

  // Check 4: Filename matches plugin ID
  const expectedFilename = `${submission.id}.json`;
  if (filename !== expectedFilename) {
    result.addCheck('Filename matches ID', false, `expected ${expectedFilename}`);
  } else {
    result.addCheck('Filename matches ID', true);
  }

  // Check 5: Check for duplicates (skip if this is the file being checked)
  const isDuplicate = checkDuplicate(submission.id, pluginsDir);
  // Note: This will be true for updates, so we just warn
  if (isDuplicate) {
    result.addWarning('Plugin ID already exists - this will update the existing entry');
  }

  // Check 6: Repo accessible and has manifest
  let manifest;
  try {
    const manifestContent = await fetchFromGitHub(submission.repo, 'manifest.json');
    manifest = JSON.parse(manifestContent);
    result.addCheck('Repo accessible', true);
    result.addCheck('Manifest found', true);
    result.manifest = manifest;
  } catch (e) {
    result.addCheck('Repo accessible', false, e.message);
    return result;
  }

  // Check 7: Manifest has required fields
  const missingManifestFields = REQUIRED_MANIFEST_FIELDS.filter(f => !manifest[f]);
  if (missingManifestFields.length > 0) {
    result.addCheck('Manifest valid', false, `missing: ${missingManifestFields.join(', ')}`);
    return result;
  }
  result.addCheck('Manifest valid', true);

  // Check 8: IDs match
  if (manifest.id !== submission.id) {
    result.addCheck('IDs match', false, `submission: ${submission.id}, manifest: ${manifest.id}`);
  } else {
    result.addCheck('IDs match', true);
  }

  // Check 9: Version format
  if (!isValidSemver(manifest.version)) {
    result.addCheck('Version format', false, `${manifest.version} is not valid semver`);
  } else {
    result.addCheck('Version format', true, manifest.version);
  }

  // Check 10: Permissions are valid
  const invalidPermissions = manifest.permissions?.filter(p => !VALID_PERMISSIONS.includes(p)) || [];
  if (invalidPermissions.length > 0) {
    result.addCheck('Valid permissions', false, `invalid: ${invalidPermissions.join(', ')}`);
  } else {
    result.addCheck('Valid permissions', true);
  }

  // Warning checks

  // Check for dangerous permissions
  const dangerousUsed = manifest.permissions?.filter(p => DANGEROUS_PERMISSIONS.includes(p)) || [];
  if (dangerousUsed.length > 0) {
    result.addWarning(`Plugin requests dangerous permissions: \`${dangerousUsed.join('`, `')}\` - please document why these are needed`);
  }

  // Check for missing optional fields
  if (!manifest.helpUrl) {
    result.addWarning('Consider adding a `helpUrl` for documentation');
  }
  if (!manifest.category) {
    result.addWarning('Consider adding a `category` for better discoverability');
  }

  // Check permission count
  if (manifest.permissions?.length > 5) {
    result.addWarning(`Plugin requests ${manifest.permissions.length} permissions - consider if all are necessary`);
  }

  // Security checks - fetch main.js and scan for dangerous patterns
  try {
    const mainJs = await fetchFromGitHub(submission.repo, manifest.main);

    // Check file size
    if (mainJs.length > 1024 * 1024) {
      result.addWarning(`Main script is large (${(mainJs.length / 1024).toFixed(0)}KB) - consider code splitting`);
    }

    // Check for dangerous patterns
    for (const { pattern, name } of DANGEROUS_PATTERNS) {
      if (pattern.test(mainJs)) {
        result.addWarning(`Found potentially dangerous pattern: \`${name}\` - please document its use`);
      }
    }
  } catch (e) {
    result.addCheck('Main script accessible', false, e.message);
  }

  return result;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node validate.js <plugin-file.json> [plugin-file2.json ...]');
    process.exit(1);
  }

  const pluginsDir = path.join(__dirname, '..', 'plugins');
  const results = [];

  for (const file of args) {
    console.log(`\nValidating: ${file}`);
    try {
      const result = await validatePlugin(file, pluginsDir);
      results.push(result);

      // Print results to console
      console.log(result.toMarkdown());
    } catch (e) {
      console.error(`Error validating ${file}:`, e.message);
      const result = new ValidationResult(path.basename(file, '.json'));
      result.addError(`Validation failed: ${e.message}`);
      results.push(result);
    }
  }

  // Write results to file for GitHub Action
  const output = {
    allPassed: results.every(r => r.passed),
    results: results.map(r => r.toJSON()),
    markdown: results.map(r => r.toMarkdown()).join('\n---\n\n')
  };

  fs.writeFileSync('validation-result.json', JSON.stringify(output, null, 2));

  // Exit with error code if any failed
  if (!output.allPassed) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
