import pathlib
import re
import sys
import urllib.request


URL = "https://docs.neynar.com/docs/mini-app-virality-guide"
OUT_DIR = pathlib.Path("downloads")
OUT_FILE = OUT_DIR / "neynar-mini-app-virality.html"


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=60) as resp:
        return resp.read()


def extract_meta(html: str) -> dict:
    def rx(pattern):
        return re.search(pattern, html, re.IGNORECASE | re.DOTALL)

    def grp(m):
        return (m.group(1).strip() if m else "")

    title = grp(rx(r"<title>(.*?)</title>"))
    og_title = grp(rx(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']'))
    og_desc = grp(rx(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']'))
    desc = grp(rx(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']'))

    return {
        "title": title,
        "og_title": og_title,
        "og_description": og_desc,
        "description": desc,
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    content = fetch(URL)
    OUT_FILE.write_bytes(content)
    meta = extract_meta(content.decode("utf-8", "ignore"))
    print("saved:", str(OUT_FILE))
    for k, v in meta.items():
        print(f"{k}: {v}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("error:", e, file=sys.stderr)
        sys.exit(1)

