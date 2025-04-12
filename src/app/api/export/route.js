import clientPromise from '@/lib/mongodb';

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db('laundrydb');

    // Ambil query params dari URL
    const from = req.nextUrl.searchParams.get('start');
    const to = req.nextUrl.searchParams.get('end');

    if (!from || !to) {
      return new Response(
        JSON.stringify({ message: 'Tanggal tidak lengkap', from, to }),
        { status: 400 }
      );
    }

    const start = new Date(from + 'T00:00:00.000Z');
    const end = new Date(to + 'T23:59:59.999Z');

    const orders = await db.collection('orders')
      .find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: 1 })
      .toArray();

    const totalOrder = orders.length;
    const totalPendapatan = orders
      .filter(order => order.status === 'Selesai')
      .reduce((sum, order) => sum + (parseInt(order.harga) || 0), 0);

    return new Response(JSON.stringify({ orders, totalOrder, totalPendapatan }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Gagal mengambil data export:', err);
    return new Response(JSON.stringify({ message: 'Gagal ambil data export' }), { status: 500 });
  }
}
