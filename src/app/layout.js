// src/app/layout.js
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider }  from '@/context/AuthContext';

export const metadata = {
  title: 'Laundry App',
  description: 'Aplikasi pemantauan dan pemesanan laundry',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <AuthProvider>
      <body className="bg-gray-100">{children}
        <Toaster />
      </body>
      </AuthProvider>
    </html>
  );
}
