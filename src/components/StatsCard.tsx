"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { LetterboxdData, FilmEntry, ReviewEntry } from "@/lib/types";

// ── Star rating display ──────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-xs tracking-wider">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const half = !filled && i + 1 === Math.ceil(rating) && rating % 1 !== 0;
        return (
          <span key={i} className="relative inline-block">
            <span style={{ color: "#3A3A5A" }}>★</span>
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? "50%" : "100%", color: "#F7C948" }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// ── Stats row ────────────────────────────────────────────────────────────────
function StatRow({ icon, label, value, delay }: { icon: string; label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-start gap-3 py-2.5 border-b last:border-b-0"
      style={{ borderColor: "#2A2A3E" }}
    >
      <span className="text-base w-5 shrink-0 mt-0.5">{icon}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5A5A7A" }}>
          {label}
        </span>
        <span className="text-sm font-medium" style={{ color: "#E0E0F0", fontFamily: "var(--font-inter)" }}>
          {value}
        </span>
      </div>
    </motion.div>
  );
}

// ── PosterItem — handles onError fallback per-film ───────────────────────────
function PosterItem({ film }: { film: FilmEntry }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div
        className="relative w-full rounded-md overflow-hidden"
        style={{ aspectRatio: "2/3", background: "#1E1E30" }}
      >
        {film.poster && !failed ? (
          <Image
            src={film.poster}
            alt={film.title}
            fill
            className="object-cover"
            unoptimized
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
            <span className="text-base mb-0.5">🎬</span>
            <span className="text-[8px] leading-tight line-clamp-3" style={{ color: "#5A5A7A" }}>
              {film.title}
            </span>
          </div>
        )}
        {film.rating > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 px-1 py-0.5 flex gap-0.5 flex-wrap"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
          >
            {Array.from({ length: Math.floor(film.rating) }).map((_, si) => (
              <span key={si} className="text-[7px]" style={{ color: "#F7C948" }}>★</span>
            ))}
            {film.rating % 1 !== 0 && (
              <span className="text-[7px]" style={{ color: "#F7C948" }}>½</span>
            )}
          </div>
        )}
      </div>
      <p className="text-[8px] leading-tight text-center line-clamp-2" style={{ color: "#6B6B8A" }}>
        {film.title}
      </p>
    </div>
  );
}

export function PosterGrid({ films, label, delay, maxCount = 4 }: { films: FilmEntry[]; label: string; delay: number; maxCount?: number }) {
  if (films.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col gap-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5A5A7A" }}>
        {label}
      </p>
      <div className={`grid gap-1.5 ${maxCount === 2 ? "grid-cols-2" : "grid-cols-4"}`}>
        {films.slice(0, maxCount).map((film, i) => (
          <PosterItem key={i} film={film} />
        ))}
      </div>
    </motion.div>
  );
}

// ── ReviewItem — handles onError fallback per-review ─────────────────────────
function ReviewItem({ r }: { r: ReviewEntry }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex gap-2.5 rounded-lg p-2.5" style={{ background: "#252533" }}>
      <div
        className="relative shrink-0 rounded overflow-hidden"
        style={{ width: 36, height: 54, background: "#23233A" }}
      >
        {r.poster && !failed ? (
          <Image
            src={r.poster}
            alt={r.title}
            fill
            className="object-cover"
            unoptimized
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-base">🎬</div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-xs font-semibold leading-tight truncate"
            style={{ color: "#E0E0F0", fontFamily: "var(--font-inter)" }}
          >
            {r.title}
          </span>
          {r.year > 0 && (
            <span className="text-[10px] shrink-0" style={{ color: "#5A5A7A" }}>
              {r.year}
            </span>
          )}
        </div>
        {r.rating > 0 && <StarRating rating={r.rating} />}
        {r.review && (
          <p
            className="text-[10px] leading-relaxed italic line-clamp-2 mt-0.5"
            style={{ color: "#8B8BA7" }}
          >
            &ldquo;{r.review}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

export function ReviewList({ reviews, label, delay }: { reviews: ReviewEntry[]; label: string; delay: number }) {
  if (reviews.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col gap-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5A5A7A" }}>
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {reviews.map((r, i) => (
          <ReviewItem key={i} r={r} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Mobile Compact Strip ─────────────────────────────────────────────────────
export function MobileProfileStrip({ userData }: { userData: LetterboxdData }) {
  const initials = (userData.display_name || userData.username).slice(0, 2).toUpperCase();
  const avgDisplay = userData.avg_rating > 0 ? userData.avg_rating.toFixed(2) : "—";

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="md:hidden flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide w-full"
    >
      <div className="flex bg-[#1a1a24] rounded-full p-1.5 items-center gap-2 border border-[#2A2A3E] shrink-0">
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-[#f5793a] to-[#d45d20] text-white">
          {initials}
        </div>
        <span className="text-xs font-bold text-[#F0F0F0] pr-3 truncate max-w-[120px]">
          {userData.display_name || userData.username}
        </span>
      </div>

      <div className="flex bg-[#1a1a24] rounded-full px-4 py-2 items-center gap-1.5 border border-[#2A2A3E] shrink-0 text-xs text-[#F0F0F0]">
        <span>🎬</span>
        <span className="font-semibold">{userData.total_films.toLocaleString("id-ID")}</span>
      </div>

      <div className="flex bg-[#1a1a24] rounded-full px-4 py-2 items-center gap-1.5 border border-[#2A2A3E] shrink-0 text-xs text-[#F0F0F0]">
        <span>⭐</span>
        <span className="font-semibold">{avgDisplay}</span>
      </div>

      {userData.top_genres.length > 0 && (
        <div className="flex bg-[#1a1a24] rounded-full px-4 py-2 items-center gap-1.5 border border-[#2A2A3E] shrink-0 text-xs text-[#F0F0F0]">
          <span>🎭</span>
          <span className="font-semibold">{userData.top_genres[0]}</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Main StatsCard (Desktop Sidebar) ─────────────────────────────────────────
export default function StatsCard({ userData }: { userData: LetterboxdData }) {
  const initials = (userData.display_name || userData.username).slice(0, 2).toUpperCase();
  const avgDisplay = userData.avg_rating > 0 ? `${userData.avg_rating.toFixed(2)} / 5.0` : "— / 5.0";
  const topGenres = userData.top_genres.slice(0, 3).join(", ") || "—";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="hidden md:flex rounded-2xl border overflow-hidden flex-col"
      style={{ background: "#1a1a24", borderColor: "#2A2A3E" }}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #2A2A3E" }}>
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #f5793a, #d45d20)", color: "#fff" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate" style={{ color: "#F0F0F0", fontFamily: "var(--font-inter)" }}>
            {userData.display_name || userData.username}
          </p>
          <a
            href={`https://letterboxd.com/${userData.username}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:text-[#f5793a] transition-colors"
            style={{ color: "#4F8EF7" }}
          >
            @{userData.username} ↗
          </a>
        </div>
      </div>

      {/* Bio */}
      {userData.bio && (
        <div className="px-5 py-3 text-xs italic leading-relaxed" style={{ color: "#8B8BA7", borderBottom: "1px solid #2A2A3E" }}>
          &ldquo;{userData.bio}&rdquo;
        </div>
      )}

      {/* Stats */}
      <div className="px-5 py-1">
        <StatRow icon="🎬" label="Films Watched" value={userData.total_films.toLocaleString("id-ID")} delay={0.1} />
        <StatRow icon="⭐" label="Avg Rating" value={avgDisplay} delay={0.15} />
        {userData.avg_rating > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-2 pb-2 -mt-1 pl-8"
          >
            <StarRating rating={userData.avg_rating} />
          </motion.div>
        )}
        <StatRow icon="🎭" label="Top Genres" value={topGenres} delay={0.2} />
        <StatRow icon="📅" label="Favorite Decade" value={userData.favorite_decade || "—"} delay={0.25} />
      </div>

      {/* Poster grids + Reviews */}
      <div className="px-5 pb-5 pt-3 flex flex-col gap-5" style={{ borderTop: "1px solid #2A2A3E" }}>
        <PosterGrid films={userData.favorite_films} label="Favorite Films" delay={0.35} />
        <PosterGrid films={userData.recent_films} label="Recent Activity" delay={0.45} />
        <ReviewList reviews={userData.recent_reviews} label="Recent Reviews" delay={0.55} />
        <ReviewList reviews={userData.popular_reviews} label="Popular Reviews" delay={0.65} />
      </div>
    </motion.div>
  );
}
