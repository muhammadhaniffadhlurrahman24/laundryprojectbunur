import clientPromise from '@/lib/mongodb';

// Harga default untuk perhitungan otomatis
const HARGA = {
  PAKAIAN: {
    'Cuci + Setrika': 6000,
    'Hanya Setrika': 4000
  },
  SATUAN: {
    'Sprei': "",
    'Bantal': "",
    'Selimut': "",
    'Bed Cover': "",
    'Gorden': ""
  }
};

export async function POST(req) {
  const data = await req.json();

  // Validasi data wajib
  if (!data.nama || !data.berat) {
    return Response.json(
      { success: false, message: 'Nama dan berat/jumlah wajib diisi' },
      { status: 400 }
    );
  }

  // Deteksi jenis order
  const isPakaian = data.tipe !== undefined;
  const isSatuan = data.jenis !== undefined;

  if (!isPakaian && !isSatuan) {
    return Response.json(
      { success: false, message: 'Tipe order tidak valid' },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db('laundrydb');
    const orders = db.collection('orders');

    // Generate kode order
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 900 + 100); // 100-999
    const kodeOrder = `ORD-${datePart}-${randomPart}`;

    // Hitung harga
    let harga;
    let orderDetails = {};

    if (isPakaian) {
      // Order pakaian
      if (!HARGA.PAKAIAN[data.tipe]) {
        return Response.json(
          { success: false, message: 'Tipe layanan tidak valid' },
          { status: 400 }
        );
      }

      harga = parseFloat(data.berat) * HARGA.PAKAIAN[data.tipe];
      orderDetails = {
        orderType: 'pakaian',
        tipe: data.tipe,
        berat: parseFloat(data.berat)
      };
    } else {
      // Order satuan
      const hargaSatuan = data.hargaSatuan 
        ? parseFloat(data.hargaSatuan)
        : HARGA.SATUAN[data.jenis] || 0;

      harga = parseFloat(data.berat) * hargaSatuan;
      orderDetails = {
        orderType: 'satuan',
        jenis: data.jenis,
        hargaSatuan: hargaSatuan,
        jumlah: parseFloat(data.berat),
        tipe: 'Cuci + Setrika'
      };
    }

    // Data untuk disimpan
    const orderData = {
      kodeOrder,
      nama: data.nama.trim(),
      noHp: data.noHp?.trim() || '',
      catatan: data.catatan?.trim() || '',
      harga,
      status: 'Menunggu',
      createdAt: now,
      updatedAt: now,
      ...orderDetails
    };

    // Simpan ke database
    await orders.insertOne(orderData);

    // Kirim notifikasi WhatsApp jika nomor valid
    await sendWhatsAppNotifications(orderData);

    return Response.json(
      { 
        success: true, 
        message: 'Order berhasil dibuat',
        kodeOrder,
        data: orderData 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing order:', error);
    return Response.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// Fungsi untuk mengirim notifikasi WhatsApp
async function sendWhatsAppNotifications(orderData) {
  try {
    // Validasi nomor HP
    let phone = orderData.noHp?.replace(/\D/g, '') || '';
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }

    const isValidPhone = phone.startsWith('62') && phone.length >= 11;

    // Pesan untuk pelanggan
    if (isValidPhone) {
      let layananInfo = '';
      if (orderData.orderType === 'pakaian') {
        layananInfo = `Layanan: ${orderData.tipe}\nBerat: ${orderData.berat} kg`;
      } else {
        layananInfo = `Jenis: ${orderData.jenis}\nJumlah: ${orderData.jumlah}\nHarga Satuan: Rp ${orderData.hargaSatuan?.toLocaleString('id-ID') || '-'}`;
      }

      const customerMessage = `Halo ${orderData.nama},\n\nOrder laundry Anda telah kami terima:\n\nKode: ${orderData.kodeOrder}\n${layananInfo}\nTotal: Rp ${orderData.harga.toLocaleString('id-ID')}\n\nStatus: ${orderData.status}\n\nTerima kasih!`;

      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': process.env.FONNTE_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: phone,
          message: customerMessage
        })
      });
    }

    // Pesan untuk admin
    const adminMessage = `📦 ORDER BARU\n\nKode: ${orderData.kodeOrder}\nNama: ${orderData.nama}\nHP: ${orderData.noHp || '-'} ${!isValidPhone && orderData.noHp ? '(nomor tidak valid)' : ''}\n\n${orderData.orderType === 'pakaian' 
      ? `Tipe: ${orderData.tipe}\nBerat: ${orderData.berat} kg` 
      : `Jenis: ${orderData.jenis}\nJumlah: ${orderData.jumlah}\nHarga: Rp ${orderData.hargaSatuan?.toLocaleString('id-ID') || '-'}`}\n\nTotal: Rp ${orderData.harga.toLocaleString('id-ID')}\n\nCatatan: ${orderData.catatan || '-'}`;

    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: process.env.ADMIN_PHONE,
        message: adminMessage
      })
    });

  } catch (error) {
    console.error('Error sending WhatsApp:', error);
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('laundrydb');
    const orders = await db.collection('orders')
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return Response.json(
      { success: true, data: orders },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return Response.json(
      { success: false, message: 'Gagal mengambil data order' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { kodeOrder, status } = await req.json();

    if (!kodeOrder || !status) {
      return Response.json(
        { success: false, message: 'Kode order dan status wajib diisi' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('laundrydb');

    // Update status
    const result = await db.collection('orders').updateOne(
      { kodeOrder },
      { $set: { 
        status,
        updatedAt: new Date() 
      }}
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { success: false, message: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }

    // Ambil data terbaru untuk notifikasi
    const updatedOrder = await db.collection('orders').findOne({ kodeOrder });

    // Kirim notifikasi status ke pelanggan
    if (updatedOrder.noHp) {
      let phone = updatedOrder.noHp.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = '62' + phone.slice(1);
      }

      if (phone.startsWith('62') && phone.length >= 11) {
        const statusMessage = `Halo ${updatedOrder.nama},\n\nStatus order Anda (${kodeOrder}) telah diperbarui:\n\n🔄 Status: ${status}\n\nTerima kasih!`;

        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': process.env.FONNTE_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: phone,
            message: statusMessage
          })
        });
      }
    }

    return Response.json(
      { 
        success: true, 
        message: 'Status order berhasil diperbarui',
        data: updatedOrder 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating order:', error);
    return Response.json(
      { success: false, message: 'Gagal memperbarui order' },
      { status: 500 }
    );
  }
}