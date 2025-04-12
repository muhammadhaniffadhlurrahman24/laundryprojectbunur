/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}", // memindai seluruh file di src
      "./pages/**/*.{js,ts,jsx,tsx}", // opsional, jika kamu punya folder pages
      "./components/**/*.{js,ts,jsx,tsx}", // pastikan folder components ikut discan
    ],
    theme: {
      extend: {
        colors: {
          primary: '#2563eb', // contoh warna tambahan
          secondary: '#4ade80',
        },
        spacing: {
          '128': '32rem',
          '144': '36rem',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'), // plugin opsional, bisa dihapus kalau nggak dipakai
      require('@tailwindcss/typography'),
      require('@tailwindcss/aspect-ratio'),
    ],
  }
  