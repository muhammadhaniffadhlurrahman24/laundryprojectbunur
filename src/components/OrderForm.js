'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrderForm() {
  const [formData, setFormData] = useState({
    nama: '',
    noHp: '',
    berat: '',
    catatan: '',
    tipe: 'Cuci + Setrika'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'noHp') {
      // hanya angka
      if (!/^\d*$/.test(value)) return;
    }

    if (name === 'berat') {
      // tidak boleh minus
      if (value === '-' || parseFloat(value) < 0) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Menyimpan order...');

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Order berhasil! Kode: ${result.kodeOrder}`, { id: toastId });
        setFormData({
          nama: '',
          noHp: '',
          berat: '',
          catatan: '',
          tipe: 'Cuci + Setrika'
        });
      } else {
        toast.error(result.message || 'Gagal menyimpan order.', { id: toastId });
      }
    } catch (err) {
      console.error('Gagal mengirim order:', err);
      toast.error('Terjadi kesalahan koneksi.', { id: toastId });
    }
  };

  const hargaPerKg = {
    'Cuci + Setrika': 6000,
    'Hanya Setrika': 4000
  };

  const estimasiHarga = () => {
    const berat = parseFloat(formData.berat);
    const harga = hargaPerKg[formData.tipe] || 0;
    if (!isNaN(berat)) {
      return berat * harga;
    }
    return 0;
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-[#f0f7e8] rounded shadow">
      <Link href="/" className="text-[#328e6e] hover:underline mb-4 inline-block">
        ← Kembali
      </Link>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-[#2f5e4e]">Nama Pelanggan</label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-[#2f5e4e]">Nomor WhatsApp</label>
          <input
            type="text"
            name="noHp"
            value={formData.noHp}
            onChange={handleChange}
            placeholder="contoh: 0823xxxxxxxx"
            className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-[#2f5e4e]">Berat Cucian (kg)</label>
          <input
            type="number"
            name="berat"
            value={formData.berat}
            onChange={handleChange}
            min="0"
            step="0.1"
            className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
            required
          />
          {formData.berat && (
            <p className="text-sm text-[#3f704d] mt-1">
              Estimasi Harga: <strong>Rp {estimasiHarga().toLocaleString('id-ID')}</strong>
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium text-[#2f5e4e]">Tipe Order</label>
          <select
            name="tipe"
            value={formData.tipe}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="Cuci + Setrika">Cuci + Setrika</option>
            <option value="Hanya Setrika">Hanya Setrika</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-[#2f5e4e]">Catatan (opsional)</label>
          <textarea
            name="catatan"
            value={formData.catatan}
            onChange={handleChange}
            className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
          />
        </div>

        <button
          type="submit"
          className="bg-[#328e6e] text-white px-4 py-2 rounded hover:bg-[#2a735e] transition"
        >
          Simpan Order
        </button>
      </form>
    </div>
  );
}
