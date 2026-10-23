// src/components/admin/LoginScreen.tsx
import { useState, useEffect } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => void;
  error: string;
}

export default function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sembunyikan top navbar dan hapus padding-top body khusus di halaman login
  useEffect(() => {
    const nav = document.querySelector('.floating-nav') as HTMLElement;
    if (nav) nav.style.display = 'none';
    document.body.style.paddingTop = '0px';

    return () => {
      if (nav) nav.style.display = '';
      document.body.style.paddingTop = '';
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onLogin(email, password);
    setSubmitting(false);
  }

  return (
    <>
      <style>{`
        /* Reset & Layout Utama */
        .login-layout {
          display: flex;
          min-height: 100vh;
          background-color: #FFFFFF;
          font-family: 'DM Sans', sans-serif;
          color: #0F172A;
        }

        /* Tautan Kembali ke Beranda */
        .back-to-home {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64748B;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 20px;
          transition: color 0.2s;
        }
        .back-to-home:hover {
          color: #0F172A;
        }

        /* Kolom Kiri: Visual */
        .login-visual {
          flex: 1;
          display: none;
          padding: 16px;
        }

        @media (min-width: 900px) {
          .login-visual {
            display: block;
          }
        }

        .login-visual-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 32px;
          background-color: #F8FAFC;
          background-image: url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .login-visual-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(15,23,42,0.1), rgba(15,23,42,0.8));
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
        }

        .login-visual-text h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 12px 0;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .login-visual-text p {
          font-size: 1.1rem;
          color: #E2E8F0;
          margin: 0;
        }

        /* Kolom Kanan: Formulir */
        .login-form-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 24px;
        }

        .login-form-container {
          width: 100%;
          max-width: 380px;
        }

        .login-logo {
          height: 56px;
          margin-bottom: 32px;
          object-fit: contain;
        }

        .login-header {
          margin-bottom: 32px;
        }

        .login-header h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.8rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 8px 0;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }

        .login-header p {
          font-size: 1.05rem;
          color: #64748B;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-input-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #334155;
        }

        .login-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 1rem;
          font-family: 'DM Sans', sans-serif;
          color: #0F172A;
          background-color: #FFFFFF;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .login-input:focus {
          border-color: #0F172A;
          box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
        }

        .login-input::placeholder {
          color: #94A3B8;
        }

        .login-btn {
          margin-top: 12px;
          width: 100%;
          padding: 16px;
          background-color: #0F172A;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .login-btn:hover:not(:disabled) {
          background-color: #1E293B;
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-alert {
          background-color: #FEF2F2;
          color: #991B1B;
          padding: 12px 16px;
          border: 1px solid #FECACA;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: left;
        }
      `}</style>

      <div className="login-layout">
        <div className="login-visual">
          <div className="login-visual-inner">
            <div className="login-visual-overlay">
              <div className="login-visual-text">
                <h2>SMKIT As-Syifa</h2>
                <p>Sistem Informasi Manajemen Open House</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-area">
          <div className="login-form-container">
            
            {/* Tautan Kembali ke Beranda */}
            <a href="/" className="back-to-home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Beranda
            </a>

            <img 
              src="/images/logo.png" 
              alt="Logo SMKIT As-Syifa" 
              className="login-logo" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />

            <div className="login-header">
              <h1>Portal Panitia</h1>
              <p>Silakan masuk ke ruang kerja Anda.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && <div className="login-alert" role="alert">{error}</div>}
              
              <div className="login-input-group">
                <label htmlFor="email">Alamat Email</label>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  placeholder="Ketik email terdaftar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password">Kata Sandi</label>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  placeholder="Ketik kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="login-btn" disabled={submitting}>
                {submitting ? 'Memproses Akses...' : 'Masuk Dasbor'}
              </button>
            </form>
            
          </div>
        </div>
      </div>
    </>
  );
}