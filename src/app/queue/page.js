'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

const hargaPerKg = {
  'Cuci + Setrika': 6000,
  'Hanya Setrika': 4000
};

export default function QueuePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null });
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/order');
        const data = await res.json();
        setOrders(data.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const updateOrder = async (kodeOrder, updates) => {
    try {
      setUpdateStatus({ loading: true, error: null });
      const response = await fetch(`/api/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kodeOrder, ...updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal update');
      }

      const result = await response.json();

      setOrders(orders.map(order =>
        order.kodeOrder === kodeOrder ? result.data : order
      ));

      toast.success(`Order ${kodeOrder} berhasil disimpan`);
      setUpdateStatus({ loading: false, error: null });
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(`Gagal menyimpan order: ${error.message}`);
      setUpdateStatus({ loading: false, error: error.message });
    }
  };

  const capitalize = (text) => {
    if (!text || typeof text !== 'string') return '-';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  

  return (
    <div className="min-h-screen bg-[#F3FDE8] text-[#27ae60] p-6">
      <Link href="/" className="text-[#27ae60] hover:text-[#219653] hover:underline mb-4 inline-block">
        ← Kembali
      </Link>

      <h1 className="text-3xl font-bold text-center mb-6 text-[#27ae60]">Daftar Antrian</h1>

      {loading ? (
        <p className="text-gray-600">Memuat data...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">Belum ada order laundry.</p>
      ) : (
        <>
          {updateStatus.error && (
            <div className="text-red-600 mb-4">
              Error: {updateStatus.error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-[#27ae60] text-left text-white">
                  <th className="py-3 px-4 font-semibold">Kode Order</th>
                  <th className="py-3 px-4 font-semibold">Nama</th>
                  <th className="py-3 px-4 font-semibold">Berat (kg)</th>
                  <th className="py-3 px-4 font-semibold">Tipe</th>
                  <th className="py-3 px-4 font-semibold">Order Type</th>
                  <th className="py-3 px-4 font-semibold">Jenis</th>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  {isLoggedIn && <th className="py-3 px-4 font-semibold">Harga</th>}
                  {isLoggedIn && <th className="py-3 px-4 font-semibold">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => {
                  const createdAt = new Date(order.createdAt);
                  const tanggal = createdAt.toLocaleDateString('id-ID');
                  const jam = createdAt.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={i} className="border-b hover:bg-[#F3FDE8] transition-colors duration-150">
                      <td className="py-3 px-4">{order.kodeOrder}</td>
                      <td className="py-3 px-4">{capitalize(order.nama)}</td>

                      {/* Berat */}
                      <td className="py-3 px-4">
                        {isLoggedIn ? (
                          order.orderType !== 'satuan' ? (
                            <input
                              type="number"
                              value={order.berat}
                              min={0}
                              step="0.1"
                              onChange={(e) => {
                                const beratBaru = parseFloat(e.target.value);
                                const hargaBaru = Math.round(beratBaru * (hargaPerKg[order.tipe] || 0));
                                const newOrders = [...orders];
                                newOrders[i].berat = beratBaru;
                                newOrders[i].harga = hargaBaru;
                                setOrders(newOrders);
                              }}
                              className="w-20 border border-[#27ae60] px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-[#27ae60] focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )
                        ) : (
                          order.orderType !== 'satuan' ? `${order.berat} kg` : '-'
                        )}
                      </td>

                      <td className="py-3 px-4">{order.tipe}</td>
                      <td className="py-3 px-4">{capitalize(order.orderType)}</td>
                      <td className="py-3 px-4">{capitalize(order.jenis)}</td>
                      <td className="py-3 px-4">{tanggal}, {jam}</td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${ 
                          order.status === 'Selesai'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'Tinggal Ambil'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status || 'Proses'}
                        </span>
                      </td>

                      {/* Harga */}
                      {isLoggedIn && (
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={order.harga}
                            min={0}
                            step={500}
                            onChange={(e) => {
                              const hargaBaru = parseInt(e.target.value);
                              const newOrders = [...orders];
                              newOrders[i].harga = hargaBaru;
                              setOrders(newOrders);
                            }}
                            className="w-28 border border-[#27ae60] px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-[#27ae60] focus:border-transparent"
                          />
                        </td>
                      )}

                      {/* Aksi */}
                      {isLoggedIn && (
                        <td className="py-3 px-4 space-y-2">
                          <select
                            value={order.status || 'Proses'}
                            onChange={(e) => updateOrder(order.kodeOrder, { status: e.target.value })}
                            disabled={updateStatus.loading}
                            className="w-full border border-[#27ae60] rounded px-2 py-1 mb-1 focus:outline-none focus:ring-2 focus:ring-[#27ae60] focus:border-transparent"
                          >
                            <option value="Proses">Proses</option>
                            <option value="Tinggal Ambil">Tinggal Ambil</option>
                            <option value="Selesai">Selesai</option>
                          </select>

                          <button
                            onClick={() =>
                              updateOrder(order.kodeOrder, {
                                berat: order.berat,
                                harga: order.harga
                              })
                            }
                            className="bg-[#27ae60] hover:bg-[#219653] text-white rounded px-3 py-1.5 text-sm w-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#27ae60] focus:ring-offset-2"
                            disabled={updateStatus.loading}
                          >
                            Simpan
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
