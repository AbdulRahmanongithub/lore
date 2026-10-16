#!/usr/bin/env sh
# lore installer — macOS / Linux
#
#   curl -fsSL https://raw.githubusercontent.com/AbdulRahmanongithub/lore/main/install.sh | sh
#   curl -fsSL .../install.sh | sh -s -- --project
#
# Writes one directory and nothing else. No profile edits, no sudo, no daemon.
# Read the script before piping it to a shell — you should do that with any
# install script, including this one.

set -eu

REPO="${LORE_REPO:-AbdulRahmanongithub/lore}"
REF="${LORE_REF:-main}"
MODE="user"

for arg in "$@"; do
  case "$arg" in
    --project|-p) MODE="project" ;;
    --help|-h)
      echo "usage: install.sh [--project]"
      echo "  default      install to ~/.claude/skills/{lore,lore-change}"
      echo "  --project    install to ./.claude/skills/{lore,lore-change}"
      exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [ "$MODE" = "project" ]; then
  BASE="$(pwd)/.claude/skills"
else
  BASE="$HOME/.claude/skills"
fi

command -v curl >/dev/null 2>&1 || { echo "error: curl is required" >&2; exit 1; }
command -v tar  >/dev/null 2>&1 || { echo "error: tar is required"  >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT INT TERM

echo "  fetching lore from $REPO@$REF"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" \
  | tar -xz -C "$TMP" --strip-components=1 \
  || { echo "error: download failed — check the repo name and that $REF exists" >&2; exit 1; }

SKILLS="$TMP/plugins/lore/skills"
[ -f "$SKILLS/lore/SKILL.md" ] || { echo "error: archive has no SKILL.md at $SKILLS/lore" >&2; exit 1; }

mkdir -p "$BASE"
for SRC in "$SKILLS"/*/; do
  SRC="${SRC%/}"
  NAME="$(basename "$SRC")"
  [ -f "$SRC/SKILL.md" ] || continue
  TARGET="$BASE/$NAME"
  if [ -e "$TARGET" ]; then
    echo "  replacing existing install at $TARGET"
    rm -rf "$TARGET"
  fi
  cp -R "$SRC" "$TARGET"
  echo "  installed $NAME → $TARGET"
done

echo ""
echo "  ✓ lore installed"
echo "    lore         — reads the codebase, writes .lore/ and the site"
echo "    lore-change  — makes changes using .lore/"
echo ""
echo "  Start a new Claude Code session and just talk to it —"
echo "  no command needed. /lore also works."
if [ "$MODE" = "project" ]; then
  echo ""
  echo "  Commit .claude/skills/lore and .claude/skills/lore-change so everyone"
  echo "  who clones this repo gets them."
fi
echo ""
