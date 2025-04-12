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
        setOrders(data.orders);
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
        order.kodeOrder === kodeOrder ? result.order : order
      ));
  
      toast.success(`Order ${kodeOrder} berhasil disimpan`);
      setUpdateStatus({ loading: false, error: null });
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(`Gagal menyimpan order: ${error.message}`);
      setUpdateStatus({ loading: false, error: error.message });
    }
  };
  

  return (
    <div className="min-h-screen bg-[#dce8b2] text-[#328e6e] p-6">
      <Link href="/" className="text-[#328e6e] hover:underline mb-4 inline-block">
        ← Kembali
      </Link>

      <h1 className="text-2xl font-bold text-center mb-6">Daftar Antrian</h1>

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
            <table className="min-w-full bg-white rounded shadow-md">
              <thead>
                <tr className="bg-[#8fc77a] text-left text-white">
                  <th className="py-2 px-4">Kode Order</th>
                  <th className="py-2 px-4">Nama</th>
                  <th className="py-2 px-4">Berat (kg)</th>
                  <th className="py-2 px-4">Tipe</th>
                  <th className="py-2 px-4">Tanggal</th>
                  <th className="py-2 px-4">Status</th>
                  {isLoggedIn && <th className="py-2 px-4">Harga</th>}
                  {isLoggedIn && <th className="py-2 px-4">Aksi</th>}
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
                    <tr key={i} className="border-b hover:bg-[#f1f8e8]">
                      <td className="py-2 px-4">{order.kodeOrder}</td>
                      <td className="py-2 px-4">{order.nama}</td>

                      {/* Berat */}
                      <td className="py-2 px-4">
                        {isLoggedIn ? (
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
                            className="w-20 border px-2 py-1 rounded"
                          />
                        ) : (
                          `${order.berat} kg`
                        )}
                      </td>

                      <td className="py-2 px-4">{order.tipe}</td>
                      <td className="py-2 px-4">{tanggal}, {jam}</td>

                      {/* Status */}
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          order.status === 'Selesai'
                            ? 'bg-green-200 text-green-800'
                            : order.status === 'Tinggal Ambil'
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {order.status || 'Proses'}
                        </span>
                      </td>

                      {/* Harga */}
                      {isLoggedIn && (
                        <td className="py-2 px-4">
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
                            className="w-28 border px-2 py-1 rounded"
                          />
                        </td>
                      )}

                      {/* Aksi */}
                      {isLoggedIn && (
                        <td className="py-2 px-4 space-y-1">
                          <select
                            value={order.status || 'Proses'}
                            onChange={(e) => updateOrder(order.kodeOrder, { status: e.target.value })}
                            disabled={updateStatus.loading}
                            className="w-full border rounded px-1 py-1 mb-1"
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
                            className="bg-green-600 hover:bg-green-700 text-white rounded px-3 py-1 text-sm w-full"
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
