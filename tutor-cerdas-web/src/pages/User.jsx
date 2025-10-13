import { useAuth } from '../contexts/AuthContext';
import { useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
if (!API_BASE) console.warn('[User] VITE_API_URL belum di-set')

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }

.up-scope {
  --bg:#0b1020; 
  --panel:rgba(15, 21, 42, 0.85); 
  --muted:#9aa8c1; 
  --text:#e9eef6;
  --line:rgba(255,255,255,.12); 
  --soft:rgba(255,255,255,.06);
  --brand:#6c9ef8;
  --brand-dark:#5f7aff;
  --ok:#34d399; 
  --warn:#f59e0b; 
  --danger:#ef4444;
  --shadow: rgba(0, 0, 0, 0.15);
  --shadow-md: rgba(0, 0, 0, 0.25);
  --shadow-lg: rgba(0, 0, 0, 0.3);
  --slider-track: rgba(255,255,255,.15);
  --slider-bg: rgba(255,255,255,.08);
  color: var(--text);
}

@media (prefers-color-scheme: light){
  .up-scope{ 
    --bg:#f7f9fd; 
    --panel:rgba(255, 255, 255, 0.85); 
    --text:#0b1020; 
    --muted:#62708a; 
    --line:#d1d9e6; 
    --soft:#f0f4f8;
    --brand:#4a90e2;
    --brand-dark:#3a7bc8;
    --shadow: rgba(0, 0, 0, 0.05);
    --shadow-md: rgba(0, 0, 0, 0.08);
    --shadow-lg: rgba(0, 0, 0, 0.08);
    --slider-track: #d1d9e6;
    --slider-bg: #e8ecf1;
  }
}

:root[data-theme="dark"] .up-scope {
  --bg:#0b1020;
  --panel: rgba(15, 21, 42, 0.85);
  --text:#e9eef6;
  --muted:#9aa8c1;
  --line:rgba(255,255,255,.12);
  --soft:rgba(255,255,255,.06);
  --shadow-lg: rgba(0, 0, 0, 0.3);
  --slider-track: rgba(255,255,255,.15);
  --slider-bg: rgba(255,255,255,.08);
}

:root[data-theme="light"] .up-scope {
  --bg:#f7f9fd;
  --panel: rgba(255, 255, 255, 0.85);
  --text:#0b1020;
  --muted:#62708a;
  --line:#d1d9e6;
  --soft:#f0f4f8;
  --shadow-lg: rgba(0, 0, 0, 0.08);
  --slider-track: #d1d9e6;
  --slider-bg: #e8ecf1;
}

.up-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  transition: background 0.3s ease;
}

/* Light Mode Background */
:root[data-theme="light"] .up-container {
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(102, 126, 234, 0.15) 0%, transparent 70%),
    radial-gradient(1000px 500px at 110% 10%, rgba(99, 225, 179, 0.15) 0%, transparent 65%),
    linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
}

/* Dark Mode Background */
:root[data-theme="dark"] .up-container {
  background:
    radial-gradient(1200px 600px at 10% -10%, #1a2249 0%, transparent 70%),
    radial-gradient(1000px 500px at 110% 10%, #0b614d 0%, transparent 65%),
    linear-gradient(180deg, #0b1020 0%, #0a0d18 100%);
}

@media (prefers-color-scheme: light) {
  .up-container {
    background:
      radial-gradient(1200px 600px at 10% -10%, rgba(102, 126, 234, 0.15) 0%, transparent 70%),
      radial-gradient(1000px 500px at 110% 10%, rgba(99, 225, 179, 0.15) 0%, transparent 65%),
      linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  }
}

@media (prefers-color-scheme: dark) {
  .up-container {
    background:
      radial-gradient(1200px 600px at 10% -10%, #1a2249 0%, transparent 70%),
      radial-gradient(1000px 500px at 110% 10%, #0b614d 0%, transparent 65%),
      linear-gradient(180deg, #0b1020 0%, #0a0d18 100%);
  }
}

.up-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 20px;
}

@media (min-width: 768px) {
  .up-wrap {
    padding: 32px 24px;
    gap: 24px;
  }
}

.up-header {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--line);
}

@media (min-width: 768px) {
  .up-header {
    padding-bottom: 24px;
  }
}

.up-title {
  font-size: clamp(24px, 4vw, 42px);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.up-sub {
  color: var(--muted);
  font-size: 13px;
  margin-top: 6px;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .up-sub {
    font-size: 14px;
    margin-top: 8px;
  }
}

.up-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 24px var(--shadow-lg);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

@media (min-width: 768px) {
  .up-card {
    padding: 24px;
  }
}

:root[data-theme="dark"] .up-card {
  background: rgba(15, 21, 42, 0.85);
}

:root[data-theme="light"] .up-card {
  background: rgba(255, 255, 255, 0.85);
}

.up-card:hover {
  box-shadow: 0 12px 32px var(--shadow-lg);
}

.up-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  gap: 12px;
  flex-wrap: wrap;
}

.up-card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

@media (min-width: 768px) {
  .up-card-title {
    font-size: 20px;
  }
}

.up-input-group {
  display: grid;
  gap: 12px;
}

@media (min-width: 768px) {
  .up-input-group {
    gap: 16px;
  }
}

.up-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--soft);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .up-textarea {
    padding: 14px 16px;
    font-size: 15px;
    min-height: 120px;
  }
}

.up-textarea:focus {
  border-color: var(--brand);
  background: var(--panel);
  box-shadow: 0 0 0 3px rgba(108, 158, 248, 0.15);
}

.up-textarea::placeholder {
  color: var(--muted);
}

.up-btn {
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (min-width: 768px) {
  .up-btn {
    font-size: 15px;
    padding: 12px 24px;
  }
}

.up-btn-primary {
  background: linear-gradient(135deg, #7ba3ff 0%, #5f7aff 100%);
  color: white;
  box-shadow: 0 4px 12px var(--shadow);
}

.up-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-md);
}

.up-btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.up-btn-secondary {
  background: var(--soft);
  color: var(--text);
  border: 1px solid var(--line);
  padding: 8px 16px;
  font-size: 13px;
}

.up-btn-secondary:hover:not(:disabled) {
  background: var(--line);
  border-color: var(--brand);
}

.up-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.up-slider-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--slider-bg);
  border-radius: 12px;
  border: 1px solid var(--line);
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .up-slider-group {
    padding: 14px 18px;
  }
}

.up-slider-label {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .up-slider-label {
    font-size: 14px;
  }
}

.up-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--slider-track);
  outline: none;
  cursor: pointer;
  flex: 1;
  min-width: 120px;
}

@media (min-width: 768px) {
  .up-range {
    width: 180px;
    flex: 0;
  }
}

.up-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--brand);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px var(--shadow);
}

.up-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(108, 158, 248, 0.4);
}

.up-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--brand);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px var(--shadow);
}

.up-range::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(108, 158, 248, 0.4);
}

.up-chip {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--brand);
  color: white;
  box-shadow: 0 2px 4px var(--shadow);
}

@media (min-width: 768px) {
  .up-chip {
    font-size: 13px;
  }
}

.up-chip-secondary {
  background: var(--soft);
  color: var(--muted);
  border: 1px solid var(--line);
  box-shadow: none;
}

.up-answer {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text);
  white-space: pre-wrap;
  word-wrap: break-word;
}

@media (min-width: 768px) {
  .up-answer {
    font-size: 16px;
  }
}

.up-empty {
  text-align: center;
  padding: 24px 16px;
  color: var(--muted);
  font-style: italic;
  font-size: 14px;
}

@media (min-width: 768px) {
  .up-empty {
    padding: 32px;
  }
}

.up-alert {
  padding: 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
}

@media (min-width: 768px) {
  .up-alert {
    padding: 16px;
    font-size: 14px;
  }
}

.up-alert-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.up-src-list {
  display: grid;
  gap: 12px;
}

@media (min-width: 768px) {
  .up-src-list {
    gap: 16px;
  }
}

.up-src-item {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  background: var(--soft);
  transition: all 0.2s ease;
}

@media (min-width: 768px) {
  .up-src-item {
    padding: 16px;
  }
}

.up-src-item:hover {
  border-color: var(--brand);
  box-shadow: 0 4px 12px var(--shadow);
  transform: translateY(-1px);
}

.up-src-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .up-src-header {
    gap: 16px;
  }
}

.up-src-info {
  flex: 1;
  min-width: 0;
}

.up-src-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--text);
  word-break: break-word;
}

@media (min-width: 768px) {
  .up-src-title {
    font-size: 15px;
  }
}

.up-src-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--muted);
}

@media (min-width: 768px) {
  .up-src-meta {
    gap: 16px;
    font-size: 13px;
  }
}

.up-src-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.up-preview {
  margin-top: 12px;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  max-height: 250px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  word-break: break-word;
}

@media (min-width: 768px) {
  .up-preview {
    padding: 16px;
    max-height: 300px;
    font-size: 14px;
  }
}

.up-preview::-webkit-scrollbar {
  width: 6px;
}

.up-preview::-webkit-scrollbar-track {
  background: var(--soft);
  border-radius: 4px;
}

.up-preview::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 4px;
}

.up-preview::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

.up-mono {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  background: var(--soft);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  word-break: break-all;
}

.up-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--brand);
  font-size: 13px;
}

@media (min-width: 768px) {
  .up-loading {
    font-size: 14px;
  }
}

.up-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.up-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: var(--brand);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  box-shadow: 0 2px 4px var(--shadow);
}

.up-full-btn {
  width: 100%;
}
`

export default function User() {
  const { getAuthHeader } = useAuth();
  const [q, setQ] = useState('');
  const [k, setK] = useState(6);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [peek, setPeek] = useState({});

  const api = useMemo(() => API_BASE, []);

  function norm(str='') { return (str || '').replace(/\s+/g,' ').trim() }

  async function ask() {
    const question = norm(q)
    if (!question) return
    if (!api) { setError('VITE_API_URL belum di-set'); return }
    setLoading(true); setError(''); setAnswer(''); setSources([]); setPeek({})

    try {
      const authHeader = getAuthHeader()
      const headers = {
        'Content-Type':'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
      const r = await fetch(`${api}/chat/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question, role: 'user', top_k: k })
      })
      
      if (r.status === 401) {
        window.location.href = '/login'
        return
      }
      const text = await r.text()
      const data = text ? JSON.parse(text) : {}
      if (!r.ok) throw new Error(data?.error || data?.message || `HTTP ${r.status}`)
      setAnswer(data?.answer ?? '(tidak ada jawaban)')
      setSources(Array.isArray(data?.sources) ? data.sources : [])
    } catch (e) {
      setAnswer('')
      setError(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  }

  async function togglePreview(docId, idx) {
    const key = `${docId}:${idx}`
    if (peek[key]) {
      const n = { ...peek }; delete n[key]; setPeek(n); return
    }
    try {
      const authHeader = getAuthHeader()
      const headers = authHeader ? { 'Authorization': authHeader } : {}
      const url = `${api}/documents/${docId}/chunks?limit=1&offset=${idx}`
      const r = await fetch(url, { headers })
      const j = await r.json()
      const item = j?.items?.[0]
      setPeek(p => ({ ...p, [key]: item?.content || '(chunk kosong)' }))
    } catch(e) {
      setPeek(p => ({ ...p, [key]: `(gagal memuat chunk: ${e.message})` }))
    }
  }

  return (
    <div className="up-scope">
      <style>{styles}</style>

      <div className="up-container">
        <div className="up-wrap">
          {/* Header */}
          <div className="up-header">
            <h1 className="up-title">Tanya Materi</h1>
            <p className="up-sub">
              Ajukan pertanyaan dan dapatkan jawaban dari knowledge base
            </p>
            <p className="up-sub">
              API Endpoint: <span className="up-mono">{api || '(belum dikonfigurasi)'}</span>
            </p>
          </div>

          {/* Form Input */}
          <div className="up-card">
            <div className="up-card-header">
              <h3 className="up-card-title">📝 Pertanyaan Anda</h3>
            </div>
            
            <div className="up-input-group">
              <textarea
                className="up-textarea"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ketik pertanyaan Anda di sini...&#10;&#10;Tips: Tekan Enter untuk mengirim, Shift+Enter untuk baris baru"
              />
              
              <div className="up-slider-group">
                <span className="up-slider-label">Jumlah Konteks (Top-K):</span>
                <input
                  className="up-range"
                  type="range"
                  min={3}
                  max={10}
                  step={1}
                  value={k}
                  onChange={e => setK(Number(e.target.value))}
                  title={`Ambil ${k} konteks teratas dari retriever`}
                />
                <span className="up-chip">{k}</span>
              </div>

              <button 
                className="up-btn up-btn-primary up-full-btn" 
                onClick={ask} 
                disabled={loading}
              >
                {loading ? '⏳ Memproses...' : '🚀 Kirim Pertanyaan'}
              </button>
            </div>
          </div>

          {/* Jawaban */}
          <div className="up-card">
            <div className="up-card-header">
              <h3 className="up-card-title">💡 Jawaban</h3>
              {loading && (
                <div className="up-loading">
                  <div className="up-spinner"></div>
                  <span>Menyusun jawaban...</span>
                </div>
              )}
            </div>
            
            {error ? (
              <div className="up-alert up-alert-danger">
                ⚠️ <strong>Error:</strong> {error}
              </div>
            ) : answer ? (
              <div className="up-answer">{answer}</div>
            ) : (
              <div className="up-empty">
                Belum ada jawaban. Silakan ajukan pertanyaan terlebih dahulu.
              </div>
            )}
          </div>

          {/* Sumber */}
          <div className="up-card">
            <div className="up-card-header">
              <h3 className="up-card-title">📚 Sumber Referensi</h3>
              {sources.length > 0 && (
                <span className="up-badge">{sources.length}</span>
              )}
            </div>

            {sources.length === 0 ? (
              <div className="up-empty">
                Belum ada sumber referensi. Ajukan pertanyaan untuk melihat sumber yang digunakan.
              </div>
            ) : (
              <div className="up-src-list">
                {sources.map((s, i) => {
                  const key = `${s.document_id}:${s.chunk_index}`
                  return (
                    <div key={key} className="up-src-item">
                      <div className="up-src-header">
                        <div className="up-src-info">
                          <div className="up-src-title">
                            📄 [{i + 1}] Dokumen: <span className="up-mono">{s.document_id}</span>
                          </div>
                          <div className="up-src-meta">
                            <span>🔢 Chunk: <strong>#{s.chunk_index}</strong></span>
                            {'similarity' in s && (
                              <span>📊 Similarity: <strong>{Number(s.similarity).toFixed(3)}</strong></span>
                            )}
                            <span className="up-chip up-chip-secondary">{key}</span>
                          </div>
                        </div>
                        
                        <button 
                          className="up-btn up-btn-secondary"
                          onClick={() => togglePreview(s.document_id, s.chunk_index)}
                        >
                          {peek[key] ? '👁️ Tutup' : '👁️ Lihat'}
                        </button>
                      </div>

                      {peek[key] && (
                        <div className="up-preview">
                          {peek[key]}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}