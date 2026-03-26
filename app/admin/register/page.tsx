'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || 'Đăng ký thành công!');
        // Auto redirect after 2 seconds
        setTimeout(() => {
          router.push('/admin/login');
        }, 2000);
      } else {
        setError(data.error || 'Đăng ký thất bại');
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Zap className="h-5 w-5 text-slate-900" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Haus Signs</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h2>
            <p className="text-sm text-slate-500 mt-1">Đăng ký để truy cập hệ thống quản trị</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm text-slate-900"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

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
                  placeholder="Ít nhất 6 ký tự"
                  required
                  minLength={6}
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm text-slate-900"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
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
                  Đang đăng ký...
                </span>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Đã có tài khoản?{' '}
            <Link href="/admin/login" className="text-amber-600 font-semibold hover:text-amber-700">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
