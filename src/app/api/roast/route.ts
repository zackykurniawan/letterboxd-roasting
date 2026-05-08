import { NextResponse } from "next/server";
import { generateRoasting } from "@/lib/gemini";
import type { LetterboxdData } from "@/lib/types";

// ── In-memory rate limiting (10 req / IP / minute) ────────────────────────
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (entry.count >= 10) return true;

  entry.count++;
  return false;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,30}$/;

export async function POST(request: Request) {
  // Rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak request. Coba lagi dalam 1 menit." },
      { status: 429 }
    );
  }

  // Parse body
  let username: string;
  try {
    const body = await request.json();
    username = body.username?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Request body tidak valid" }, { status: 400 });
  }

  // Validate username
  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username hanya boleh huruf, angka, dan underscore (max 30 karakter)",
      },
      { status: 400 }
    );
  }

  try {
    // ── Step 1: Scrape Letterboxd ────────────────────────────────────────
    // Derive host from the request itself so it works on any port
    const requestUrl = new URL(request.url);
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `${requestUrl.protocol}//${requestUrl.host}`;

    const scrapeController = new AbortController();
    const scrapeTimeout = setTimeout(() => scrapeController.abort(), 60_000); // 60s for scraping

    let userData: LetterboxdData;
    try {
      const scrapeRes = await fetch(
        `${baseUrl}/api/scrape?username=${encodeURIComponent(username)}`,
        { signal: scrapeController.signal, cache: "no-store" }
      );
      clearTimeout(scrapeTimeout);

      if (!scrapeRes.ok) {
        const errData = await scrapeRes.json().catch(() => ({ error: "Scrape gagal" }));
        return NextResponse.json(
          { error: errData.error || "Gagal mengambil data dari Letterboxd" },
          { status: scrapeRes.status }
        );
      }

      userData = await scrapeRes.json();
    } catch (err: unknown) {
      clearTimeout(scrapeTimeout);
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { error: "Scraper timeout — Letterboxd mungkin sedang lambat" },
          { status: 503 }
        );
      }
      throw err;
    }

    // ── Step 2: Generate roasting via Gemini ─────────────────────────────
    const roastingController = new AbortController();
    const roastTimeout = setTimeout(() => roastingController.abort(), 45_000);

    let roasting: string;
    try {
      roasting = await generateRoasting(userData);
      clearTimeout(roastTimeout);
      // Tidak dipotong — tampilkan teks roasting lengkap
    } catch (err: unknown) {
      clearTimeout(roastTimeout);
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { error: "Gemini AI timeout — coba lagi" },
          { status: 503 }
        );
      }
      throw err;
    }

    return NextResponse.json({ roasting, userData });
  } catch (err: unknown) {
    console.error("[roast] Error:", err);
    return NextResponse.json(
      { error: "Terjadi error internal, coba lagi" },
      { status: 500 }
    );
  }
}
