// src/components/admin/AdminErrorBoundary.tsx
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Kesalahan tidak dikenal',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin UI error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-center">
          <div className="admin-error-card">
            <h1>Halaman admin gagal dimuat</h1>
            <p>
              Muat ulang halaman. Jika masih gagal, tutup tab ini lalu buka kembali. Anda juga dapat
              membersihkan data situs untuk localhost di pengaturan browser.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={this.handleReload}
            >
              Muat ulang halaman
            </button>
            <p className="admin-error-card__detail">{this.state.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
