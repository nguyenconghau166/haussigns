import AdminSidebar from '@/components/admin/Sidebar';
import { AuthProvider } from '@/components/admin/AuthProvider';
import { ToastProvider } from '@/components/ui/toast';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Admin Dashboard - SignsHaus AI',
  description: 'Quản lý nội dung và vận hành AI tự động cho doanh nghiệp biển hiệu.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className={`flex min-h-screen bg-slate-50 font-sans ${inter.className}`}>
          <AdminSidebar />
          <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300">
            {children}
          </main>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
