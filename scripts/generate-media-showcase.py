#!/usr/bin/env python3
"""Generate public-safe No Plex Zone library showcase data from Tautulli.

Required environment variables:
  TAUTULLI_URL      e.g. http://tautulli:8181
  TAUTULLI_API_KEY  Tautulli API key; never commit this value.

Output:
  data/media-showcase.json by default.
"""
from __future__ import annotations

import json
import os
import sys
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


def item_title(row: dict) -> str:
    if row.get("grandparent_title"):
        return str(row["grandparent_title"])
    return str(row.get("title") or "Untitled")


def item_year(row: dict) -> str:
    year = row.get("year")
    return str(year) if year else ""

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

recent_candidates = []
for library in active_libraries:
    section_id = library.get("section_id")
    if not section_id:
        continue
    media = call("get_library_media_info", section_id=section_id, start=0, length=6, order_column="added_at", order_dir="desc") or {}
    for row in media.get("data", []):
        try:
            added_at = int(row.get("added_at") or 0)
        except ValueError:
            added_at = 0
        recent_candidates.append({
            "title": item_title(row),
            "year": item_year(row),
            "type": "Movie" if row.get("media_type") == "movie" else "Series",
            "library": str(library.get("section_name") or "Library"),
            "added_at": added_at,
        })

seen = set()
recently_added = []
for item in sorted(recent_candidates, key=lambda row: row["added_at"], reverse=True):
    key = (item["title"], item["year"], item["type"])
    if key in seen:
        continue
    seen.add(key)
    item = dict(item)
    if item["added_at"]:
        item["added"] = datetime.fromtimestamp(item["added_at"], timezone.utc).date().isoformat()
    item.pop("added_at", None)
    recently_added.append(item)
    if len(recently_added) >= 6:
        break

home_stats = call("get_home_stats") or []
stats_by_id = {stat.get("stat_id"): stat for stat in home_stats}
popular_rows = []
for stat_id, label in [("popular_movies", "Movie"), ("popular_tv", "Series")]:
    for row in (stats_by_id.get(stat_id, {}) or {}).get("rows", [])[:3]:
        popular_rows.append({
            "title": item_title(row),
            "year": item_year(row),
            "type": label,
            "plays": int(row.get("total_plays") or 0),
        })

payload = {
    "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "source": "Tautulli",
    "stats": library_stats,
    "recently_added": recently_added,
    "popular": popular_rows[:6],
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT} with {len(library_stats)} stats, {len(recently_added)} recent items, {len(popular_rows[:6])} popular items")
