'use client';
import Link from 'next/link';
import LoginButton from '@/components/LoginButton';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { isLoggedIn } = useAuth();

  return (
    <main className="min-h-screen bg-[#dce8b2] text-center relative">

      {/* NAVBAR */}
      <nav className="w-full bg-[#328e6e] text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="w-1/3 text-left">
          <h1 className="font-bold text-xl">Laundry App</h1>
        </div>

        <div className="w-1/3 text-center">
          {isLoggedIn && (
            <Link href="/dashboard" className="text-white font-medium hover:underline">
              Dashboard
            </Link>
          )}
        </div>

        <div className="w-1/3">
          <LoginButton />
        </div>
      </nav>

      {/* Konten utama */}
      <div className="flex flex-col items-center justify-center p-6 mt-10">
        <h1 className="text-3xl font-bold mb-4 text-[#328e6e]">
          Selamat Datang di Laundry App
        </h1>
        <p className="mb-6 text-[#67ae6e] text-lg">
          Kelola order laundry dengan mudah dan cepat.
        </p>

        <div className="flex flex-col gap-4">
          {isLoggedIn && (
            <Link href="/order">
              <button className="bg-[#328e6e] text-white px-6 py-2 rounded hover:bg-[#67ae6e] transition">
                Buat Order Sekarang
              </button>
            </Link>
          )}

          <Link href="/queue">
            <button className="bg-[#328e6e] text-white px-6 py-2 rounded hover:bg-[#67ae6e] transition">
              Lihat Antrian
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
