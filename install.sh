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
      echo "  default      install to ~/.claude/skills/lore"
      echo "  --project    install to ./.claude/skills/lore"
      exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [ "$MODE" = "project" ]; then
  TARGET="$(pwd)/.claude/skills/lore"
else
  TARGET="$HOME/.claude/skills/lore"
fi

command -v curl >/dev/null 2>&1 || { echo "error: curl is required" >&2; exit 1; }
command -v tar  >/dev/null 2>&1 || { echo "error: tar is required"  >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT INT TERM

echo "  fetching lore from $REPO@$REF"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" \
  | tar -xz -C "$TMP" --strip-components=1 \
  || { echo "error: download failed — check the repo name and that $REF exists" >&2; exit 1; }

SRC="$TMP/plugins/lore/skills/lore"
[ -f "$SRC/SKILL.md" ] || { echo "error: archive has no SKILL.md at $SRC" >&2; exit 1; }

if [ -e "$TARGET" ]; then
  echo "  replacing existing install at $TARGET"
  rm -rf "$TARGET"
fi

mkdir -p "$(dirname "$TARGET")"
cp -R "$SRC" "$TARGET"

echo ""
echo "  ✓ lore installed"
echo "    $TARGET"
echo ""
echo "  Start a new Claude Code session and just talk to it —"
echo "  no command needed. /lore also works."
if [ "$MODE" = "project" ]; then
  echo ""
  echo "  Commit .claude/skills/lore so everyone who clones this repo gets it."
fi
echo ""
