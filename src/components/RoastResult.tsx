"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import StatsCard, { MobileProfileStrip, PosterGrid } from "./StatsCard";
import ShareButtons from "./ShareButtons";
import type { RoastResponse } from "@/lib/types";

interface RoastResultProps {
  data: RoastResponse;
}

// Parse teks roasting: bold (**text**), italic (*text*), newline jadi paragraf
function parseRoastingText(text: string): React.ReactNode[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((para, pi) => {
    const segments: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let last = 0;
    let match;

    while ((match = regex.exec(para)) !== null) {
      if (match.index > last) {
        segments.push(para.slice(last, match.index));
      }
      if (match[2]) {
        segments.push(
          <strong key={`b${pi}-${match.index}`} style={{ color: "#f5793a", fontStyle: "normal" }}>
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        segments.push(
          <em key={`i${pi}-${match.index}`} style={{ color: "#F0F0F0", fontStyle: "italic" }}>
            {match[3]}
          </em>
        );
      }
      last = match.index + match[0].length;
    }
    if (last < para.length) {
      segments.push(para.slice(last));
    }

    return (
      <motion.p
        key={pi}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + pi * 0.12, duration: 0.4 }}
        className="leading-relaxed text-[17px] md:text-lg"
        style={{
          color: "#D8D8E8",
          fontFamily: "var(--font-inter)",
          lineHeight: "1.7",
        }}
      >
        {segments.length > 0 ? segments : para}
      </motion.p>
    );
  });
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-2xl border p-4 bg-[#1a1a24] border-[#2A2A3E]">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center text-sm font-semibold text-[#F0F0F0]"
      >
        <span>{title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-[#5A5A7A]">
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-[#2A2A3E] mt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoastResult({ data }: RoastResultProps) {
  const [shareVisible, setShareVisible] = useState(false);
  const { roasting, userData } = data;

  const handleAnimationComplete = useCallback(() => {
    setShareVisible(true);
  }, []);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Roast My Letterboxd",
          text: `Cek roasting AI buat akun Letterboxd gue @${userData.username} 🔥`,
          url: window.location.href,
        });
      } catch (err) {
        // ignore
      }
    } else {
      document.getElementById("share-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const paragraphNodes = parseRoastingText(roasting);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto flex flex-col gap-6 md:gap-8 pb-24 md:pb-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center md:text-left md:pl-2"
      >
        <h1
          className="text-2xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "var(--font-playfair)", color: "#F0F0F0" }}
        >
          Roasting untuk{" "}
          <span style={{ color: "#f5793a" }}>@{userData.username}</span>
        </h1>
        <p className="text-xs md:text-sm" style={{ color: "#8B8BA7", fontFamily: "var(--font-inter)" }}>
          Dianalisis oleh AI • Data dari Letterboxd
        </p>
      </motion.div>

      {/* Mobile Compact Strip */}
      <MobileProfileStrip userData={userData} />

      {/* Main content: 2-col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-[35%_65%] gap-6 items-start">
        {/* Left: StatsCard (hidden on mobile) */}
        <StatsCard userData={userData} />

        {/* Right: Roasting text + Mobile Collapsibles */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl border flex flex-col gap-5 shadow-[-8px_0_24px_-12px_rgba(245,121,58,0.15)] overflow-hidden relative"
            style={{ background: "#1a1a24", borderColor: "#2A2A3E" }}
          >
            {/* Left Accent Glow Line */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#f5793a] to-transparent opacity-80" />

            {/* Roasting header */}
            <div className="flex items-center gap-2 px-6 pt-6 pb-0 z-10">
              <span className="text-base">🔥</span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#f5793a", fontFamily: "var(--font-inter)" }}
              >
                Roasting AI
              </span>
              <div className="flex-1 h-px" style={{ background: "#2A2A3E" }} />
            </div>

            {/* Roasting paragraphs */}
            <div className="px-6 pb-2 flex flex-col gap-5 relative z-10">
              {paragraphNodes}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + paragraphNodes.length * 0.12 + 0.5 }}
                onAnimationComplete={handleAnimationComplete}
                className="sr-only"
              />
            </div>

            {/* Divider + Share (Desktop and inline mobile) */}
            <AnimatePresence>
              {shareVisible && (
                <motion.div
                  id="share-section"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="px-6 pb-6 flex flex-col gap-3 relative z-10"
                  style={{ borderTop: "1px solid #2A2A3E" }}
                >
                  <p
                    className="text-xs pt-4 font-medium"
                    style={{ color: "#8B8BA7", fontFamily: "var(--font-inter)" }}
                  >
                    Mau pamer ke teman-teman?
                  </p>
                  <ShareButtons roasting={roasting} username={userData.username} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mobile Collapsibles for Stats */}
          <div className="md:hidden flex flex-col gap-4">
            <CollapsibleSection title="Favorite Films">
              <PosterGrid films={userData.favorite_films} label="" delay={0} maxCount={4} />
            </CollapsibleSection>
            <CollapsibleSection title="Recent Activity">
              <PosterGrid films={userData.recent_films} label="" delay={0} maxCount={4} />
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Sticky Share CTA for Mobile */}
      <AnimatePresence>
        {shareVisible && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-50 bg-gradient-to-t from-[#0f0f14] via-[#0f0f14] to-transparent pt-12"
          >
            <button
              onClick={handleNativeShare}
              className="w-full rounded-2xl px-6 py-4 text-[15px] font-bold text-white shadow-[0_4px_24px_rgba(245,121,58,0.4)] transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #f5793a 0%, #d45d20 100%)" }}
            >
              Bagikan Roast Ini 🔥
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Back */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <Link
          href="/"
          id="roast-another"
          className="flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition-all hover:scale-105 hover:border-[#f5793a] hover:text-[#f5793a]"
          style={{
            borderColor: "#2A2A3E",
            color: "#8B8BA7",
            fontFamily: "var(--font-inter)",
          }}
        >
          ← Roast Akun Lain
        </Link>
      </motion.div>
    </motion.div>
  );
}
