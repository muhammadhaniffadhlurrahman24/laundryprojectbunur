'use client';
import Link from 'next/link';
import LoginButton from '@/components/LoginButton';
import { useAuth } from '@/context/AuthContext';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const { isLoggedIn } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-[#d7f0d6] font-sans text-gray-800">

      {/* NAVBAR */}
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-green-100 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="w-1/3 text-left">
          <h1 className="font-bold text-2xl text-[#2e7d61] tracking-tight">Laundry App</h1>
        </div>

        <div className="w-1/3 text-center">
          {isLoggedIn && (
            <Link href="/dashboard" className="text-[#2e7d61] font-medium hover:underline">
              Dashboard
            </Link>
          )}
        </div>

        <div className="w-1/3 text-right">
          <LoginButton />
        </div>
      </nav>

      {/* Konten utama */}
      <section className="flex flex-col items-center justify-center px-6 py-20">
        <div className="bg-white shadow-xl border border-green-100 rounded-3xl p-10 max-w-xl w-full text-center space-y-6">
          <div className="flex justify-center items-center text-[#2e7d61]">
            <Sparkles size={36} className="mr-2" />
            <h1 className="text-4xl font-extrabold">Selamat Datang</h1>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            Kelola order laundry Anda dengan sistem modern yang simpel, cepat, dan efisien.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            {isLoggedIn && (
              <Link href="/order">
                <button className="bg-[#2e7d61] text-white px-6 py-2 rounded-xl shadow-md hover:bg-[#3f9d74] transition-all">
                  Buat Order
                </button>
              </Link>
            )}
            <Link href="/queue">
              <button className="border border-[#2e7d61] text-[#2e7d61] bg-white px-6 py-2 rounded-xl shadow-md hover:bg-[#e6f6ee] transition-all">
                Lihat Antrian
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
