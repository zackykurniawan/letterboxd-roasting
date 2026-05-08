"""
Letterboxd Scraper — Vercel Python Serverless Function
GET /api/scrape?username={username}
"""

import json
import asyncio
import re
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

BASE_URL = "https://letterboxd.com"


def parse_rating_value(rating_str: str) -> float:
    """Convert a star rating string like 'rated-3-5' to 3.5"""
    match = re.search(r"rated-(\d+)(?:-(\d+))?", rating_str)
    if match:
        whole = int(match.group(1))
        half = match.group(2)
        return whole + (0.5 if half else 0)
    return 0.0


async def scrape_user(username: str) -> dict:
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15.0) as client:

        # ── 1. Profile page ──────────────────────────────────────────────
        resp = await client.get(f"{BASE_URL}/{username}/")
        if resp.status_code == 404:
            raise ValueError("User not found")
        if resp.status_code == 403:
            raise PermissionError("Akun ini private")
        if resp.status_code == 429:
            raise ConnectionError("Rate limited")
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")

        # Display name
        display_name_tag = soup.select_one("h1.title-1.person-title span.name") or soup.select_one(".profile-name")
        display_name = display_name_tag.get_text(strip=True) if display_name_tag else username

        # Bio
        bio_tag = soup.select_one(".bio .js-collapsible-text") or soup.select_one(".bio")
        bio = bio_tag.get_text(strip=True) if bio_tag else ""

        # Total films from profile stats
        total_films = 0
        total_reviews = 0
        stat_items = soup.select("ul.stats li a")
        for item in stat_items:
            val_tag = item.select_one("span.value")
            label = item.get_text(strip=True).lower()
            if val_tag:
                val_text = val_tag.get_text(strip=True).replace(",", "").replace("k", "000")
                try:
                    val = int(val_text)
                except ValueError:
                    val = 0
                if "film" in label:
                    total_films = val
                elif "review" in label:
                    total_reviews = val

        await asyncio.sleep(1.5)

        # ── 2. Films page — avg rating ────────────────────────────────────
        resp2 = await client.get(f"{BASE_URL}/{username}/films/")
        soup2 = BeautifulSoup(resp2.text, "lxml")

        avg_rating = 0.0
        avg_tag = soup2.select_one("span.average-rating a") or soup2.select_one(".js-average-rating")
        if avg_tag:
            try:
                avg_rating = float(avg_tag.get_text(strip=True))
            except ValueError:
                avg_rating = 0.0

        # Also try to get total films count from this page if not found
        if total_films == 0:
            count_tag = soup2.select_one("span.js-sort-item-count") or soup2.select_one(".filmlist-count")
            if count_tag:
                try:
                    total_films = int(count_tag.get_text(strip=True).replace(",", ""))
                except ValueError:
                    pass

        await asyncio.sleep(1.5)

        # ── 3. Ratings distribution ───────────────────────────────────────
        resp3 = await client.get(f"{BASE_URL}/{username}/films/ratings/")
        soup3 = BeautifulSoup(resp3.text, "lxml")

        ratings_distribution: dict[str, int] = {
            "0.5": 0, "1.0": 0, "1.5": 0, "2.0": 0, "2.5": 0,
            "3.0": 0, "3.5": 0, "4.0": 0, "4.5": 0, "5.0": 0,
        }

        # Letterboxd renders histogram as sections with data-rating attributes
        for bar in soup3.select("li[class*='rating-histogram'] a"):
            href = bar.get("href", "")
            title_attr = bar.get("title", "")
            count_match = re.search(r"(\d+)\s+film", title_attr)
            rating_match = re.search(r"/(\d+)(?:/|$)", href.replace("/2/", "/"))

            # Try class-based extraction
            cls = " ".join(bar.get("class", []))
            cls_match = re.search(r"rated-(\d+)(?:-(\d+))?", cls)
            if cls_match:
                whole = int(cls_match.group(1))
                half = cls_match.group(2)
                star = whole + (0.5 if half else 0)
                key = f"{star:.1f}"
                if count_match and key in ratings_distribution:
                    ratings_distribution[key] = int(count_match.group(1))

        # Fallback: try film entries if histogram not found
        film_items = soup3.select("li.poster-container")
        for item in film_items:
            rating_div = item.select_one("[class*='rated-']")
            if rating_div:
                cls = " ".join(rating_div.get("class", []))
                star = parse_rating_value(cls)
                if star > 0:
                    key = f"{star:.1f}"
                    if key in ratings_distribution:
                        ratings_distribution[key] += 1

        # Get recent films (last 5) + highest/lowest rated from this page
        recent_films = []
        all_rated_films = []

        for item in film_items[:50]:  # sample first 50
            title_tag = item.select_one("img[alt]")
            title = title_tag.get("alt", "Unknown") if title_tag else "Unknown"
            year_tag = item.select_one("[data-film-release-year]") or item.select_one(".film-title .metadata")
            try:
                year = int(item.select_one("div[data-film-release-year]")["data-film-release-year"]) if item.select_one("div[data-film-release-year]") else 0
            except (TypeError, ValueError, KeyError):
                year = 0

            rating_div = item.select_one("[class*='rated-']")
            rating = 0.0
            if rating_div:
                cls = " ".join(rating_div.get("class", []))
                rating = parse_rating_value(cls)

            if title:
                all_rated_films.append({"title": title, "year": year, "rating": rating})

        recent_films = all_rated_films[:5]
        rated_only = [f for f in all_rated_films if f["rating"] > 0]
        highest_rated = sorted(rated_only, key=lambda x: x["rating"], reverse=True)[:3]
        lowest_rated = sorted(rated_only, key=lambda x: x["rating"])[:3]

        await asyncio.sleep(1.5)

        # ── 4. Genre ──────────────────────────────────────────────────────
        resp4 = await client.get(f"{BASE_URL}/{username}/films/genre/")
        soup4 = BeautifulSoup(resp4.text, "lxml")

        top_genres: list[str] = []
        for tag in soup4.select("section.section a.big-button"):
            genre_text = tag.get_text(strip=True)
            if genre_text:
                top_genres.append(genre_text)
            if len(top_genres) >= 5:
                break

        # Fallback: links inside genre histogram/list
        if not top_genres:
            for tag in soup4.select("a[href*='/genre/']"):
                genre = tag.get_text(strip=True)
                if genre and genre not in top_genres:
                    top_genres.append(genre)
                if len(top_genres) >= 5:
                    break

        await asyncio.sleep(1.5)

        # ── 5. Decade ─────────────────────────────────────────────────────
        resp5 = await client.get(f"{BASE_URL}/{username}/films/decade/")
        soup5 = BeautifulSoup(resp5.text, "lxml")

        favorite_decade = ""
        for tag in soup5.select("section.section a.big-button, a[href*='/decade/']"):
            text = tag.get_text(strip=True)
            if re.match(r"\d{4}s?", text):
                favorite_decade = text if text.endswith("s") else text + "s"
                break

        await asyncio.sleep(1.5)

        # ── 6. Country ────────────────────────────────────────────────────
        resp6 = await client.get(f"{BASE_URL}/{username}/films/country/")
        soup6 = BeautifulSoup(resp6.text, "lxml")

        favorite_country = ""
        for tag in soup6.select("section.section a.big-button, a[href*='/country/']"):
            country = tag.get_text(strip=True)
            if country:
                favorite_country = country
                break

        return {
            "username": username,
            "display_name": display_name,
            "bio": bio,
            "total_films": total_films,
            "avg_rating": avg_rating,
            "ratings_distribution": ratings_distribution,
            "top_genres": top_genres,
            "favorite_decade": favorite_decade,
            "favorite_country": favorite_country,
            "total_reviews": total_reviews,
            "recent_films": recent_films,
            "highest_rated_films": highest_rated,
            "lowest_rated_films": lowest_rated,
        }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        username = params.get("username", [None])[0]

        if not username:
            self._send_json({"error": "Username required"}, 400)
            return

        try:
            data = asyncio.run(scrape_user(username))
            self._send_json(data, 200)
        except ValueError as e:
            self._send_json({"error": str(e)}, 404)
        except PermissionError as e:
            self._send_json({"error": str(e)}, 403)
        except ConnectionError as e:
            self._send_json({"error": str(e)}, 429)
        except httpx.TimeoutException:
            self._send_json({"error": "Letterboxd timeout, coba lagi"}, 503)
        except Exception as e:
            self._send_json({"error": f"Scraper error: {str(e)}"}, 500)

    def _send_json(self, data: dict, status: int):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
