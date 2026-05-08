"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareButtonsProps {
  roasting: string;
  username: string;
}

export default function ShareButtons({ roasting, username }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://letterboxd-roasting.vercel.app";

  const tweetText = `AI baru saja nge-roast akun Letterboxd gue (@${username}) dan it's painfully accurate 💀\n\nCoba kamu juga: ${appUrl}\n\n#LetterboxdRoast #Letterboxd`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleCopy = async () => {
    const textToCopy = `${roasting}\n\n— Roasted by ${appUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard API
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap gap-3 mt-2"
    >
      {/* Twitter / X share */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="share-twitter"
        className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
        style={{ background: "#1a1a24", border: "1px solid #2A2A3E" }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="shrink-0"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>Share ke Twitter/X</span>
      </a>

      {/* Copy to clipboard */}
      <button
        id="copy-roasting"
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        style={{
          background: copied ? "#4ADE80" : "#1a1a24",
          border: `1px solid ${copied ? "#4ADE80" : "#2A2A3E"}`,
          color: copied ? "#0F0F17" : "#F0F0F0",
        }}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-2"
            >
              ✓ <span>Tersalin!</span>
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-2"
            >
              📋 <span>Copy Roasting</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
