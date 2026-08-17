#!/bin/sh
# glazecraft installer — one line:
#   curl -fsSL https://raw.githubusercontent.com/CocoCopi/glazecraft/main/install.sh | sh
#
# Installs Corros (if missing) and glazecraft, then puts the `glazecraft`
# command on your PATH. POSIX sh on purpose.
set -eu

if [ -n "${PREFIX:-}" ]; then
  prefix="$PREFIX"
elif [ "$(id -u)" = "0" ] && [ -w /usr/local/bin ]; then
  prefix=/usr/local
else
  prefix="$HOME/.local"
fi
bindir="$prefix/bin"
libdir="$prefix/lib/glazecraft"
mkdir -p "$bindir" "$libdir"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if ! command -v corros >/dev/null 2>&1; then
  echo "==> installing Corros..."
  curl -fsSL https://raw.githubusercontent.com/CocoCopi/corros/main/install.sh | sh
  if ! command -v corros >/dev/null 2>&1; then
    echo "glazecraft: corros was installed but is not on PATH" >&2
    exit 1
  fi
fi

echo "==> fetching glazecraft..."
if [ -f src/glaze.cro ]; then
  srcdir="$(pwd)"
else
  if ! git clone --depth 1 https://github.com/CocoCopi/glazecraft.git "$tmp/gc" 2>/dev/null; then
    echo "glazecraft: could not clone the repo" >&2
    exit 1
  fi
  srcdir="$tmp/gc"
fi
cp -r "$srcdir/src" "$libdir/src"
cp -r "$srcdir/examples" "$libdir/examples"
cp -r "$srcdir/tests" "$libdir/tests"
cp -r "$srcdir/web" "$libdir/web"
install -m 0755 "$srcdir/glazecraft" "$libdir/glazecraft"
ln -sf "$libdir/glazecraft" "$bindir/glazecraft"

echo
echo "Installed: $bindir/glazecraft  ->  $libdir"
if [ "$bindir" != /usr/local/bin ] && [ "$bindir" != /usr/bin ]; then
  echo "Add it to your PATH:  export PATH=\"$bindir:\$PATH\""
fi
echo "Try it:  glazecraft render"
echo "And:     glazecraft serve"
