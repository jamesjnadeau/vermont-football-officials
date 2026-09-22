#!/usr/bin/env bash
# Vendors the ContentTools editor (https://github.com/jamesjnadeau/ContentTools)
# into static/cms/, which Eleventy copies to /cms/ on the site.
#
# ContentTools isn't on npm and doesn't commit its dist/, so the build output
# is committed here instead of being rebuilt on every Netlify deploy — that
# would mean cloning the repo and installing its whole toolchain each time.
# Run by hand when you want a newer editor:
#
#     tools/content-tools/vendor.sh            # the ref in static/cms/VERSION
#     tools/content-tools/vendor.sh <ref>      # a branch, tag or commit
#
# Only what the site serves is copied: edit.js (the in-page editor, on every
# page), shell.js (the /admin/ screens), the chunks both import, and the
# content stylesheet and images edit.js links beside itself. The chunk names
# are content-hashed, so static/cms/ is emptied first — copying a new build
# over an old one leaves stale chunks behind.
#
# static/cms/netlify.js and static/cms/boot.js are the site's own glue and are
# kept.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/static/cms"
REPO="https://github.com/jamesjnadeau/ContentTools.git"
REF="${1:-$(cat "$DEST/VERSION")}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git clone --quiet "$REPO" "$WORK/ContentTools"
git -C "$WORK/ContentTools" checkout --quiet "$REF"
SHA="$(git -C "$WORK/ContentTools" rev-parse HEAD)"

(cd "$WORK/ContentTools" && npm ci --ignore-scripts --no-audit --no-fund >/dev/null && npm run build >/dev/null)

DIST="$WORK/ContentTools/dist"
find "$DEST" -mindepth 1 -not -name netlify.js -not -name boot.js -delete
cp "$DIST/edit.js" "$DIST/shell.js" "$DIST/content-tools-content.min.css" "$DEST/"
cp -r "$DIST/chunks" "$DIST/images" "$DEST/"
cp "$WORK/ContentTools/LICENSE" "$DEST/LICENSE"
echo "$SHA" > "$DEST/VERSION"

echo "Vendored ContentTools $SHA into static/cms/"
