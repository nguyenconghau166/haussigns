'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import { Eye, EyeOff, Zap, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackError = searchParams.get('error');
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(data.error || 'Đăng nhập thất bại');
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setError('Lỗi kết nối Google. Vui lòng thử lại.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Zap className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Haus Signs</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">AI Admin Panel</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Quản lý doanh nghiệp<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              thông minh hơn
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Hệ thống quản trị AI tự động cho doanh nghiệp biển hiệu. Tối ưu vận hành, tăng hiệu suất.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 max-w-md">
            {[
              { label: 'AI Pipeline', desc: 'Viết bài tự động' },
              { label: 'SEO & AIO', desc: 'Tối ưu tìm kiếm' },
              { label: 'Quản lý kho', desc: 'Vật liệu & sản phẩm' },
              { label: 'Phân quyền', desc: 'Bảo mật đa cấp' },
            ].map((feature) => (
              <div key={feature.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3">
                <p className="text-sm font-semibold text-white">{feature.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-slate-900" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Haus Signs</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
              <p className="text-sm text-slate-500 mt-1">Truy cập hệ thống quản trị</p>
            </div>

            {/* Error messages */}
            {(error || callbackError) && (
              <div className="mb-6 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">
                  {error || 'Đăng nhập Google thất bại. Vui lòng thử lại.'}
                </p>
              </div>
            )}

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span className="text-sm font-semibold text-slate-700">
                {googleLoading ? 'Đang kết nối...' : 'Đăng nhập bằng Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">hoặc đăng nhập bằng email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm text-slate-900"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm text-slate-900"
                    placeholder="Nhập mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Chưa có tài khoản?{' '}
              <Link href="/admin/register" className="text-amber-600 font-semibold hover:text-amber-700">
                Đăng ký
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2026 Haus Signs. Hệ thống quản trị AI.
          </p>
        </div>
      </div>
    </div>
  );
}
