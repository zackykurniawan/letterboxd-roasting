"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_MESSAGES = [
  "lagi ngintip watchlist kamu... semoga ga ada film aib di sana 🫣",
  "AI-nya baru liat favorite films kamu dan langsung minta istirahat 😮‍💨",
  "nge-scrape data kamu sambil geleng-geleng kepala pelan-pelan 🤦",
  "ngitung berapa kali kamu kasih 4 bintang ke film yang literally biasa aja 💀",
  "lagi nanya ke Letterboxd: 'ini orang beneran nonton apa cuma flex?' 🧐",
  "sedang mengumpulkan bukti-bukti bahwa taste kamu... bisa diperdebatkan 📁",
  "AI-nya pause sebentar, shocked melihat genre favorit kamu 😭",
  "mempersiapkan roasting yang lebih pedes dari review film Indonesia kamu 🌶️",
  "loading... sambil nunggu, tolong jelaskan kenapa kamu pilih film itu 🙏",
  "hampir kelar, tinggal nulis roasting-nya aja — yang ini sih gampang katanya 💬",
];

interface LoadingStateProps {
  username?: string;
}

export default function LoadingState({ username }: LoadingStateProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20 px-4">
      {/* Film strip spinner */}
      <div className="relative">
        <div className="relative h-20 w-20">
          {/* Outer ring */}
          <svg
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "2s" }}
            viewBox="0 0 80 80"
            fill="none"
          >
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="url(#spinGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="160 60"
            />
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4F8EF7" />
                <stop offset="100%" stopColor="#f5793a" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner pulsing circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#f5793a]/20 to-[#4F8EF7]/20 flex items-center justify-center">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-2xl"
            >
              🎬
            </motion.span>
          </div>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-[#f5793a]"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.67,
              ease: "linear",
            }}
            style={{
              x: -4,
              y: -4,
              originX: "4px",
              originY: "44px",
            }}
          />
        ))}
      </div>

      {/* Username */}
      {username && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium"
          style={{ color: "#4F8EF7" }}
        >
          Menganalisis akun{" "}
          <span className="font-bold text-[#F0F0F0]">@{username}</span>...
        </motion.p>
      )}

      {/* Rotating message */}
      <div className="h-8 flex items-center">
        <AnimatePresence mode="wait">
          {visible && (
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="text-center text-base max-w-sm"
              style={{ color: "#8B8BA7" }}
            >
              {LOADING_MESSAGES[msgIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {LOADING_MESSAGES.map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full"
            animate={{
              width: i === msgIndex ? 24 : 6,
              backgroundColor: i === msgIndex ? "#f5793a" : "#2A2A3E",
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Warning about wait time */}
      <p className="text-xs text-center max-w-xs" style={{ color: "#8B8BA7" }}>
        Proses ini membutuhkan 15–30 detik. <br />
        Letterboxd-nya lagi di-scrape, AI-nya lagi mikir keras. ☕
      </p>
    </div>
  );
}
