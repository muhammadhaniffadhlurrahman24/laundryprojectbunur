import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  const data = await req.json();

  if (!data.nama || !data.berat || !data.tipe) {
    return new Response(JSON.stringify({ message: 'Data tidak lengkap' }), {
      status: 400,
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('laundrydb');
    const orders = db.collection('orders');

    const now = new Date();
    const yyyyMMdd = now.toISOString().slice(0, 10).replace(/-/g, '');

    const countToday = await orders.countDocuments({
      createdAt: {
        $gte: new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`),
        $lt: new Date(`${now.toISOString().slice(0, 10)}T23:59:59.999Z`),
      },
    });

    const nomorUrut = (countToday + 1).toString().padStart(3, '0');
    const kodeOrder = `ORD-${yyyyMMdd}-${nomorUrut}`;

    const hargaPerKg = {
      'Cuci + Setrika': 6000,
      'Hanya Setrika': 4000,
    };

    const harga = data.berat * (hargaPerKg[data.tipe] || 0);

    await orders.insertOne({
      kodeOrder,
      nama: data.nama,
      noHp: data.noHp || '',
      berat: data.berat,
      catatan: data.catatan || '',
      tipe: data.tipe,
      status: 'Proses',
      harga,
      createdAt: now,
    });

    // Validasi noHp
    let isValidPhone = false;
    let target = '';

    if (data.noHp) {
      const cleaned = data.noHp.replace(/\D/g, '');
      if ((cleaned.startsWith('0') || cleaned.startsWith('62')) && cleaned.length >= 10) {
        target = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
        isValidPhone = true;
      }
    }

    if (isValidPhone) {
      const message = `Hai ${data.nama}, order kamu telah kami terima!\n\nKode Order: ${kodeOrder}\nTipe: ${data.tipe}\nCatatan: ${data.catatan || '-'}\n\nTerima kasih telah menggunakan layanan laundry kami!\n\nUntuk melihat antrian Anda, silahkan kunjungi https://laundrybunur.vercel.app/`;

      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: process.env.FONNTE_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target, message }),
      });
    }

    const adminMessage = `🛎️ Order Baru Masuk!\n\nNama: ${data.nama}\nNo HP: ${data.noHp || '-'}\n${!isValidPhone && data.noHp ? '⚠️ Nomor WA pelanggan tidak valid, pesan tidak dikirim.\n' : ''}Berat: ${data.berat} kg\nHarga: Rp ${harga.toLocaleString('id-ID')}\nTipe: ${data.tipe}\nKode Order: ${kodeOrder}\nCatatan: ${data.catatan || '-'}`;

    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: process.env.FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: process.env.FONNTE_ADMIN_NUMBER,
        message: adminMessage,
      }),
    });

    return new Response(
      JSON.stringify({ message: 'Order berhasil disimpan!', kodeOrder }),
      { status: 200 }
    );
  } catch (err) {
    console.error('MongoDB or WhatsApp Error:', err);
    return new Response(
      JSON.stringify({ message: 'Gagal menyimpan ke database atau kirim WhatsApp.' }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('laundrydb');
    const orders = await db
      .collection('orders')
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(JSON.stringify({ orders }), { status: 200 });
  } catch (err) {
    console.error('Error ambil order:', err);
    return new Response(JSON.stringify({ message: 'Gagal ambil data.' }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { kodeOrder, status, berat, harga } = await req.json();

    if (!kodeOrder) {
      return new Response(JSON.stringify({ message: 'Kode order diperlukan' }), {
        status: 400,
      });
    }

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (berat !== undefined) updateFields.berat = berat;
    if (harga !== undefined) updateFields.harga = harga;

    const client = await clientPromise;
    const db = client.db('laundrydb');
    const result = await db.collection('orders').updateOne(
      { kodeOrder },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ message: 'Order tidak ditemukan' }), {
        status: 404,
      });
    }

    const updatedOrder = await db.collection('orders').findOne({ kodeOrder });

    // Kirim WA hanya kalau ada perubahan status dan nomor valid
    if (status && updatedOrder && updatedOrder.noHp) {
      const cleaned = updatedOrder.noHp.replace(/\D/g, '');
      const isValid = (cleaned.startsWith('0') || cleaned.startsWith('62')) && cleaned.length >= 10;
      const target = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;

      let statusMessage = '';
      if (status === 'Selesai') {
        statusMessage = `Hai ${updatedOrder.nama}, laundry Anda dengan kode order ${kodeOrder} telah SELESAI!\n\nTerima kasih telah menggunakan layanan kami.`;
      } else if (status === 'Tinggal Ambil') {
        statusMessage = `Hai ${updatedOrder.nama}, laundry Anda dengan kode order ${kodeOrder} telah SELESAI dan siap DIAMBIL.\n\nBerat: ${updatedOrder.berat} kg\nTotal Biaya: Rp ${updatedOrder.harga.toLocaleString('id-ID')}\n\nTerima kasih telah menggunakan layanan kami.`;
      }

      if (isValid && statusMessage) {
        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: process.env.FONNTE_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ target, message: statusMessage }),
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Order berhasil diupdate',
        order: updatedOrder,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error update order:', err);
    return new Response(
      JSON.stringify({ message: 'Gagal update order.' }),
      { status: 500 }
    );
  }
}
