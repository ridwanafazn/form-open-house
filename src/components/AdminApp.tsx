// src/components/AdminApp.tsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Screen } from './admin/types';
import AdminErrorBoundary from './admin/AdminErrorBoundary';
import LoginScreen from './admin/LoginScreen';
import ListScreen from './admin/ListScreen';
import '../styles/admin.css';

// Manipulasi DOM ke Astro Navbar
// Avatar inisial dibuat lokal (SVG data URI) supaya tidak bergantung CDN pihak ketiga
// seperti dicebear — domain tersebut diblokir CSP (img-src 'self' data:) dan
// menyebabkan gambar rusak di navbar.
function buildInitialsAvatar(displayName: string): string {
  const initials =
    displayName
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A';

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">' +
    '<rect width="52" height="52" rx="13" fill="#064E3B"/>' +
    `<text x="26" y="33" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">${initials}</text>` +
    '</svg>';

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function showAdminProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string };
}) {
  const wrap = document.getElementById('admin-nav-user');
  const name = document.getElementById('admin-nav-name');
  const avatar = document.getElementById('admin-nav-avatar');
  if (!wrap || !name || !avatar) return;

  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Admin';
  name.textContent = displayName;
  avatar.src = buildInitialsAvatar(displayName);
  wrap.hidden = false;

  try {
    localStorage.setItem('oh_admin_email', user.email ?? '');
  } catch {
    // Abaikan jika storage tidak tersedia
  }
}

function hideAdminProfile() {
  const wrap = document.getElementById('admin-nav-user');
  if (wrap) wrap.hidden = true; // Mencegah kebocoran Auth State
}

export default function AdminApp() {
  return (
    <AdminErrorBoundary>
      <AdminAppInner />
    </AdminErrorBoundary>
  );
}

function AdminAppInner() {
  const [screen, setScreen] = useState<Screen>('login');
  const [loginError, setLoginError] = useState('');
  const [configError, setConfigError] = useState('');
  const authCheckRunning = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setConfigError('Konfigurasi Supabase belum lengkap. Periksa file .env Anda.');
      return;
    }

    // Sembunyikan navbar admin di awal sebelum sesi terverifikasi
    hideAdminProfile();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setScreen('checking');
      }
    });
  }, []);

  useEffect(() => {
    const onNavLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      hideAdminProfile();
      try {
        localStorage.removeItem('oh_admin_email');
      } catch {
        // Abaikan
      }
      setScreen('login');
      setLoginError('');
    };

    window.addEventListener('admin-logout', onNavLogout);
    return () => window.removeEventListener('admin-logout', onNavLogout);
  }, []);

  async function handleLogin(email: string, password: string) {
    if (!supabase) return;
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginError('Email atau kata sandi tidak cocok.');
        return;
      }
      setScreen('checking');
    } catch {
      setLoginError('Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
    }
  }

  async function handleAdminCheck() {
    if (!supabase) {
      setScreen('login');
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        hideAdminProfile();
        setScreen('login');
        return;
      }

      const { data, error } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        await supabase.auth.signOut();
        hideAdminProfile();
        setLoginError('Akun ini tidak memiliki hak akses sebagai panitia Admin.');
        setScreen('login');
        return;
      }

      showAdminProfile(user);
      setScreen('list');
    } catch {
      hideAdminProfile();
      setLoginError('Gagal memeriksa akses admin. Periksa koneksi lalu masuk kembali.');
      setScreen('login');
    }
  }

  useEffect(() => {
    if (screen !== 'checking' || authCheckRunning.current) return;
    authCheckRunning.current = true;
    void handleAdminCheck().finally(() => {
      authCheckRunning.current = false;
    });
  }, [screen]);

  if (configError) {
    return (
      <div className="admin-center admin-error">
        <p>{configError}</p>
      </div>
    );
  }

  if (screen === 'login') {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  if (screen === 'checking') {
    return (
      <div className="admin-center">
        <p>Memeriksa otorisasi...</p>
      </div>
    );
  }

  if (screen === 'list' || screen === 'detail') {
    return <ListScreen setScreen={setScreen} />;
  }

  return null;
}
