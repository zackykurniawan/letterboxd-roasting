import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { FilmEntry, ReviewEntry } from "@/lib/types";

const BASE = "https://letterboxd.com";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchHtml(url: string, retries = 3): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": randomUA(),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      DNT: "1",
      "Sec-CH-UA": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      Referer: "https://letterboxd.com/",
    },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });

  if (res.status === 404) throw Object.assign(new Error("User not found"), { status: 404 });
  // Retry on 401 (WAF challenge), 403 (blocked), 429 (rate limited)
  if (res.status === 401 || res.status === 403 || res.status === 429) {
    if (retries > 0) {
      await delay(2000 + Math.random() * 2000);
      return fetchHtml(url, retries - 1);
    }
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  }
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return res.text();
}

async function fetchRss(username: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/${username}/rss/`, {
      headers: {
        "User-Agent": randomUA(),
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Referer: "https://letterboxd.com/",
      },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!res.ok) return "";
    return res.text();
  } catch {
    return "";
  }
}

function parseRating(cls: string): number {
  const m = cls.match(/rated-(\d+)(?:-(\d+))?/);
  if (!m) return 0;
  return parseInt(m[1]) + (m[2] ? 0.5 : 0);
}

// Ekstrak film ID dari JSON data-postered-identifier Letterboxd
// Format: {"lid":"OFpg","uid":"film:1207557",...}
function filmIdFromIdentifier(raw: string): string {
  if (!raw) return "";
  try {
    const json = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&#034;/g, '"'));
    return (json.uid as string || "").replace("film:", "");
  } catch {
    return "";
  }
}

// Parse rating dari teks bintang SVG aria-label, misalnya "★★★★" → 4, "★★★½" → 3.5
function parseStarsFromText(text: string): number {
  const full = (text.match(/★/g) || []).length;
  const half = text.includes("½") ? 0.5 : 0;
  return full + half;
}

// Konstruksi URL poster Letterboxd dari film ID + slug + cache key
// Format: https://a.ltrbxd.com/resized/film-poster/{dirs}/{id}-{slug}-{size}-crop.jpg?v={key}
function buildLetterboxdPoster(
  filmId: string,
  slug: string,
  size = "0-600-0-900",
  cacheKey = ""
): string {
  if (!filmId || !slug) return "";
  const dirs = filmId.split("").join("/");
  const base = `https://a.ltrbxd.com/resized/film-poster/${dirs}/${filmId}-${slug}-${size}-crop.jpg`;
  return cacheKey ? `${base}?v=${cacheKey}` : base;
}

// Parse cacheBustingKey dari data-resolvable-poster-path JSON
function parseCacheKey(raw: string): string {
  if (!raw) return "";
  try {
    const json = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&#034;/g, '"'));
    return (json.cacheBustingKey as string) || "";
  } catch {
    return "";
  }
}

// Ambil poster dari LazyPoster react-component (pola HTML Letterboxd terbaru)
function extractPosterFromLazyPoster(
  $: ReturnType<typeof cheerio.load>,
  el: Element
): string {
  const reactDiv = $(el).find("[data-component-class='LazyPoster'], .react-component").first();

  const slug = reactDiv.attr("data-item-slug") || "";
  const identifierRaw = reactDiv.attr("data-postered-identifier") || "";
  const resolvableRaw = reactDiv.attr("data-resolvable-poster-path") || "";

  const filmId = filmIdFromIdentifier(identifierRaw);
  const cacheKey = parseCacheKey(resolvableRaw);

  // Jika punya film ID + slug + cache key → URL paling reliable
  if (filmId && slug && cacheKey) return buildLetterboxdPoster(filmId, slug, "0-600-0-900", cacheKey);
  // Fallback tanpa cache key (mungkin masih work di beberapa film)
  if (filmId && slug) return buildLetterboxdPoster(filmId, slug);

  return "";
}



// Hitung avg rating dari distribusi
function calcAvgRating(dist: Record<string, number>): number {
  let totalCount = 0;
  let totalScore = 0;
  for (const [key, count] of Object.entries(dist)) {
    const rating = parseFloat(key);
    totalCount += count;
    totalScore += rating * count;
  }
  if (totalCount === 0) return 0;
  return Math.round((totalScore / totalCount) * 100) / 100;
}

function parseRssFilms(xml: string): FilmEntry[] {
  const films: FilmEntry[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const titleMatch = item.match(/<letterboxd:filmTitle>(.*?)<\/letterboxd:filmTitle>/);
    const yearMatch = item.match(/<letterboxd:filmYear>(\d+)<\/letterboxd:filmYear>/);
    const ratingMatch = item.match(/<letterboxd:memberRating>([\d.]+)<\/letterboxd:memberRating>/);

    // Coba ambil poster dari <description> - Letterboxd menyertakan <img> di sana
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
    let poster = "";
    if (descMatch) {
      const imgMatch = descMatch[1].match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch && !imgMatch[1].includes("empty-poster")) {
        poster = imgMatch[1].replace("-0-150-0-225-crop", "-0-600-0-900-crop");
      }
    }

    if (!titleMatch) continue;
    films.push({
      title: titleMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1"),
      year: yearMatch ? parseInt(yearMatch[1]) : 0,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
      poster,
    });
  }
  return films;
}

// Parse article.production-viewing (struktur HTML Letterboxd terbaru untuk review)
function parseProductionViewing(
  $: ReturnType<typeof cheerio.load>,
  el: Element
): ReviewEntry | null {
  const $el = $(el);

  // Poster via LazyPoster component
  const poster = extractPosterFromLazyPoster($, el);

  // Title: h2.primaryname a
  const title = $el.find(".primaryname a, h2.primaryname a").first().text().trim();
  if (!title) return null;

  // Year: span.releasedate a (text "2026")
  const yearText = $el.find("span.releasedate a").first().text().trim();
  const year = parseInt(yearText) || 0;

  // Rating: dari SVG aria-label "★★★★" atau title SVG
  const svgAriaLabel =
    $el.find("svg.glyph.-rating").attr("aria-label") ||
    $el.find("svg[aria-label]").attr("aria-label") ||
    $el.find("svg title").first().text() ||
    "";
  const rating = parseStarsFromText(svgAriaLabel);

  // Review text
  const review = $el.find(".body-text p, .-prose p").first().text().trim();

  return { title, year, rating, review, poster };
}

// Cari review section berdasarkan teks heading (bukan class — lebih robust)
function parseReviewsByHeading(
  $: ReturnType<typeof cheerio.load>,
  headingKeyword: string
): ReviewEntry[] {
  const reviews: ReviewEntry[] = [];

  $("section").each((_, section) => {
    const headingText = $(section).find("h2, h3").first().text().trim().toLowerCase();
    if (!headingText.includes(headingKeyword)) return;

    // Letterboxd terbaru: article.production-viewing di dalam div.listitem
    $(section).find("article.production-viewing").each((_, item) => {
      const entry = parseProductionViewing($, item);
      if (entry) reviews.push(entry);
    });

    // Fallback: li.film-detail (format lama)
    if (reviews.length === 0) {
      $(section).find("li.film-detail").each((_, item) => {
        const entry = parseProductionViewing($, item);
        if (entry) reviews.push(entry);
      });
    }

    return false; // stop setelah section pertama yang cocok
  });

  return reviews;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    // ── 1. Profil + RSS paralel ──────────────────────────────────────────
    const [profileHtml, rssXml] = await Promise.all([
      fetchHtml(`${BASE}/${username}/`),
      fetchRss(username),
    ]);

    const $p = cheerio.load(profileHtml);

    // ── Display name ─────────────────────────────────────────────────────
    // Prioritaskan h1 dari halaman profil (lebih bersih, tanpa "'s profile")
    let displayName =
      $p("h1.title-1 .name").first().text().trim() ||
      $p("h1.title-1").first().text().trim() ||
      $p(".profile-name .name").first().text().trim() ||
      username;

    // Fallback ke OG title jika h1 tidak ada, dengan cleanup agresif
    if (displayName === username) {
      const ogTitle = $p("meta[property='og:title']").attr("content") || "";
      displayName = ogTitle
        .replace(/\s*[•·]\s*Letterboxd\s*$/i, "")
        .replace(/[\u2018\u2019'`]s\s+profile\s*$/i, "")
        .replace(/\s+profile\s*$/i, "")
        .trim() || username;
    }

    // ── Bio ──────────────────────────────────────────────────────────────
    const bio =
      $p(".bio .js-collapsible-text").text().trim() ||
      $p(".bio").text().trim() ||
      "";

    // ── Stats ────────────────────────────────────────────────────────────
    let totalFilms = 0;
    $p("ul.stats li a").each((_, el) => {
      const valRaw = $p(el).find("span.value").text().replace(/,/g, "").trim();
      const val = parseInt(valRaw) || 0;
      const label = $p(el).text().toLowerCase();
      if (label.includes("film")) totalFilms = val;
    });

    const ogDesc = $p("meta[property='og:description']").attr("content") || "";
    if (totalFilms === 0) {
      const m = ogDesc.match(/([\d,]+)\s+films?\s+watched/i);
      if (m) totalFilms = parseInt(m[1].replace(/,/g, ""));
    }

    // ── Distribusi rating → avg_rating ───────────────────────────────────
    const ratingsDistribution: Record<string, number> = {
      "0.5": 0, "1.0": 0, "1.5": 0, "2.0": 0, "2.5": 0,
      "3.0": 0, "3.5": 0, "4.0": 0, "4.5": 0, "5.0": 0,
    };
    $p("a[href*='/ratings/rated/']").each((_, el) => {
      const href = $p(el).attr("href") || "";
      const text = $p(el).text().replace(/,/g, "").trim();
      const ratingEncoded = href.match(/rated\/([^/]+)\//)?.[1];
      if (!ratingEncoded) return;
      const decoded = decodeURIComponent(ratingEncoded);
      const fullMatch = decoded.match(/^(\d+)/);
      if (!fullMatch) return;
      const full = parseInt(fullMatch[1]);
      const half = decoded.includes("½") ? 0.5 : 0;
      const starKey = (full + half).toFixed(1);
      const countMatch = text.match(/^([\d,]+)/);
      if (countMatch && starKey in ratingsDistribution) {
        ratingsDistribution[starKey] = parseInt(countMatch[1].replace(/,/g, ""));
      }
    });
    const avgRating = calcAvgRating(ratingsDistribution);

    // ── Film favorit ────────────────────────────────────────────────────
    // Letterboxd baru: cari LazyPoster components di section favorit
    const favoriteFilms: FilmEntry[] = [];

    // Cari semua LazyPoster di dalam section favorit
    $p("section.js-favourite-films [data-component-class='LazyPoster'], .js-favourite-films [data-component-class='LazyPoster'], #favourites [data-component-class='LazyPoster']").each((_, el) => {
      if (favoriteFilms.length >= 4) return;
      const slug = $p(el).attr("data-item-slug") || "";
      const identifierRaw = $p(el).attr("data-postered-identifier") || "";
      const filmId = filmIdFromIdentifier(identifierRaw);
      const poster = filmId && slug ? buildLetterboxdPoster(filmId, slug) : "";

      // Judul dari img alt atau data-item-name
      const itemName = $p(el).attr("data-item-name") || ""; // "The Dark Knight (2008)"
      const title = $p(el).find("img").attr("alt") ||
        itemName.replace(/\s*\(\d{4}\)\s*$/, "").trim() || slug.replace(/-/g, " ");
      const yearMatch = itemName.match(/\((\d{4})\)/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;

      if (title) favoriteFilms.push({ title, year, rating: 0, poster });
    });


    // Fallback: judul dari OG description, coba dapatkan poster via film slug
    if (favoriteFilms.length === 0) {
      const favMatch = ogDesc.match(/Favorites?:\s*(.+?)(?:\.|$)/i);
      if (favMatch) {
        favMatch[1].split(",").slice(0, 4).forEach((raw) => {
          const clean = raw.trim().replace(/\s*\(\d{4}\)\s*$/, "");
          const yr = raw.match(/\((\d{4})\)/)?.[1];
          if (clean) {
            // Cari data-film-id di halaman berdasarkan alt text yang cocok
            let poster = "";
            $p("img").each((_, img) => {
              if ($p(img).attr("alt")?.toLowerCase() === clean.toLowerCase()) {
                const parentDiv = $p(img).closest("[data-film-id]");
                const id = parentDiv.attr("data-film-id") || "";
                const slug = parentDiv.attr("data-film-slug") || "";
                if (id && slug) { poster = buildLetterboxdPoster(id, slug); return false; }
              }
            });
            favoriteFilms.push({ title: clean, year: yr ? parseInt(yr) : 0, rating: 0, poster });
          }
        });
      }
    }

    // ── Review terbaru & populer — cari berdasarkan heading text ─────────
    const recentReviews = parseReviewsByHeading($p, "recent review").slice(0, 3);
    const popularReviews = parseReviewsByHeading($p, "popular review").slice(0, 3);

    // ── Halaman /films/ untuk genre, decade, avg rating fallback ──────────
    let topGenres: string[] = [];
    let favoriteDecade = "";

    await delay(600 + Math.random() * 600);
    const filmsHtml = await fetchHtml(`${BASE}/${username}/films/`).catch(() => "");
    if (filmsHtml) {
      const $f = cheerio.load(filmsHtml);

      // Avg rating (lebih akurat dari halaman films)
      const avgText =
        $f("span.average-rating a").text().trim() ||
        $f(".js-average-rating").text().trim() ||
        $f("[data-average-rating]").attr("data-average-rating") || "";
      // Gunakan avg dari distribusi jika ada, fallback ke halaman films
      if (avgRating === 0 && avgText) {
        // akan di-override nanti
      }

      $f("a[href*='/genre/']").each((_, el) => {
        const genre = $f(el).text().trim();
        if (genre && genre.length > 1 && !topGenres.includes(genre) && topGenres.length < 5) {
          topGenres.push(genre);
        }
      });
      $f("a[href*='/decade/']").each((_, el) => {
        const text = $f(el).text().trim();
        if (/^\d{4}s?$/.test(text) && !favoriteDecade) {
          favoriteDecade = text.endsWith("s") ? text : text + "s";
        }
      });
      if (totalFilms === 0) {
        const countText = $f("span.js-sort-item-count").text().replace(/,/g, "").trim();
        if (countText) totalFilms = parseInt(countText) || 0;
      }
    }

    // ── RSS: recent films ─────────────────────────────────────────────────
    const rssFilms = parseRssFilms(rssXml);
    const recentFilms = rssFilms.slice(0, 4);
    const ratedOnly = rssFilms.filter((f) => f.rating > 0);
    // highest & lowest tanpa poster (tidak diperlukan di UI)
    const highestRated = [...ratedOnly]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map(({ title, year, rating }) => ({ title, year, rating }));
    const lowestRated = [...ratedOnly]
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 3)
      .map(({ title, year, rating }) => ({ title, year, rating }));

    return NextResponse.json({
      username,
      display_name: displayName,
      bio,
      total_films: totalFilms,
      avg_rating: avgRating,
      top_genres: topGenres,
      favorite_decade: favoriteDecade,
      recent_films: recentFilms,
      favorite_films: favoriteFilms.slice(0, 4),
      highest_rated_films: highestRated,
      lowest_rated_films: lowestRated,
      recent_reviews: recentReviews,
      popular_reviews: popularReviews,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    const status = e.status ?? 500;
    const message =
      status === 404
        ? "User tidak ditemukan di Letterboxd"
        : status === 403
        ? "Letterboxd memblokir request — coba lagi dalam beberapa detik"
        : status === 429
        ? "Letterboxd rate limiting, coba lagi sebentar"
        : e.message || "Gagal scrape Letterboxd";
    return NextResponse.json({ error: message }, { status });
  }
}
