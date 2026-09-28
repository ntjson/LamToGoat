"""Check that fonts cover every Vietnamese letter plus the symbols the film uses.

Usage: uv run --with fonttools python tools/check_font_vi.py FONT [FONT ...]
"""
import sys
import unicodedata
from fontTools.ttLib import TTFont

BASES = "aăâeêioôơuưyAĂÂEÊIOÔƠUƯY"
TONES = ["", "̀", "́", "̉", "̃", "̣"]  # huyền sắc hỏi ngã nặng
LETTERS = {unicodedata.normalize("NFC", b + t) for b in BASES for t in TONES} | set("đĐ")
SYMBOLS = set("0123456789.,:;!?%/–—…·→≠≥≤+−-()\"'“”‘’₫@") | set(TONES[1:])

def check(path):
    cmap = TTFont(path).getBestCmap()
    missing_l = sorted(c for c in LETTERS if ord(c) not in cmap)
    missing_s = sorted(c for c in SYMBOLS if ord(c) not in cmap)
    ok = not missing_l
    print(f"{'OK ' if ok else 'BAD'} {path.split('/')[-1]:44s} letters {len(LETTERS)-len(missing_l)}/{len(LETTERS)}"
          + (f" missing letters: {''.join(missing_l)}" if missing_l else "")
          + (f" | missing symbols: {' '.join(repr(c) for c in missing_s)}" if missing_s else ""))
    return ok

if __name__ == "__main__":
    results = [check(p) for p in sys.argv[1:]]
    sys.exit(0 if all(results) else 1)
