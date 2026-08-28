#!/usr/bin/env python3
"""
build.py -- render every NFHS football signal as its own stick-figure SVG.

    python3 build.py                  # writes ./svg/01-ball-ready-for-play.svg ...
    python3 build.py --out mysvgs     # somewhere else
    python3 build.py --no-caption     # figure and number only
    python3 build.py --plain          # figure only, no number, no caption
    python3 build.py --only 38 39 40  # just those signals
    python3 build.py --zip            # also write nfhs-stick-signals.zip
    python3 build.py --sheet          # also write contact-sheet.html

Requires nothing but the Python standard library.
"""

import argparse
import os
import re
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stickfig import render                      # noqa: E402
from signals import SIGNALS                      # noqa: E402


def slug(text):
    s = text.lower()
    s = s.replace("/", " ").replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def build(outdir="svg", caption=True, number=True, only=None):
    os.makedirs(outdir, exist_ok=True)
    written = []
    for sig in SIGNALS:
        if only and sig["n"] not in only:
            continue
        svg = render(sig["n"], sig["name"], sig["pose"],
                     also=sig.get("also"), motion=sig.get("motion"),
                     show_caption=caption, show_number=number)
        path = os.path.join(outdir, "%02d-%s.svg" % (sig["n"], slug(sig["name"])))
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(svg)
        written.append(path)
    return written


def contact_sheet(paths, outfile="contact-sheet.html"):
    cells = "\n".join(
        '<figure><img src="%s" alt=""></figure>' % os.path.relpath(p, os.path.dirname(outfile) or ".")
        for p in paths)
    html = """<!doctype html>
<meta charset="utf-8"><title>NFHS stick-figure signals</title>
<style>
 body{font:16px/1.4 system-ui,sans-serif;margin:24px;background:#fafafa;color:#14171a}
 h1{font-size:20px;margin:0 0 4px}
 p.sub{color:#5f6873;margin:0 0 20px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
 figure{margin:0;background:#fff;border:1px solid #e3e6ea;border-radius:10px;padding:6px}
 img{width:100%%;display:block}
 @media (prefers-color-scheme: dark){
   body{background:#0f1215;color:#eef1f4}
   figure{background:#16191d;border-color:#2c333a}
 }
</style>
<h1>NFHS Official Football Signals &mdash; stick figures</h1>
<p class="sub">2026 chart, all 47 signals.</p>
<div class="grid">
%s
</div>
""" % cells
    with open(outfile, "w", encoding="utf-8") as fh:
        fh.write(html)
    return outfile


def make_zip(paths, zipname, extra=(), root=()):
    with zipfile.ZipFile(zipname, "w", zipfile.ZIP_DEFLATED) as z:
        for p in paths:
            z.write(p, os.path.join("svg", os.path.basename(p)))
        for p in extra:
            if os.path.exists(p):
                z.write(p, os.path.join("tool", os.path.basename(p)))
        for p in root:
            if os.path.exists(p):
                z.write(p, os.path.basename(p))
    return zipname


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="svg")
    ap.add_argument("--no-caption", action="store_true")
    ap.add_argument("--plain", action="store_true",
                    help="no number and no caption")
    ap.add_argument("--only", nargs="*", type=int)
    ap.add_argument("--zip", nargs="?", const="nfhs-stick-signals.zip")
    ap.add_argument("--sheet", nargs="?", const="contact-sheet.html")
    a = ap.parse_args()

    paths = build(a.out,
                  caption=not (a.no_caption or a.plain),
                  number=not a.plain,
                  only=set(a.only) if a.only else None)
    print("wrote %d SVGs to %s/" % (len(paths), a.out))
    if a.sheet:
        print("wrote", contact_sheet(paths, a.sheet))
    if a.zip:
        here = os.path.dirname(os.path.abspath(__file__))
        extra = [os.path.join(here, f)
                 for f in ("stickfig.py", "signals.py", "build.py", "README.md")]
        sheet = a.sheet if a.sheet else "contact-sheet.html"
        print("wrote", make_zip(paths, a.zip, extra, root=[sheet]))


if __name__ == "__main__":
    main()
