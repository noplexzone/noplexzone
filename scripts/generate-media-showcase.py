#!/usr/bin/env python3
"""Generate public-safe No Plex Zone aggregate library stats from Tautulli.

Required environment variables:
  TAUTULLI_URL      e.g. http://tautulli:8181
  TAUTULLI_API_KEY  Tautulli API key; never commit this value.

Output:
  data/media-showcase.json by default.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

TAUTULLI_URL = os.environ.get("TAUTULLI_URL", "").rstrip("/")
TAUTULLI_API_KEY = os.environ.get("TAUTULLI_API_KEY", "")
OUTPUT = Path(os.environ.get("MEDIA_SHOWCASE_OUTPUT", "data/media-showcase.json"))

if not TAUTULLI_URL or not TAUTULLI_API_KEY:
    raise SystemExit("TAUTULLI_URL and TAUTULLI_API_KEY are required")


def call(cmd: str, **params):
    query = {"apikey": TAUTULLI_API_KEY, "cmd": cmd, **params}
    with urlopen(f"{TAUTULLI_URL}/api/v2?{urlencode(query)}", timeout=30) as response:
        payload = json.load(response)
    response = payload.get("response", {})
    if response.get("result") != "success":
        raise RuntimeError(f"Tautulli command failed: {cmd}: {response}")
    return response.get("data")


libraries = call("get_libraries") or []
active_libraries = [library for library in libraries if int(library.get("is_active") or 0) == 1]

movie_count = sum(int(l.get("count") or 0) for l in active_libraries if l.get("section_type") == "movie")
show_libraries = [l for l in active_libraries if l.get("section_type") == "show"]
show_count = sum(int(l.get("count") or 0) for l in show_libraries)
anime_count = sum(int(l.get("count") or 0) for l in show_libraries if "anime" in str(l.get("section_name", "")).lower())

library_stats = [
    {"label": "Movies", "value": movie_count, "detail": "including 4K titles"},
    {"label": "Series", "value": show_count, "detail": "TV, anime, sports, and extras"},
    {"label": "Anime", "value": anime_count, "detail": "dedicated anime library"},
]

payload = {
    "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "source": "Tautulli",
    "stats": library_stats,
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT} with {len(library_stats)} aggregate stats")
