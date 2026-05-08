import type { Metadata } from "next";
import RoastForm from "@/components/RoastForm";

export const metadata: Metadata = {
  title: "Roast My Letterboxd — AI Roasting Film Anda",
  description:
    "Masukkan username Letterboxd-mu. Kami akan menganalisis selera filmmu... dan menertawakannya. Powered by Google Gemini Flash.",
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-screen relative overflow-hidden">
      {/* Decorative background circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "#f5793a" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "#4F8EF7" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: "#4ADE80" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl">
        {/* Film strip decoration */}
        <div className="flex items-center gap-2" aria-hidden="true">
          {["🎞️", "🎬", "🍿", "🎬", "🎞️"].map((emoji, i) => (
            <span key={i} className="text-2xl opacity-60">
              {emoji}
            </span>
          ))}
        </div>

        {/* Main heading */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{
              borderColor: "#f5793a",
              color: "#f5793a",
              background: "rgba(255, 107, 53, 0.08)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#f5793a] animate-pulse inline-block"
            />
            Powered by Google Gemini Flash AI
          </div>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-playfair)", color: "#F0F0F0" }}
          >
            Roast My{" "}
            <span className="gradient-text">Letterboxd</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-lg leading-relaxed"
            style={{ color: "#8B8BA7" }}
          >
            Masukkan username Letterboxd-mu. Kami akan menganalisis selera
            filmmu...{" "}
            <em className="not-italic font-semibold" style={{ color: "#f5793a" }}>
              dan menertawakannya.
            </em>
          </p>
        </div>

        {/* Form */}
        <RoastForm />

        {/* Social proof tags */}
        <div
          className="flex flex-wrap justify-center gap-6 text-xs"
          style={{ color: "#8B8BA7" }}
        >
          {[
            { icon: "🎬", text: "Scrape data real dari Letterboxd" },
            { icon: "🤖", text: "AI Gemini Flash generate roasting" },
            { icon: "🔥", text: "100% personal & unik" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <p
          className="text-xs italic"
          style={{ color: "#8B8BA7", opacity: 0.5 }}
        >
          &ldquo;Kami analisis selera filmmu, lalu menertawakannya.&rdquo;
        </p>
      </div>
    </main>
  );
}
