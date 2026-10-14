import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorMessage } from './ui';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

/** Menangkap error render (termasuk gagal memuat chunk saat offline) agar halaman tidak blank. */
export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DevKit error:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage>
          Tool ini tidak dapat ditampilkan. Jika Anda sedang offline dan baru pertama kali membukanya, sambungkan internet lalu muat ulang
          halaman.
        </ErrorMessage>
      );
    }
    return this.props.children;
  }
}
