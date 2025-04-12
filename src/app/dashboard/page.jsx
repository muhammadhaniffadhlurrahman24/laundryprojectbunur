'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    ordersToday: 0,
    ordersThisMonth: 0,
    selesaiToday: 0,
    selesaiMonth: 0,
    incomeToday: 0,
    incomeMonth: 0,
  });

  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrders = async (startDate, endDate) => {
    try {
      const res = await fetch(`/api/export?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Gagal ambil data order:', err);
      return null;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Gagal ambil statistik:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);


  const exportOrderData = async () => {
    if (!startDate || !endDate) {
      alert('Mohon pilih tanggal awal dan akhir.');
      return;
    }

    const data = await fetchOrders(startDate, endDate);
    if (!data || !data.orders) {
      alert('Data tidak ditemukan atau gagal mengambil data.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data.orders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Detail');

    const filename = `order_laundry_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const exportIncomeData = async () => {
    if (!startDate || !endDate) {
      alert('Mohon pilih tanggal awal dan akhir.');
      return;
    }

    const data = await fetchOrders(startDate, endDate);
    if (!data || !data.orders) {
      alert('Data tidak ditemukan atau gagal mengambil data.');
      return;
    }

    const pendapatanHarian = {};

    data.orders
      .filter((order) => order.status === 'Selesai')
      .forEach((order) => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        const harga = typeof order.harga === 'number' ? order.harga : parseInt(order.harga || '0');
        pendapatanHarian[date] = (pendapatanHarian[date] || 0) + harga;
      });

    const incomeArray = Object.entries(pendapatanHarian).map(([tanggal, total]) => ({
      Tanggal: tanggal,
      Pendapatan: total,
    }));

    const totalPendapatan = incomeArray.reduce((sum, item) => sum + item.Pendapatan, 0);
    incomeArray.push({
      Tanggal: 'Total',
      Pendapatan: totalPendapatan,
    });

    const worksheet = XLSX.utils.json_to_sheet(incomeArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendapatan Harian');

    const filename = `pendapatan_laundry_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="min-h-screen bg-[#f0f7e8] p-6">
      <Link href="/" className="text-[#328e6e] hover:underline mb-4 inline-block">
        ← Kembali
      </Link>

      <h1 className="text-2xl font-bold mb-6 text-[#328e6e] text-center">Dashboard Laundry</h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6 flex-wrap">
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <span className="text-gray-600">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        <button
          onClick={exportOrderData}
          className="bg-[#4c9b82] hover:bg-[#3c7c6a] text-white px-4 py-2 rounded-md shadow text-sm"
        >
          Export Orderan
        </button>

        <button
          onClick={exportIncomeData}
          className="bg-[#4c9b82] hover:bg-[#4b765b] text-white px-4 py-2 rounded-md shadow text-sm"
        >
          Export Pendapatan
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Memuat data statistik...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <StatCard label="Order Hari Ini" value={stats.ordersToday} />
          <StatCard label="Order Bulan Ini" value={stats.ordersThisMonth} />
          <StatCard label="Selesai Hari Ini" value={stats.selesaiToday} />
          <StatCard label="Selesai Bulan Ini" value={stats.selesaiMonth} />
          <StatCard label="Pendapatan Hari Ini" value={`Rp ${stats.incomeToday.toLocaleString('id-ID')}`} />
          <StatCard label="Pendapatan Bulan Ini" value={`Rp ${stats.incomeMonth.toLocaleString('id-ID')}`} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-[#cde2c4]">
      <h2 className="text-lg text-[#2f5e4e] font-semibold mb-2">{label}</h2>
      <p className="text-3xl font-bold text-[#328e6e]">{value}</p>
    </div>
  );
}
