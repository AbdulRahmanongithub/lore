#!/usr/bin/env node
'use strict';

/**
 * lore installer
 *
 * Copies the lore skill into a Claude skills directory. Nothing else — no
 * postinstall hooks, no shell profile edits, no background daemon. The skill
 * itself is read-only by design, and so is its installer: it writes exactly
 * one directory and tells you which one.
 *
 *   npx lore-skill            → install for your user (~/.claude/skills/lore)
 *   npx lore-skill --project  → install into this repo (.claude/skills/lore)
 *   npx lore-skill --where    → print the paths and exit, change nothing
 *   npx lore-skill --remove   → delete an installed copy
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.join(__dirname, '..', 'plugins', 'lore', 'skills', 'lore');
const VERSION = require('../package.json').version;

const args = process.argv.slice(2);
const has = (...names) => names.some((n) => args.includes(n));

const project = has('--project', '-p');
const force = has('--force', '-f');

const target = project
  ? path.join(process.cwd(), '.claude', 'skills', 'lore')
  : path.join(os.homedir(), '.claude', 'skills', 'lore');

const label = project ? 'this project' : 'your user account';

function die(msg, code = 1) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(code);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else if (entry.isFile()) fs.copyFileSync(a, b);
  }
}

function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name));
    else n++;
  }
  return n;
}

if (has('--help', '-h')) {
  console.log(`
  lore ${VERSION} — codebase lore for AI coding agents

  Usage
    npx lore-skill [options]

  Options
    -p, --project   install into this repository (.claude/skills/lore) so
                    everyone who clones it gets the skill
    -f, --force     overwrite an existing install without asking
        --where     print install paths and exit without changing anything
        --remove    delete the installed copy
    -h, --help      show this

  Default is a user install at ~/.claude/skills/lore
`);
  process.exit(0);
}

if (has('--where')) {
  console.log(`
  user install     ${path.join(os.homedir(), '.claude', 'skills', 'lore')}
  project install  ${path.join(process.cwd(), '.claude', 'skills', 'lore')}
  source in this package
                   ${SRC}
`);
  process.exit(0);
}

if (has('--remove')) {
  if (!fs.existsSync(target)) die(`Nothing installed at ${target}`);
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`\n  ✓ Removed ${target}\n`);
  process.exit(0);
}

// --- install ---

if (!fs.existsSync(path.join(SRC, 'SKILL.md'))) {
  die(`Package looks incomplete — no SKILL.md at ${SRC}`);
}

if (fs.existsSync(target) && !force) {
  die(
    `Already installed at ${target}\n` +
      `    Re-run with --force to overwrite, or --remove to delete it first.`
  );
}

try {
  copyDir(SRC, target);
} catch (err) {
  if (err.code === 'EACCES' || err.code === 'EPERM') {
    die(`No permission to write ${target}\n    ${err.message}`);
  }
  die(`Copy failed — ${err.message}`);
}

const n = countFiles(target);

console.log(`
  ✓ lore ${VERSION} installed for ${label}
    ${target}
    ${n} files

  Start a new Claude Code session, then just talk to it:

    "work out what this codebase does and write it down for you"
    "my agent keeps breaking the approval flow — map the business rules"

  No command needed; plain conversation triggers it. /lore also works.
  It is read-only: it writes .lore/ and AGENTS.md and changes nothing else.
${
  project
    ? '\n  Commit .claude/skills/lore so everyone who clones this repo gets it.\n'
    : ''
}`);
