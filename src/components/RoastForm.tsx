"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface RoastFormProps {
  onError?: (error: string) => void;
}

export default function RoastForm({ onError }: RoastFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = username.trim();
      if (!trimmed) return;

      setError("");
      setIsLoading(true);

      // Navigate to result page — it handles the fetch
      router.push(`/result?username=${encodeURIComponent(trimmed)}`);
    },
    [username, router]
  );

  useEffect(() => {
    if (onError && error) onError(error);
  }, [error, onError]);

  const isValid = /^[a-zA-Z0-9_]{1,30}$/.test(username.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Input wrapper */}
        <div className="relative group">
          {/* Glow ring on focus */}
          <div
            className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#4F8EF7] to-[#f5793a] opacity-0 blur transition-opacity duration-300 ${
              focused ? "opacity-40" : "group-hover:opacity-20"
            }`}
          />
          <div
            className="relative flex items-center gap-3 rounded-2xl border px-5 py-4 transition-colors"
            style={{
              background: "#1A1A27",
              borderColor: focused ? "#4F8EF7" : "#2A2A3E",
            }}
          >
            <span className="text-xl select-none">🎬</span>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="username_letterboxd (tanpa @)"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={30}
              className="flex-1 bg-transparent text-[#F0F0F0] placeholder:text-[#8B8BA7] text-lg outline-none"
              style={{ fontFamily: "var(--font-inter)" }}
              disabled={isLoading}
            />
            {username && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={() => setUsername("")}
                className="text-[#8B8BA7] hover:text-[#F0F0F0] transition-colors text-sm"
              >
                ✕
              </motion.button>
            )}
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-xl border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-3 text-[#F87171] text-sm"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoading || !username.trim()}
          whileHover={!isLoading && username.trim() ? { scale: 1.02 } : {}}
          whileTap={!isLoading && username.trim() ? { scale: 0.98 } : {}}
          className="relative flex h-14 items-center justify-center gap-3 rounded-2xl text-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          style={{
            background:
              !isLoading && username.trim()
                ? "linear-gradient(135deg, #f5793a 0%, #d45d20 100%)"
                : "#2A2A3E",
          }}
        >
          {/* Shimmer effect on hover */}
          {!isLoading && isValid && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
          )}
          {isLoading ? (
            <>
              <div
                className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              <span>Mengarahkan...</span>
            </>
          ) : (
            <>
              <span>🎬</span>
              <span>Roast Me!</span>
              <span className="text-white/70">→</span>
            </>
          )}
        </motion.button>

        {/* Hint */}
        <p className="text-center text-sm" style={{ color: "#8B8BA7" }}>
          Tidak punya akun Letterboxd?{" "}
          <button
            type="button"
            onClick={() => setUsername("letterboxd")}
            className="underline underline-offset-2 hover:text-[#4F8EF7] transition-colors"
          >
            Coba username &apos;letterboxd&apos;
          </button>
        </p>
      </form>
    </motion.div>
  );
}
