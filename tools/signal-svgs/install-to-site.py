#!/usr/bin/env python3
"""Copy the built signal SVGs into the site, light-only.

`build.py` writes drawings that adapt to a dark background. The site has no
dark mode — every page is a white page — so a viewer whose OS is set to dark
would get inverted drawings on it. This strips the dark-mode block on the way
in, leaving the light colours the SVGs already carry as attributes.

    python3 tools/signal-svgs/install-to-site.py

Run it from the repository root after rebuilding, then commit what changed.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = pathlib.Path(__file__).resolve().parent / "svg"
DST = ROOT / "static" / "images" / "official-signals"

DARK = re.compile(r"\n?  @media \(prefers-color-scheme: dark\) \{.*?\n  \}", re.S)
SCHEME = re.compile(r"\n?  :root \{ color-scheme: light dark; \}")


def main() -> int:
    if not SRC.is_dir():
        print(f"no {SRC} — run `python3 build.py` in {SRC.parent} first", file=sys.stderr)
        return 1
    DST.mkdir(parents=True, exist_ok=True)
    written = 0
    for svg in sorted(SRC.glob("*.svg")):
        out = DARK.sub("", SCHEME.sub("", svg.read_text(encoding="utf-8")))
        if "color-scheme" in out:
            print(f"{svg.name}: dark-mode block not recognised", file=sys.stderr)
            return 1
        (DST / svg.name).write_text(out, encoding="utf-8")
        written += 1
    print(f"{written} drawings -> {DST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
