import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('laundrydb');

    const now = new Date();
    const startOfToday = new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z');
    const endOfToday = new Date(now.toISOString().slice(0, 10) + 'T23:59:59.999Z');

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const ordersToday = await db.collection('orders').countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const ordersThisMonth = await db.collection('orders').countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const selesaiToday = await db.collection('orders').countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
      status: 'Selesai'
    });

    const selesaiMonth = await db.collection('orders').countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Selesai'
    });

    const incomeTodayAgg = await db.collection('orders').aggregate([
      { $match: { createdAt: { $gte: startOfToday, $lte: endOfToday }, status: 'Selesai' } },
      { $group: { _id: null, total: { $sum: '$harga' } } }
    ]).toArray();

    const incomeMonthAgg = await db.collection('orders').aggregate([
      { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: 'Selesai' } },
      { $group: { _id: null, total: { $sum: '$harga' } } }
    ]).toArray();

    const incomeToday = incomeTodayAgg[0]?.total || 0;
    const incomeMonth = incomeMonthAgg[0]?.total || 0;

    return new Response(JSON.stringify({
      ordersToday,
      ordersThisMonth,
      selesaiToday,
      selesaiMonth,
      incomeToday,
      incomeMonth
    }), { status: 200 });

  } catch (err) {
    console.error('Error fetching stats:', err);
    return new Response(JSON.stringify({ message: 'Gagal ambil statistik' }), { status: 500 });
  }
}
