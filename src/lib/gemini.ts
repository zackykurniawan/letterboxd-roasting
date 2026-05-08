import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LetterboxdData } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `kamu adalah netizen Twitter Indonesia yang hobi nge-roast teman soal taste film mereka. gaya kamu: savage, witty, sarkastik — tapi tetap playful dan penuh kasih sayang, kayak teman yang jujur banget.

GAYA BAHASA:
- lowercase, santai, conversational (seolah lagi nge-tweet)
- kalimat pendek-pendek, tiap kalimat punya "punch"
- pakai exaggeration yang lucu (lebay tipis biar menghibur)
- sindiran halus yang bikin ketawa sekaligus sakit
- punchline kuat di akhir setiap bagian
- boleh pakai kata gaul ringan: literally, kayak, sih, dong, wkwk
- gunakan emoji secukupnya, jangan berlebihan

STRUKTUR OUTPUT (tweet-style, BUKAN paragraf panjang):
1. buka dengan 1-2 kalimat pembuka yang langsung nohok soal kebiasaan nonton/selera genre
2. 2-3 kalimat soal film favorit mereka — kalau filmnya "mainstream banget" atau "terlalu aman", sindir
3. soal film terbaru + review yang pernah ditulis:
   - kalau ada review: roast kontennya! review cuma emoji? review 3 kata? review yang relate banget? itu bahan premium
   - kalau tidak ada review sama sekali: sindir itu, 4 bintang tapi bungkam kayak saksi bisu
4. tutup dengan 1 kalimat "redemption arc" yang tetap sedikit nyelekit

LARANGAN KERAS:
- jangan toxic, body shaming, SARA, atau menyerang personal
- jangan terlalu panjang — ini roasting ala Twitter, bukan esai film

CONTOH TONE yang dimau:
"ini orang kalau bikin Letterboxd bukan buat nonton film, tapi buat flex taste doang 😭"
"4 bintang ke semua film... bro ini bukan rating, ini charity"
"favorite films-nya The Dark Knight, Fight Club, Parasite — classic 'saya bukan mainstream' starter pack"
"review-nya '🦫🦫' doang... bro nulis apa ini, ini review apa morse code"`;


export async function generateRoasting(userData: LetterboxdData): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const favFilms = userData.favorite_films.length > 0
    ? userData.favorite_films.map((f) => `${f.title}${f.year ? ` (${f.year})` : ""}`).join(", ")
    : "tidak ada data";

  const recentReviewsText = userData.recent_reviews.length > 0
    ? userData.recent_reviews.map((r) =>
        `"${r.title}"${r.rating > 0 ? ` (${r.rating}★)` : ""}: "${r.review}"`
      ).join("; ")
    : "tidak ada review";

  const popularReviewsText = userData.popular_reviews.length > 0
    ? userData.popular_reviews.map((r) =>
        `"${r.title}"${r.rating > 0 ? ` (${r.rating}★)` : ""}: "${r.review}"`
      ).join("; ")
    : "tidak ada review";

  const userPrompt = `
Data Letterboxd untuk di-roast:
- Username: ${userData.username}
- Total film ditonton: ${userData.total_films}
- Rating rata-rata: ${userData.avg_rating > 0 ? `${userData.avg_rating}/5.0` : "tidak ada (belum pernah kasih rating)"}
- Genre favorit: ${userData.top_genres.join(", ") || "tidak ada data"}
- Dekade favorit: ${userData.favorite_decade || "tidak ada data"}
- Film favorit (pilihan sendiri): ${favFilms}
- Film rating tertinggi: ${userData.highest_rated_films.map((f) => `${f.title} (${f.rating}★)`).join(", ") || "tidak ada"}
- Film rating terendah: ${userData.lowest_rated_films.map((f) => `${f.title} (${f.rating}★)`).join(", ") || "tidak ada"}
- Film terakhir ditonton: ${userData.recent_films.map((f) => `${f.title}${f.rating > 0 ? ` (${f.rating}★)` : ""}`).join(", ") || "tidak ada"}
- Review terbaru: ${recentReviewsText !== "tidak ada review" ? recentReviewsText : `NOL review — ${userData.total_films} film ditonton tapi satu pun tidak ada yang layak dikomen`}
- Review terpopuler: ${popularReviewsText}

Buat roasting yang personal dan lucu berdasarkan data di atas.
  `;

  try {
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch (error: any) {
    console.error("[gemini] Error generating content:", error);
    if (error?.message?.includes("429") || error?.status === 429) {
      return "wkwk kasihan banget mau di-roast aja ditolak sama AI karena limit habis 😭 (Error 429: Too Many Requests - Quota Exceeded. Coba lagi besok atau ganti API key).";
    }
    return "yah, AI-nya lagi pusing mikirin taste lu yang aneh itu. coba lagi nanti deh. (Error generating roast).";
  }
}
