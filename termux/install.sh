#!/bin/sh
# Install the Termux build of opencode (see TERMUX.md).
# Usage: sh install.sh   (run from the extracted zip directory)
set -eu

PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
HERE="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"

echo "Installing opencode to $PREFIX ..."

mkdir -p "$PREFIX/bin" "$PREFIX/libexec/opencode"

# Wrapper goes on PATH
cp "$HERE/bin/opencode" "$PREFIX/bin/opencode"
chmod 755 "$PREFIX/bin/opencode"

# Binary + native libraries live outside PATH
cp "$HERE/opencode.bin" "$PREFIX/libexec/opencode/opencode.bin"
chmod 755 "$PREFIX/libexec/opencode/opencode.bin"

for so in "$HERE"/libopentui.so "$HERE"/libc++_shared.so; do
  if [ -f "$so" ]; then
    cp "$so" "$PREFIX/libexec/opencode/"
  fi
done

echo
echo "Done. Run: opencode"
echo
echo "Recommended Termux packages for full functionality:"
echo "  pkg install ripgrep git openssh"
echo
echo "Then configure an AI provider, e.g.:"
echo "  export ANTHROPIC_API_KEY=..."
echo "or run: opencode auth login"
