'use client';

import { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

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

  // Export Report Laundry
  const exportLaundryReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Mohon pilih tanggal awal dan akhir.');
      return;
    }

    // Validasi tanggal
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (endDateTime < startDateTime) {
      toast.error('Tanggal akhir tidak boleh lebih awal dari tanggal awal.');
      return;
    }

    const data = await fetchOrders(startDate, endDate);
    if (!data || !data.orders) {
      toast.error('Data tidak ditemukan atau gagal mengambil data.');
      return;
    }

    // Format data orderan
    const formattedOrders = data.orders.map((order, index) => ({
      No: index + 1,
      Nama: order.nama || '',
      'No HP': order.noHp || '',
      Berat: order.berat || 0,
      Harga: order.harga || 0,
      'Tipe Layanan': order.tipe || '',
      'Jenis Order': order.orderType || '',
      'Jenis Item': order.jenis || '',
      Catatan: order.catatan || '',
      Status: order.status || '',
      'Tanggal Order': formatDate(order.createdAt),
      'Tanggal Update': formatDate(order.updatedAt)
    }));

    // Buat workbook baru
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Laundry');

    // Set kolom untuk data orderan
    worksheet.columns = [
      { header: 'No', key: 'No', width: 5 },
      { header: 'Nama', key: 'Nama', width: 20 },
      { header: 'No HP', key: 'No HP', width: 15 },
      { header: 'Berat', key: 'Berat', width: 10 },
      { header: 'Harga', key: 'Harga', width: 15 },
      { header: 'Tipe Layanan', key: 'Tipe Layanan', width: 15 },
      { header: 'Jenis Order', key: 'Jenis Order', width: 15 },
      { header: 'Jenis Item', key: 'Jenis Item', width: 15 },
      { header: 'Catatan', key: 'Catatan', width: 25 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Tanggal Order', key: 'Tanggal Order', width: 20 },
      { header: 'Tanggal Update', key: 'Tanggal Update', width: 20 }
    ];

    // Tambah data orderan
    worksheet.addRows(formattedOrders);

    // Style untuk header
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'b5e550' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FF000000' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    // Tambahkan border untuk data cells
    formattedOrders.forEach((_, rowIndex) => {
      const currentRow = rowIndex + 2; // +2 karena header adalah row 1
      worksheet.getRow(currentRow).eachCell((cell, colNumber) => {
        // Default border untuk semua cell
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Border untuk sel paling kiri
        if (colNumber === 1) {
          cell.border.left = { style: 'medium' };
        }
        // Border untuk sel paling kanan
        if (colNumber === worksheet.columns.length) {
          cell.border.right = { style: 'medium' };
        }
      });

      // Jika ini adalah baris terakhir, tambahkan border bawah medium
      if (rowIndex === formattedOrders.length - 1) {
        worksheet.getRow(currentRow).eachCell(cell => {
          cell.border.bottom = { style: 'medium' };
        });
      }
    });

    // Style untuk kolom nomor dan alignment
    worksheet.getColumn('No').eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
      }
    });

    // Format kolom Harga sebagai currency
    worksheet.getColumn('Harga').numFmt = '"Rp"#,##0';
    worksheet.getColumn('Berat').numFmt = '#,##0.00 "Kg"';

    // Tambah ringkasan pendapatan di samping kanan
    const summaryStartRow = 2;
    const summaryCol = worksheet.columns.length + 2; // 2 kolom kosong sebagai pemisah

    // Tambah header ringkasan
    const summaryHeaderCell = worksheet.getCell(1, summaryCol);
    summaryHeaderCell.value = 'Ringkasan Pendapatan & Orderan';
    summaryHeaderCell.font = { bold: true };
    summaryHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'b5e550' }
    };
    summaryHeaderCell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };
    summaryHeaderCell.border = {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    };

    worksheet.getCell(1, summaryCol + 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'b5e550' }
    };
    worksheet.getCell(1, summaryCol + 1).border = {
      top: { style: 'medium' },
      right: { style: 'medium' },
      bottom: { style: 'medium' }
    };

    // Hitung statistik
    const totalOrders = formattedOrders.length;
    const completedOrders = formattedOrders.filter(order => order.Status === 'Selesai').length;
    const pendingOrders = totalOrders - completedOrders;
    const totalPendapatan = formattedOrders
      .filter(order => order.Status === 'Selesai')
      .reduce((sum, order) => sum + (order.Harga || 0), 0);

    // Tambah informasi statistik
    const summaryData = [
      { label: 'Total Orderan', value: totalOrders },
      { label: 'Orderan Selesai', value: completedOrders },
      { label: 'Orderan Belum Selesai', value: pendingOrders },
      { label: 'Total Pendapatan', value: totalPendapatan, isCurrency: true }
    ];

    // Tambahkan data ringkasan dengan styling
    summaryData.forEach((item, index) => {
      const rowIndex = summaryStartRow + index;
      
      // Label
      const labelCell = worksheet.getCell(rowIndex, summaryCol);
      labelCell.value = item.label;
      labelCell.font = { bold: true };
      labelCell.alignment = {
        vertical: 'middle',
        horizontal: 'left'
      };
      labelCell.border = {
        top: { style: 'thin' },
        left: { style: 'medium' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Value
      const valueCell = worksheet.getCell(rowIndex, summaryCol + 1);
      valueCell.value = item.value;
      valueCell.font = { bold: true };
      valueCell.alignment = {
        vertical: 'middle',
        horizontal: 'right'
      };
      valueCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'medium' }
      };

      // Jika ini adalah baris terakhir dari summary, tambahkan border bawah medium
      if (index === summaryData.length - 1) {
        labelCell.border.bottom = { style: 'medium' };
        valueCell.border.bottom = { style: 'medium' };
      }
      
      // Format currency jika diperlukan
      if (item.isCurrency) {
        valueCell.numFmt = '"Rp"#,##0';
      }
    });

    // Set lebar kolom ringkasan
    worksheet.getColumn(summaryCol).width = 25;
    worksheet.getColumn(summaryCol + 1).width = 20;

    // Merge cell untuk header ringkasan
    worksheet.mergeCells(1, summaryCol, 1, summaryCol + 1);

    // Generate dan download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_Laundry_${startDate}_to_${endDate}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f0f7e8] p-6">
      <Toaster position="top-center" />
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
          onClick={exportLaundryReport}
          className="bg-[#4c9b82] hover:bg-[#3c7c6a] text-white px-4 py-2 rounded-md shadow text-sm"
        >
          Export Report Laundry
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
