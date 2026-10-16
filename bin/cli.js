#!/usr/bin/env node
'use strict';

/**
 * lore installer
 *
 * Copies the lore skills (lore, lore-change) into a Claude skills directory.
 * Nothing else — no postinstall hooks, no shell profile edits, no background
 * daemon. It writes one directory per skill and tells you which.
 *
 *   npx lore-skill            → install for your user (~/.claude/skills/)
 *   npx lore-skill --project  → install into this repo (.claude/skills/)
 *   npx lore-skill --where    → print the paths and exit, change nothing
 *   npx lore-skill --remove   → delete the installed copies
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS = path.join(__dirname, '..', 'plugins', 'lore', 'skills');
const VERSION = require('../package.json').version;

const args = process.argv.slice(2);
const has = (...names) => names.some((n) => args.includes(n));

const project = has('--project', '-p');
const force = has('--force', '-f');

const base = project
  ? path.join(process.cwd(), '.claude', 'skills')
  : path.join(os.homedir(), '.claude', 'skills');

const skills = fs.existsSync(SKILLS)
  ? fs
      .readdirSync(SKILLS, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(SKILLS, e.name, 'SKILL.md')))
      .map((e) => e.name)
  : [];

const targets = skills.map((name) => ({
  name,
  src: path.join(SKILLS, name),
  dest: path.join(base, name),
}));

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
    -p, --project   install into this repository (.claude/skills/) so
                    everyone who clones it gets the skills
    -f, --force     overwrite an existing install without asking
        --where     print install paths and exit without changing anything
        --remove    delete the installed copies
    -h, --help      show this

  Default is a user install at ~/.claude/skills/ (${skills.join(', ')})
`);
  process.exit(0);
}

if (has('--where')) {
  console.log(`
  user install     ${path.join(os.homedir(), '.claude', 'skills')}
  project install  ${path.join(process.cwd(), '.claude', 'skills')}
  skills           ${skills.join(', ')}
  source in this package
                   ${SKILLS}
`);
  process.exit(0);
}

if (has('--remove')) {
  const present = targets.filter((t) => fs.existsSync(t.dest));
  if (present.length === 0) die(`Nothing installed under ${base}`);
  for (const t of present) {
    fs.rmSync(t.dest, { recursive: true, force: true });
    console.log(`  ✓ Removed ${t.dest}`);
  }
  console.log('');
  process.exit(0);
}

// --- install ---

if (!skills.includes('lore')) {
  die(`Package looks incomplete — no SKILL.md at ${path.join(SKILLS, 'lore')}`);
}

const existing = targets.filter((t) => fs.existsSync(t.dest));
if (existing.length > 0 && !force) {
  die(
    `Already installed at ${existing.map((t) => t.dest).join(', ')}\n` +
      `    Re-run with --force to overwrite, or --remove to delete first.`
  );
}

let n = 0;
for (const t of targets) {
  try {
    // Replace rather than merge, so files removed upstream do not linger.
    if (fs.existsSync(t.dest)) fs.rmSync(t.dest, { recursive: true, force: true });
    copyDir(t.src, t.dest);
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      die(`No permission to write ${t.dest}\n    ${err.message}`);
    }
    die(`Copy failed — ${err.message}`);
  }
  n += countFiles(t.dest);
}

console.log(`
  ✓ lore ${VERSION} installed for ${label}
${targets.map((t) => `    ${t.dest}`).join('\n')}
    ${n} files

    lore         reads the codebase, writes .lore/, AGENTS.md and the site
    lore-change  makes changes using .lore/ — "add a field to the first tab of…"

  Start a new Claude Code session, then just talk to it:

    "work out what this codebase does and write it down for you"
    "my agent keeps breaking the approval flow — map the business rules"

  No command needed; plain conversation triggers it. /lore also works.
  lore is read-only: it writes .lore/ and AGENTS.md and changes nothing else.
${project ? '\n  Commit .claude/skills/ so everyone who clones this repo gets them.\n' : ''}`);
