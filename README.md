# 🤖 Tutor Cerdas - RAG dengan Gemini AI

Sistem pembelajaran cerdas yang menggunakan **Retrieval-Augmented Generation (RAG)** dengan Google Gemini AI untuk menjawab pertanyaan berdasarkan dokumen PDF yang diupload. Dilengkapi dengan sistem **authentication** dan **role-based access control** (Admin & User).

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│    Backend      │───▶│    Indexer      │───▶│   Supabase      │
│   (React)       │    │   (Express.js)  │    │   (FastAPI)     │    │  (PostgreSQL +  │
│   Port: 5173    │    │   Port: 8787    │    │   Port: 8000    │    │   pgvector +    │
│                 │    │                 │    │                 │    │   Auth)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                        │
        └─────────── Authentication & Role Management ────────────┘
                                              ┌─────────▼─────────┐
                                              │   Google Gemini   │
                                              │      AI API       │
                                              └───────────────────┘
```

## ✨ Features

- 🔐 **Authentication System** - Login/Register dengan Supabase Auth
- 👥 **Role-Based Access Control** - Admin (upload) & User (query)
- 📄 **PDF Processing** - Upload dan ekstraksi dokumen PDF
- 🔍 **RAG System** - Retrieval-Augmented Generation dengan pgvector
- 🤖 **AI Integration** - Google Gemini AI untuk response generation
- 🚀 **Real-time Updates** - Live processing status
- 📊 **Document Management** - Admin panel untuk manage dokumen

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

#### C. Buat Schema Database Lengkap

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabel untuk user profiles dan role management
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function untuk auto-create profile saat signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Tabel untuk menyimpan metadata dokumen
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  storage_path TEXT,
  file_path TEXT,
  size INTEGER,
  pages INTEGER,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'indexed', 'embedded', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan chunks dan embeddings
CREATE TABLE chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
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
  JOIN documents d ON c.document_id = d.id
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
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
```

#### E. Setup Storage Bucket

1. Go to **Storage** → **Create Bucket**
2. Nama bucket: `documents`
3. Set bucket sebagai private (untuk security)

### 2. Buat Admin User

#### A. Manual via Dashboard

1. Buka **Authentication** → **Users** di Supabase
2. Klik **Add User**
3. Isi email: `admin@example.com` dan password: `password123`
4. Setelah user dibuat, buka **Table Editor** → **user_profiles**
5. Edit user tersebut, ubah `role` menjadi `'admin'`

#### B. Via SQL (Alternative)

```sql
-- Insert manual admin user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token)
VALUES ('admin@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '');

-- Set sebagai admin di profile
INSERT INTO user_profiles (id, full_name, role)
SELECT id, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@example.com';
```

### 3. Setup Environment Variables

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
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Cara Mendapatkan API Keys

#### Google Gemini API Key:

1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Buat API key baru
3. Copy dan paste ke file `.env`

#### Supabase Keys:

1. Buka dashboard Supabase → **Settings** → **API**
2. Copy **Project URL**, **anon key**, dan **service_role key**
3. **anon key**: untuk frontend authentication
4. **service_role key**: untuk backend operations

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

### 1. Authentication

#### A. Register User Baru

1. Buka http://localhost:5173
2. Klik **"Register"**
3. Isi email, password, dan nama lengkap
4. Role default: `user`

#### B. Login Admin

1. Login dengan credentials admin:
   - Email: `admin@example.com`
   - Password: `password123`
2. Atau buat admin manual di Supabase dashboard

#### C. Login User

1. Login dengan user yang sudah register
2. Atau gunakan demo user jika tersedia

### 2. Admin Dashboard (Upload & Manage Dokumen)

Setelah login sebagai admin:

1. **Upload PDF**:
   - Drag & drop atau klik untuk pilih file PDF
   - File akan disimpan ke Supabase Storage
2. **Process Document**:
   - Klik tombol "Process" untuk index dokumen
   - Backend akan kirim ke Indexer untuk chunking & embedding
3. **Monitor Status**:

   - Status: `uploaded` → `indexed` → `embedded`
   - Lihat log processing di console

4. **Manage Documents**:
   - View semua dokumen yang sudah diupload
   - Delete dokumen jika diperlukan

### 3. User Interface (Chat & Query)

Setelah login sebagai user:

1. **Chat Interface**:
   - Interface chat sederhana untuk bertanya
2. **Submit Question**:
   - Ketik pertanyaan yang berkaitan dengan dokumen
   - Tekan Enter atau klik "Send"
3. **View Response**:
   - AI response berdasarkan RAG dari dokumen
   - Sertakan sumber/referensi chunks yang digunakan
4. **Chat History**:
   - History percakapan tersimpan per session

## 🔧 Tech Stack

| Komponen     | Technology                                  | Port |
| ------------ | ------------------------------------------- | ---- |
| **Frontend** | React + Vite + React Router + Supabase Auth | 5173 |
| **Backend**  | Express.js + Node.js                        | 8787 |
| **Indexer**  | FastAPI + Python                            | 8000 |
| **Database** | Supabase (PostgreSQL + pgvector + Auth)     | -    |
| **Storage**  | Supabase Storage                            | -    |
| **AI Model** | Google Gemini + SentenceTransformer         | -    |

## 🔄 Application Flow

### Authentication Flow:

1. **User Registration/Login** → Frontend → Supabase Auth
2. **Profile Creation** → Auto-trigger → user_profiles table
3. **Role Check** → Middleware → Route protection (Admin/User)

### Admin Flow (Document Management):

1. **Login as Admin** → Role: `admin` → Admin Dashboard
2. **Upload PDF** → Frontend → Backend → Supabase Storage
3. **Process Document** → Backend → Indexer `/process/document`
4. **Document Processing**:
   - Extract PDF content
   - Split into chunks
   - Generate embeddings
   - Store in database
5. **Status Updates**: `uploaded` → `indexed` → `embedded`

### User Flow (Chat & Query):

1. **Login as User** → Role: `user` → Chat Interface
2. **Submit Question** → Frontend → Backend `/chat/ask`
3. **Retrieval Process**:
   - Convert query to embedding
   - Similarity search in chunks table
   - Get top-k relevant chunks
4. **Generation Process**:
   - Chunks + Query → Google Gemini AI
   - Generate contextual response
5. **Display Response** → Answer + Source references → User

### Security & Access Control:

- **JWT Tokens**: Supabase handles authentication tokens
- **Route Protection**: Role-based access (Admin vs User routes)
- **API Security**: All backend endpoints require valid auth headers
- **CORS**: Configured for frontend-backend communication

## 🐛 Troubleshooting

### Authentication Errors

#### Error: "supabaseUrl is required"

```bash
# Pastikan .env file ada dan benar di frontend
cd tutor-cerdas-web
cat .env

# File harus berisi:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Restart frontend server
npm run dev
```

#### Error: "Invalid JWT" atau "Unauthorized"

```sql
-- Cek apakah user_profiles table ada
SELECT * FROM user_profiles LIMIT 1;

-- Cek apakah trigger auto-create profile aktif
\df handle_new_user
```

#### Error: "User not found in user_profiles"

```sql
-- Manual insert user profile
INSERT INTO user_profiles (id, full_name, role)
SELECT id, email, 'user'
FROM auth.users
WHERE email = 'user@example.com';
```

### Database Connection Errors

#### Error: "SUPABASE_URL not found"

```bash
# Pastikan file .env ada di folder yang benar
ls indexer/.env
ls tutor-cerdas-api/.env

# Restart services setelah update .env
```

#### Error: "Row Level Security policy"

```sql
-- Jalankan di Supabase SQL Editor
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
```

#### Error: "pgvector extension not found"

```sql
-- Jalankan di Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Frontend Connection Issues

#### Error: Frontend tidak bisa connect ke backend

```bash
# Cek apakah backend running
curl http://localhost:8787/health

# Cek CORS setting di backend .env
WEB_ORIGIN=http://localhost:5173

# Cek browser console untuk CORS errors
```

#### Error: "Network Error" di frontend

```env
# Pastikan API URL benar di frontend .env
VITE_API_URL=http://localhost:8787

# Bukan https jika development lokal
```

### Backend & API Issues

#### Error: Python dependencies

```bash
cd indexer
pip install --upgrade pip
pip install -r requirements.txt

# Jika TensorFlow error
pip install tensorflow==2.15.0

# Install spaCy model
python -m spacy download en_core_web_sm
```

#### Error: "Gemini API key invalid"

```bash
# Verify API key di Google AI Studio
# Pastikan key tidak expired dan memiliki akses ke model
```

## 📋 Health Check & Testing

### Authentication Test

```bash
# Test user registration via API
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Test user login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Service Health Checks

```bash
# Backend health
curl http://localhost:8787/health

# Indexer health
curl http://localhost:8000/health

# Frontend (buka di browser)
http://localhost:5173
```

### Database Verification

```sql
-- Check if all tables exist
\dt

-- Verify user_profiles structure
\d user_profiles

-- Check if admin user exists
SELECT email, role FROM auth.users
JOIN user_profiles ON auth.users.id = user_profiles.id
WHERE role = 'admin';

-- Test similarity search function
SELECT * FROM match_chunks(
  array[0.1,0.2,0.3]::vector(3), -- dummy embedding
  5
);
```

### Frontend Authentication Test

1. **Registration Flow**:

   - Buka http://localhost:5173
   - Klik "Register" → isi form → submit
   - Check browser console untuk errors

2. **Login Flow**:

   - Login dengan admin: `admin@example.com` / `password123`
   - Verify role-based redirect (Admin vs User interface)

3. **Protected Routes**:
   - Try access admin routes as user (should redirect)
   - Try access without login (should redirect to login)

## 🚀 Production Deployment

### Environment Variables untuk Production

#### Backend Production (.env)

```env
NODE_ENV=production
PORT=8787

# Supabase Production
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_KEY=prod-service-key

# API Keys
GEMINI_API_KEY=your-gemini-api-key

# Production URLs
INDEXER_URL=https://your-indexer.railway.app
WEB_ORIGIN=https://your-frontend.vercel.app
```

#### Frontend Production (.env.production)

```env
VITE_API_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
```

### Deployment Steps

#### Backend & Indexer → Railway

1. Connect GitHub repo ke Railway
2. Set environment variables di Railway dashboard
3. Deploy backend dan indexer secara terpisah
4. Update CORS origins untuk production

#### Frontend → Vercel/Netlify

1. Build: `npm run build`
2. Deploy dist folder
3. Set environment variables di dashboard
4. Update API URLs ke production backend

### Production Security Checklist

#### Supabase Security

```sql
-- Enable RLS untuk production
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage documents" ON documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### API Security

- ✅ Enable HTTPS only
- ✅ Set secure CORS origins
- ✅ Rate limiting on auth endpoints
- ✅ Input validation & sanitization
- ✅ Secure JWT token handling

## 📝 Development Notes

### Authentication Architecture

- **Supabase Auth**: Handles user registration, login, JWT tokens
- **User Profiles**: Extended user data with roles stored in custom table
- **Auto Profile Creation**: Trigger automatically creates profile on user signup
- **Role-Based Access**: Middleware checks user roles for protected routes

### Development Features

- **Hot Reload**: Semua service support hot reload untuk development
- **CORS**: Sudah dikonfigurasi untuk localhost development
- **Error Handling**: Check terminal logs untuk debugging
- **Database**: Data persist di Supabase, tidak hilang saat restart
- **Authentication State**: React Context API untuk global auth state management

### Security Considerations

- **JWT Tokens**: Auto-handled oleh Supabase client
- **Password Hashing**: Supabase handles bcrypt automatically
- **Session Management**: Persistent sessions dengan refresh tokens
- **Route Protection**: Higher-order components untuk protected routes

### Database Schema Notes

- **user_profiles**: Extends auth.users dengan custom fields
- **Role System**: Simple role-based dengan `user` dan `admin`
- **Foreign Keys**: Proper relationships dengan CASCADE delete
- **Triggers**: Auto-create profiles untuk seamless UX