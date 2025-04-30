'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function OrderForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pakaian');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    noHp: '',
    berat: '',
    catatan: '',
    tipe: '',
    jenis: '',
    hargaSatuan: "",
    namaJenisLainnya: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'noHp') {
      if (!/^\d*$/.test(value)) return;
    }

    if (name === 'berat' || name === 'hargaSatuan') {
      if (value === '-' || parseFloat(value) < 0) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleJenisChange = (e) => {
    const jenis = e.target.value;
    const hargaDefault = {
      'Sprei': "",
      'Bantal': "",
      'Selimut': "",
      'Bed Cover': "",
      'Gorden': "",
      'Lainnya': 0
    };
    
    setFormData({
      ...formData,
      jenis,
      hargaSatuan: hargaDefault[jenis] || 0,
      namaJenisLainnya: jenis === 'Lainnya' ? formData.namaJenisLainnya : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Menyimpan order...');

    // Validasi dasar
    if (!formData.nama) {
      toast.error('Nama pelanggan wajib diisi!', { id: toastId });
      setIsLoading(false);
      return;
    }

    if (!formData.berat) {
      toast.error(activeTab === 'pakaian' ? 'Berat cucian wajib diisi!' : 'Jumlah wajib diisi!', { id: toastId });
      setIsLoading(false);
      return;
    }

    if (activeTab === 'satuan' && formData.jenis === 'Lainnya' && !formData.namaJenisLainnya) {
      toast.error('Nama jenis barang wajib diisi untuk "Lainnya"!', { id: toastId });
      setIsLoading(false);
      return;
    }

    // Siapkan data untuk API
    const requestData = {
      nama: formData.nama,
      noHp: formData.noHp,
      berat: parseFloat(formData.berat),
      catatan: formData.catatan,
      ...(activeTab === 'pakaian' 
        ? { tipe: formData.tipe } 
        : { 
            jenis: formData.jenis === 'Lainnya' ? formData.namaJenisLainnya : formData.jenis,
            hargaSatuan: parseFloat(formData.hargaSatuan)
          })
    };

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await res.json();

      if (res.ok) {
        // Reset form
        setFormData({
          nama: '',
          noHp: '',
          berat: '',
          catatan: '',
          tipe: '',
          jenis: '',
          hargaSatuan: "",
          namaJenisLainnya: ''
        });
        toast.success(`Order berhasil! Kode: ${result.kodeOrder}`, { id: toastId });
        setTimeout(() => {
          router.push('/queue'); // arahkan ke halaman /queue setelah 3 detik
        }, 3000);
      } else {
        toast.error(result.message || 'Gagal menyimpan order.', { id: toastId });
      }
    } catch (err) {
      console.error('Gagal mengirim order:', err);
      toast.error('Terjadi kesalahan koneksi.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const estimasiTotalHarga = () => {
    if (activeTab === 'pakaian') {
      const berat = parseFloat(formData.berat) || 0;
      const hargaPerKg = {
        'Cuci + Setrika': 6000,
        'Hanya Setrika': 4000
      };
      return berat * (hargaPerKg[formData.tipe] || 0);
    } else {
      const jumlah = parseFloat(formData.berat) || 0;
      const harga = parseFloat(formData.hargaSatuan) || 0;
      return jumlah * harga;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-[#f0f7e8] rounded shadow">
      <Link href="/" className="text-[#328e6e] hover:underline mb-4 inline-block">
        ← Kembali
      </Link>

      <div className="flex mb-6 rounded overflow-hidden">
        <button
          onClick={() => setActiveTab('pakaian')}
          className={`flex-1 py-2 font-medium transition-colors ${
            activeTab === 'pakaian' 
              ? 'bg-[#328e6e] text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pakaian
        </button>
        <button
          onClick={() => setActiveTab('satuan')}
          className={`flex-1 py-2 font-medium transition-colors ${
            activeTab === 'satuan' 
              ? 'bg-[#328e6e] text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Satuan
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-[#2f5e4e]">Nama Pelanggan *</label>
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
          <label className="block font-medium text-[#2f5e4e]">Nomor WhatsApp (opsional)</label>
          <input
            type="text"
            name="noHp"
            value={formData.noHp}
            onChange={handleChange}
            placeholder="contoh: 0823xxxxxxxx"
            className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
          />
        </div>

        {activeTab === 'pakaian' ? (
          <>
            <div>
              <label className="block font-medium text-[#2f5e4e]">Berat Cucian (kg) *</label>
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
            </div>

            <div>
              <label className="block font-medium text-[#2f5e4e]">Tipe Order *</label>
              <select
                name="tipe"
                value={formData.tipe}
                onChange={handleChange}
                className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
                required
              >
                <option value="">Pilih Tipe</option>
                <option value="Cuci + Setrika">Cuci + Setrika</option>
                <option value="Hanya Setrika">Hanya Setrika</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block font-medium text-[#2f5e4e]">Jenis Barang *</label>
              <select
                name="jenis"
                value={formData.jenis}
                onChange={handleJenisChange}
                className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
                required
              >
                <option value="">Pilih Barang</option>
                <option value="Sprei">Sprei</option>
                <option value="Bantal">Bantal</option>
                <option value="Selimut">Selimut</option>
                <option value="Bed Cover">Bed Cover</option>
                <option value="Gorden">Gorden</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {formData.jenis === 'Lainnya' && (
              <div>
                <label className="block font-medium text-[#2f5e4e]">Nama Jenis Barang *</label>
                <input
                  type="text"
                  name="namaJenisLainnya"
                  value={formData.namaJenisLainnya}
                  onChange={handleChange}
                  className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
                  required={formData.jenis === 'Lainnya'}
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-[#2f5e4e]">Jumlah *</label>
              <input
                type="number"
                name="berat"
                value={formData.berat}
                onChange={handleChange}
                min="0"
                className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-[#2f5e4e]">Harga Satuan</label>
              <input
                type="number"
                name="hargaSatuan"
                value={formData.hargaSatuan}
                onChange={handleChange}
                min="0"
                className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
              />
            </div>
          </>
        )}

        <div>
          <label className="block font-medium text-[#2f5e4e]">Catatan (opsional)</label>
          <textarea
            name="catatan"
            value={formData.catatan}
            onChange={handleChange}
            className="w-full border border-[#a3d98c] p-2 rounded bg-white text-black"
          />
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="font-medium text-lg text-[#328e6e]">
            Estimasi Harga: Rp {estimasiTotalHarga().toLocaleString()}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="py-2 px-4 bg-[#328e6e] text-white rounded font-semibold disabled:bg-gray-400"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
