'use client';

import { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
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

  // Formatkan tanggal
  const formatDate = (date) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return new Date(date).toLocaleString('id-ID', options).replace(',', '');
  };

  // Export Order Data
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

    // Format data
    const formattedOrders = data.orders.map(order => ({
      ...order,
      createdAt: formatDate(order.createdAt),
      updatedAt: formatDate(order.updatedAt)
    }));

    // Buat workbook baru
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Order Detail');

    // Dapatkan nama kolom dari object pertama
    const columns = Object.keys(formattedOrders[0]).map(key => ({
      header: key,
      key: key,
      width: 15
    }));

    worksheet.columns = columns;

    // Tambahkan data
    worksheet.addRows(formattedOrders);

    // Style untuk header
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '5CE65C' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FF000000' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
    });

    // Generate dan download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_laundry_${startDate}_to_${endDate}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export Income Data
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

    // Hitung pendapatan harian
    data.orders
      .filter((order) => order.status === 'Selesai')
      .forEach((order) => {
        const date = formatDate(order.createdAt).split(' ')[0];
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

    // Buat workbook baru
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pendapatan Harian');

    // Set kolom
    worksheet.columns = [
      { header: 'Tanggal', key: 'Tanggal', width: 15 },
      { header: 'Pendapatan', key: 'Pendapatan', width: 15 }
    ];

    // Tambah data
    worksheet.addRows(incomeArray);

    // Style untuk header
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '5CE65C' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FF000000' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
    });

    // Format kolom pendapatan sebagai currency
    worksheet.getColumn('Pendapatan').numFmt = '"Rp"#,##0';

    // Generate dan download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pendapatan_laundry_${startDate}_to_${endDate}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
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
