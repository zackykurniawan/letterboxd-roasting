# 🎬 Letterboxd Account Roasting — Vibe Coding Spec

> Paste file ini ke AI code editor (Cursor, Windsurf, dll) dan bilang: **"Build this project from scratch"**

---

## 🎯 Project Summary

Web app yang scrape profil publik Letterboxd pengguna, lalu generate **roasting komedi personal** menggunakan Gemini Flash AI. Input: username → Output: roasting tajam berbasis data nyata tontonan mereka.

**Tagline:** *"Kami analisis selera filmmu, lalu menertawakannya."*

---

## 🗂️ Struktur Folder Target

```
letterboxd-roasting/
├── app/
│   ├── page.tsx                  # Landing page + form input
│   ├── result/
│   │   └── page.tsx              # Halaman hasil roasting
│   ├── api/
│   │   ├── roast/
│   │   │   └── route.ts          # POST /api/roast — orchestrator
│   │   └── scrape/
│   │       └── route.py          # GET /api/scrape — Python scraper
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── RoastForm.tsx             # Form input username
│   ├── RoastResult.tsx           # Display hasil roasting
│   ├── StatsCard.tsx             # Card stats profil user
│   ├── LoadingState.tsx          # Animasi loading dengan random messages
│   └── ShareButtons.tsx          # Tombol share Twitter + copy
├── lib/
│   ├── gemini.ts                 # Gemini Flash API client
│   └── types.ts                  # TypeScript interfaces
├── public/
│   └── og-image.png              # OG image untuk social share
├── vercel.json                   # Konfigurasi Vercel
├── requirements.txt              # Python dependencies
├── .env.local                    # Environment variables (jangan di-commit!)
└── package.json
```

---

## ⚙️ Tech Stack

| Layer | Tech | Versi |
|-------|------|-------|
| Framework | Next.js (App Router) | 14+ |
| Language FE | TypeScript | 5+ |
| Language Scraper | Python | 3.11+ |
| Styling | Tailwind CSS | 3+ |
| UI Components | shadcn/ui | latest |
| Animasi | Framer Motion | 11+ |
| AI Engine | Google Gemini Flash | 1.5 |
| HTTP Client (Python) | httpx | 0.27+ |
| HTML Parser | BeautifulSoup4 + lxml | latest |
| Deploy | Vercel | - |

---

## 🔑 Environment Variables

Buat file `.env.local` di root project:

```env
# Google AI Studio — ambil gratis di https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Base URL (otomatis di Vercel, isi manual untuk dev)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **PENTING:** Jangan pernah commit `.env.local`. Pastikan ada di `.gitignore`.

---

## 📦 Dependencies

### `package.json` — install dengan `npm install`

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "@google/generative-ai": "^0.15.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### `requirements.txt` — Python dependencies

```
httpx==0.27.0
beautifulsoup4==4.12.3
lxml==5.2.2
```

---

## 🐍 Python Scraper — `/app/api/scrape/route.py`

### Fungsi scraper

Scraper harus mengambil data berikut dari profil publik Letterboxd:

```python
# Endpoint yang di-scrape:
# https://letterboxd.com/{username}/                    → bio, total films
# https://letterboxd.com/{username}/films/              → jumlah film, rating rata-rata
# https://letterboxd.com/{username}/films/ratings/      → distribusi rating
# https://letterboxd.com/{username}/films/genre/        → genre favorit
# https://letterboxd.com/{username}/films/decade/       → dekade favorit
# https://letterboxd.com/{username}/films/country/      → negara film favorit
```

### Interface data yang harus dikembalikan (JSON):

```python
# Return JSON dengan struktur ini:
{
  "username": str,
  "display_name": str,
  "bio": str,                        # bisa kosong ""
  "total_films": int,                # total film yang sudah ditonton
  "avg_rating": float,               # rata-rata rating (skala 0.5 - 5.0)
  "ratings_distribution": {          # distribusi rating
    "0.5": int, "1.0": int, "1.5": int, "2.0": int,
    "2.5": int, "3.0": int, "3.5": int, "4.0": int,
    "4.5": int, "5.0": int
  },
  "top_genres": [str],               # max 5 genre, urut dari terbanyak
  "favorite_decade": str,            # contoh: "2010s"
  "favorite_country": str,           # contoh: "USA"
  "total_reviews": int,              # jumlah review yang ditulis
  "recent_films": [                  # 5 film terakhir yang ditonton
    {"title": str, "year": int, "rating": float}
  ],
  "highest_rated_films": [           # 3 film dengan rating tertinggi
    {"title": str, "year": int, "rating": float}
  ],
  "lowest_rated_films": [            # 3 film dengan rating terendah
    {"title": str, "year": int, "rating": float}
  ]
}
```

### Cara handle request di Python route:

```python
# app/api/scrape/route.py
# Terima GET request dengan query param: ?username=namauser
# Return JSON di atas jika sukses
# Return error JSON jika gagal: {"error": "User not found"} dengan status 404
```

### Anti-block headers yang HARUS dipakai:

```python
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# Tambahkan delay antara requests:
import asyncio
await asyncio.sleep(1.5)  # delay 1.5 detik antar request
```

### Error handling di scraper:

```python
# Handle kasus berikut:
# 1. User tidak ditemukan → return 404
# 2. Akun private → return 403 dengan message "Akun ini private"
# 3. Letterboxd timeout → return 503 dengan retry suggestion
# 4. Rate limited → return 429
```

---

## 🤖 Gemini Flash Integration — `/lib/gemini.ts`

### Setup client:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

### System Prompt (GUNAKAN PERSIS INI):

```typescript
const SYSTEM_PROMPT = `Kamu adalah kritikus film yang sangat sarkas tapi menghibur, seperti gabungan antara Roger Ebert yang kritis dan stand-up comedian lokal Indonesia.

TUGAS: Buat roasting komedi berdasarkan data Letterboxd yang diberikan.

ATURAN WAJIB:
1. Bahasa Indonesia dengan sentuhan slang internet/film (boleh campur sedikit English jika relevan)
2. PERSONAL — sebut data spesifik: genre favorit, film tertentu, angka rating, dll
3. 3-4 paragraf, sekitar 200-250 kata total
4. Paragraf terakhir HARUS ada "redemption arc" kecil — akui satu hal positif dari selera mereka
5. JANGAN toxic, body shaming, SARA, atau menyerang hal di luar film
6. JANGAN generik — setiap roasting harus terasa unik untuk user ini
7. Mulai langsung dengan roasting, tidak perlu intro seperti "Oke, mari kita roast..."
8. Gunakan analogi film yang relevan dengan data mereka

TONE: Pedas tapi penuh kasih sayang, seperti teman yang jujur.`;
```

### Fungsi generate roasting:

```typescript
export async function generateRoasting(userData: LetterboxdData): Promise<string> {
  const userPrompt = `
Data Letterboxd untuk di-roast:
- Username: ${userData.username}
- Total film ditonton: ${userData.total_films}
- Rating rata-rata: ${userData.avg_rating}/5.0
- Genre favorit: ${userData.top_genres.join(", ")}
- Dekade favorit: ${userData.favorite_decade}
- Negara film favorit: ${userData.favorite_country}
- Total review ditulis: ${userData.total_reviews}
- Film dengan rating tertinggi: ${userData.highest_rated_films.map(f => `${f.title} (${f.rating}★)`).join(", ")}
- Film dengan rating terendah: ${userData.lowest_rated_films.map(f => `${f.title} (${f.rating}★)`).join(", ")}
- Film terakhir ditonton: ${userData.recent_films.slice(0, 3).map(f => f.title).join(", ")}

Buat roasting yang personal, lucu, dan berdasarkan data di atas.
  `;

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: userPrompt }
  ]);

  return result.response.text();
}
```

---

## 🔀 API Orchestrator — `/app/api/roast/route.ts`

```typescript
// POST /api/roast
// Body: { username: string }
// Flow:
//   1. Validasi username (alphanumeric + underscore, max 30 char)
//   2. Call scraper Python: GET /api/scrape?username={username}
//   3. Call Gemini: generateRoasting(scraperData)
//   4. Return: { roasting: string, userData: LetterboxdData }

// Error responses:
//   400 — username invalid
//   404 — user tidak ditemukan di Letterboxd
//   403 — akun private
//   500 — scraper atau Gemini gagal
```

### Validasi username:

```typescript
const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,30}$/;

if (!USERNAME_REGEX.test(username)) {
  return NextResponse.json(
    { error: "Username hanya boleh huruf, angka, dan underscore (max 30 karakter)" },
    { status: 400 }
  );
}
```

---

## 🎨 UI Components

### `/components/RoastForm.tsx`

```
Tampilan:
- Judul besar: "Roast My Letterboxd"
- Subjudul: "Masukkan username Letterboxd-mu. Kami akan menganalisis selera filmmu... dan menertawakannya."
- Input field: placeholder "username_letterboxd (tanpa @)"
- Tombol submit: "🎬 Roast Me!" 
- Disable tombol saat loading
- Tampilkan error message jika ada (misal: user not found)
- Link kecil di bawah: "Tidak punya akun Letterboxd? Coba username: 'letterboxd'"
```

### `/components/LoadingState.tsx`

```typescript
// Tampilkan salah satu pesan ini secara random, ganti setiap 3 detik:
const LOADING_MESSAGES = [
  "Sedang menggali aib tontonan kamu... 🔍",
  "Menghitung berapa kali kamu kasih bintang 4 ke film biasa-biasa aja... ⭐",
  "Memanggil hantu Roger Ebert untuk menghakimi seleramu... 👻",
  "Menganalisis kenapa kamu skip film bagus tapi nonton yang jelek... 🤔",
  "Sedang konsultasi dengan para kritikus yang sudah pensiun... 📜",
  "Memeriksa apakah kamu benar-benar pernah nonton film 'bagus'... 🎭",
  "AI-nya sedang shock melihat rating-rating yang kamu berikan... 😱",
  "Menyiapkan roasting yang setajam review Letterboxd-mu... ✍️",
];

// Tampilkan spinner + pesan
// Animasi fade in/out setiap ganti pesan
```

### `/components/RoastResult.tsx`

```
Layout (desktop: 2 kolom, mobile: 1 kolom):

[Kiri — StatsCard]          [Kanan — Roasting Text]
- Avatar/initial username   - Judul: "Roasting untuk @username"  
- Total films               - Teks roasting dengan typewriter effect
- Avg rating (bintang)      - Setelah selesai: muncul ShareButtons
- Top 3 genre
- Favorite decade
- Total reviews

Di bawah: tombol "Roast Akun Lain →"
```

### `/components/StatsCard.tsx`

```
Data yang ditampilkan:
🎬 {total_films} films watched
⭐ {avg_rating}/5.0 avg rating  
🎭 Top genres: {genre1}, {genre2}, {genre3}
📅 Favorite decade: {decade}
🌍 Fav country: {country}
✍️ {total_reviews} reviews written
```

### `/components/ShareButtons.tsx`

```typescript
// Tombol 1: Share ke Twitter/X
const tweetText = `AI baru saja nge-roast akun Letterboxd gue dan it's painfully accurate 💀\n\nCoba kamu juga: [URL]\n\n#LetterboxdRoast #Letterboxd`;
const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

// Tombol 2: Copy to Clipboard
// Salin teks roasting + "— Roasted by [URL app]"

// Tampilan tombol:
// [🐦 Share ke Twitter/X]  [📋 Copy Roasting]
```

---

## 🎨 Design System

### Warna (globals.css / tailwind config):

```css
/* Dark mode (default) */
--bg-primary: #0F0F17;        /* Background utama — hampir hitam */
--bg-secondary: #1A1A27;      /* Card background */
--bg-accent: #16213E;         /* Subtle accent bg */
--text-primary: #F0F0F0;      /* Teks utama */
--text-muted: #8B8BA7;        /* Teks sekunder */
--color-blue: #4F8EF7;        /* Accent biru — link, highlight */
--color-orange: #FF6B35;      /* Accent oranye — CTA, roasting text */
--color-green: #4ADE80;       /* Success state */
--color-red: #F87171;         /* Error state */
--border: #2A2A3E;            /* Border tipis */
```

### Typography:

```css
/* Font pairing */
/* Display/Heading: "Playfair Display" (serif, dramatis untuk roasting) */
/* Body: "Inter" atau "DM Sans" */

/* Import di layout.tsx dari Google Fonts */
```

### Komponen styling guidelines:

```
- Input field: border subtle, focus ring warna --color-blue, dark bg
- Tombol primary: gradient oranye-merah, rounded-xl, hover scale-105
- Card: bg --bg-secondary, border --border, rounded-2xl, shadow gelap
- Roasting text: font Playfair Display, italic, warna --color-orange
- Loading spinner: warna --color-blue, animasi smooth
```

---

## 🚀 Vercel Configuration — `vercel.json`

```json
{
  "functions": {
    "app/api/scrape/route.py": {
      "runtime": "python3.11",
      "maxDuration": 30
    },
    "app/api/roast/route.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

---

## 📝 TypeScript Types — `/lib/types.ts`

```typescript
export interface FilmEntry {
  title: string;
  year: number;
  rating: number;
}

export interface LetterboxdData {
  username: string;
  display_name: string;
  bio: string;
  total_films: number;
  avg_rating: number;
  ratings_distribution: Record<string, number>;
  top_genres: string[];
  favorite_decade: string;
  favorite_country: string;
  total_reviews: number;
  recent_films: FilmEntry[];
  highest_rated_films: FilmEntry[];
  lowest_rated_films: FilmEntry[];
}

export interface RoastResponse {
  roasting: string;
  userData: LetterboxdData;
}

export interface ApiError {
  error: string;
  code?: string;
}
```

---

## 🛡️ Rate Limiting & Security

Tambahkan di middleware atau di dalam API route:

```typescript
// /middleware.ts — Rate limiting sederhana
// Maksimal 10 request per IP per menit
// Gunakan Map() in-memory untuk dev, atau Vercel KV untuk production

// Juga validasi:
// - username tidak boleh SQL injection (sudah aman karena regex)  
// - timeout scraper 15 detik
// - timeout Gemini 30 detik
// - max length roasting output: 2000 karakter
```

---

## 🧪 Testing Checklist

Sebelum deploy, pastikan semua skenario ini jalan:

```
[ ] Username valid → scrape berhasil → roasting muncul
[ ] Username tidak ada di Letterboxd → error "User not found"
[ ] Akun private → error yang informatif
[ ] Username dengan karakter invalid → validasi menolak
[ ] Loading state muncul dan pesan berganti setiap 3 detik
[ ] Typewriter effect berjalan smooth
[ ] Tombol copy berhasil copy teks
[ ] Tombol share buka Twitter dengan pre-filled text
[ ] Responsive di mobile (375px)
[ ] Responsive di desktop (1440px)
[ ] Error state ditampilkan dengan baik (tidak crash)
```

---

## 🌐 Deployment ke Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (pertama kali)
vercel

# 4. Set environment variables
vercel env add GEMINI_API_KEY

# 5. Deploy production
vercel --prod
```

**Atau:** Push ke GitHub → connect repo di vercel.com → auto-deploy.

---

## 💡 Tips Vibe Coding

1. **Mulai dari scraper dulu** — test dengan `curl localhost:3000/api/scrape?username=letterboxd`
2. **Test Gemini terpisah** — buat file `test-gemini.ts` dengan hardcoded data sebelum integrasi
3. **Mock data dulu untuk UI** — jangan tunggu scraper selesai untuk build komponen
4. **Loading UX penting** — roasting bisa 5-10 detik, jangan biarkan user nunggu tanpa feedback
5. **Gunakan `console.log` di Python scraper** — Vercel log scraper output di dashboard

---

## 🔥 Quick Start Commands

```bash
# Clone / init project
npx create-next-app@latest letterboxd-roasting --typescript --tailwind --app --src-dir no

# Masuk folder
cd letterboxd-roasting

# Install deps
npm install framer-motion @google/generative-ai clsx tailwind-merge
npm install -D @types/node

# Install shadcn/ui (opsional tapi recommended)
npx shadcn@latest init

# Jalankan dev server
npm run dev
# → http://localhost:3000

# Test scraper Python (dari folder root)
pip install httpx beautifulsoup4 lxml
python -c "from app.api.scrape.route import scrape_user; import asyncio; print(asyncio.run(scrape_user('letterboxd')))"
```

---

*Built with ❤️ + ☕ + terlalu banyak waktu nonton film*