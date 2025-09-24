# 🤖 Tutor Cerdas - RAG dengan Gemini AI

Sistem pembelajaran cerdas yang menggunakan **Retrieval-Augmented Generation (RAG)** dengan Google Gemini AI untuk menjawab pertanyaan berdasarkan dokumen PDF yang diupload.

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│    Backend      │───▶│    Indexer      │───▶│   Supabase      │
│   (React)       │    │   (Express.js)  │    │   (FastAPI)     │    │  (PostgreSQL +  │
│   Port: 5173    │    │   Port: 8787    │    │   Port: 8000    │    │   pgvector)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │   Google Gemini   │
                                              │      AI API       │
                                              └───────────────────┘
```

## 📁 Struktur Project

```
RAG-Gemini/
├── tutor-cerdas-web/        # Frontend React (Port: 5173)
├── tutor-cerdas-api/        # Backend Express.js (Port: 8787)
├── indexer/                 # Python FastAPI untuk processing (Port: 8000)
├── tutor-cerdas/           # [DEPRECATED] Versi lama monorepo
└── README.md               # File ini
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Python** >= 3.8
- **npm** atau **yarn**
- **pip** untuk Python packages
- **Akun Supabase** (gratis)
- **Google AI Studio API Key** (gratis)

### 1. Setup Database (Supabase)

#### A. Buat Project Supabase
1. Daftar di [supabase.com](https://supabase.com)
2. Buat project baru
3. Catat **Project URL** dan **API Keys**

#### B. Install pgvector Extension
Buka **SQL Editor** di dashboard Supabase, jalankan:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

#### C. Buat Tabel Database
```sql
-- Tabel untuk menyimpan metadata dokumen
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  storage_path TEXT,
  file_path TEXT,
  size INTEGER,
  pages INTEGER,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan chunks dan embeddings
CREATE TABLE chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER,
  content TEXT,
  embedding VECTOR(384), -- Dimensi untuk model e5-small-v2
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

-- Index untuk similarity search
CREATE INDEX chunks_embedding_idx ON chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function untuk similarity search
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(384),
  match_count INT DEFAULT 6,
  filter_document UUID DEFAULT NULL
)
RETURNS TABLE(
  document_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.document_id,
    c.chunk_index,
    c.content,
    (c.embedding <=> query_embedding) * -1 + 1 AS similarity
  FROM chunks c
  WHERE (filter_document IS NULL OR c.document_id = filter_document)
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### D. Disable RLS (untuk Development)
```sql
-- Disable Row Level Security untuk development
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
```

#### E. Setup Storage Bucket
1. Go to **Storage** → **Create Bucket**
2. Nama bucket: `documents`
3. Set bucket sebagai public jika diperlukan

### 2. Setup Environment Variables

#### A. Backend API (.env)
Buat file `tutor-cerdas-api/.env`:
```env
PORT=8787
NODE_ENV=development

# Supabase (dari dashboard project Anda)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Google Gemini (dari AI Studio)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Indexer URL
INDEXER_URL=http://localhost:8000

# CORS
WEB_ORIGIN=http://localhost:5173
```

#### B. Indexer (.env)
Buat file `indexer/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
STORAGE_BUCKET=documents
EMBED_MODEL=intfloat/e5-small-v2
```

#### C. Frontend (.env)
Buat file `tutor-cerdas-web/.env`:
```env
VITE_API_URL=http://localhost:8787
```

### 3. Cara Mendapatkan API Keys

#### Google Gemini API Key:
1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Buat API key baru
3. Copy dan paste ke file `.env`

#### Supabase Keys:
1. Buka dashboard Supabase → **Settings** → **API**
2. Copy **Project URL** dan **service_role key** (bukan anon key!)

### 4. Install Dependencies & Run

#### Terminal 1: Backend API
```bash
cd tutor-cerdas-api
npm install
npm run dev
```
✅ Server running on http://localhost:8787

#### Terminal 2: Python Indexer
```bash
cd indexer
pip install -r requirements.txt

# Install spaCy model (opsional)
python -m spacy download en_core_web_sm

uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
✅ Server running on http://localhost:8000

#### Terminal 3: Frontend
```bash
cd tutor-cerdas-web
npm install
npm run dev
```
✅ Server running on http://localhost:5173

## 🎯 Cara Menggunakan Aplikasi

### 1. Akses Admin (Upload Dokumen)
1. Buka http://localhost:5173
2. Klik **"Masuk Admin"**
3. **Upload PDF**: Drag & drop atau pilih file PDF
4. **Rebuild**: Klik tombol "Rebuild" untuk memproses dokumen
5. **Lihat Chunks**: Verifikasi chunks berhasil dibuat

### 2. Akses User (Bertanya)
1. Klik **"Masuk User"**
2. **Ketik pertanyaan** yang berkaitan dengan dokumen yang sudah diupload
3. **Tekan Enter** atau klik "Tanya"
4. **Lihat jawaban** beserta sumber referensi

## 🔧 Tech Stack

| Komponen | Technology | Port |
|----------|------------|------|
| **Frontend** | React + Vite + React Router | 5173 |
| **Backend** | Express.js + Node.js | 8787 |
| **Indexer** | FastAPI + Python | 8000 |
| **Database** | Supabase (PostgreSQL + pgvector) | - |
| **Storage** | Supabase Storage | - |
| **AI Model** | Google Gemini + SentenceTransformer | - |

## 🔄 Flow Aplikasi

### Admin Flow:
1. **Upload PDF** → Frontend → Backend → Supabase Storage
2. **Trigger Rebuild** → Backend → Indexer `/process/document`
3. **Processing**: Extract PDF → Chunk → Embed → Save to DB

### User Flow:
1. **User Query** → Frontend → Backend `/chat/ask`
2. **Retrieval**: Backend → Indexer `/search` → Get relevant chunks
3. **Generation**: Chunks + Query → Gemini AI → Response
4. **Display**: Answer + Sources → User

## 🐛 Troubleshooting

### Error: "SUPABASE_URL not found"
```bash
# Pastikan file .env ada di folder yang benar
ls indexer/.env
ls tutor-cerdas-api/.env
```

### Error: "Row Level Security policy"
```sql
-- Jalankan di Supabase SQL Editor
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
```

### Error: "pgvector extension not found"
```sql
-- Jalankan di Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error: Frontend tidak bisa connect ke backend
```bash
# Cek apakah backend running
curl http://localhost:8787/health

# Cek CORS setting di backend .env
WEB_ORIGIN=http://localhost:5173
```

### Error: Python dependencies
```bash
cd indexer
pip install --upgrade pip
pip install -r requirements.txt

# Jika TensorFlow error
pip install tensorflow==2.15.0
```

## 📋 Health Check

Pastikan semua service berjalan:

```bash
# Backend health
curl http://localhost:8787/health

# Indexer health  
curl http://localhost:8000/health

# Frontend (buka di browser)
http://localhost:5173
```

## 🚀 Production Deployment

### Backend & Indexer → Railway
1. Connect GitHub repo ke Railway
2. Set environment variables di Railway dashboard
3. Update `VITE_API_URL` dengan Railway URL

### Frontend → Vercel/Netlify
1. Build: `npm run build`
2. Deploy dist folder
3. Set environment variables

## 📝 Development Notes

- **Hot Reload**: Semua service support hot reload untuk development
- **CORS**: Sudah dikonfigurasi untuk localhost development
- **Error Handling**: Check terminal logs untuk debugging
- **Database**: Data persist di Supabase, tidak hilang saat restart

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

---

**Dibuat dengan ❤️ untuk pembelajaran AI dan RAG**

🔗 **Links:**
- [Supabase Documentation](https://supabase.com/docs)
- [Google AI Studio](https://makersuite.google.com)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [React Documentation](https://react.dev)