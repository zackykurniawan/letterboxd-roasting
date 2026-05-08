"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import LoadingState from "@/components/LoadingState";
import RoastResult from "@/components/RoastResult";
import type { RoastResponse } from "@/lib/types";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username") ?? "";

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "success"; data: RoastResponse }
    | { status: "error"; message: string }
  >({ status: "loading" });

  // Guard agar fetch tidak dipanggil dua kali (React Strict Mode & rerenders)
  const hasFetched = useRef(false);

  const doFetch = useCallback(async (user: string) => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({
          status: "error",
          message: data.error || "Terjadi kesalahan, coba lagi.",
        });
        return;
      }

      setState({ status: "success", data });
    } catch {
      setState({
        status: "error",
        message: "Koneksi gagal. Cek internet kamu dan coba lagi.",
      });
    }
  }, []);

  // Hanya dipanggil sekali saat mount
  useEffect(() => {
    if (!username) {
      router.replace("/");
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;
    doFetch(username);
  }, [username, router, doFetch]);

  // Retry handler — reset guard agar bisa fetch ulang
  const fetchRoast = useCallback(() => {
    hasFetched.current = false;
    doFetch(username);
  }, [username, doFetch]);

  if (!username) return null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 min-h-screen relative" style={{ background: "#0f0f14" }}>
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 right-0 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "#f5793a" }}
        />
        <div
          className="absolute bottom-0 left-0 h-64 w-64 rounded-full opacity-5 blur-3xl"
          style={{ background: "#4F8EF7" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {state.status === "loading" && (
          <LoadingState username={username} />
        )}

        {state.status === "error" && (
          <div className="flex flex-col items-center gap-6 text-center py-20">
            <div className="text-6xl">😬</div>
            <div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "var(--font-playfair)", color: "#F0F0F0" }}
              >
                Oops, ada yang salah
              </h2>
              <p className="text-base max-w-sm" style={{ color: "#8B8BA7" }}>
                {state.message}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                id="retry-button"
                onClick={fetchRoast}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #f5793a 0%, #d45d20 100%)",
                }}
              >
                🔄 Coba Lagi
              </button>
              <a
                href="/"
                className="rounded-xl border px-6 py-3 text-sm font-semibold transition-all hover:scale-105 hover:border-[#4F8EF7]"
                style={{ borderColor: "#2A2A3E", color: "#8B8BA7" }}
              >
                ← Kembali
              </a>
            </div>

            {/* Error details for common issues */}
            <div
              className="rounded-2xl border p-5 text-left max-w-sm text-sm"
              style={{ background: "#1a1a24", borderColor: "#2A2A3E" }}
            >
              <p className="font-semibold mb-3" style={{ color: "#F0F0F0" }}>
                Kemungkinan penyebab:
              </p>
              <ul className="flex flex-col gap-2" style={{ color: "#8B8BA7" }}>
                <li>• Username tidak terdaftar di Letterboxd</li>
                <li>• Akun di-set private oleh pemiliknya</li>
                <li>• Letterboxd sedang down atau lambat</li>
                <li>• Terlalu banyak request, coba 1 menit lagi</li>
              </ul>
            </div>
          </div>
        )}

        {state.status === "success" && (
          <RoastResult data={state.data} />
        )}
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center min-h-screen">
          <LoadingState />
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
