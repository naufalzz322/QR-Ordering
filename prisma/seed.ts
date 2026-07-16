import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up existing data (in reverse order of dependencies)
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.orderArchive.deleteMany() // Clean up archived orders too
  await prisma.menuVariant.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.category.deleteMany()
  await prisma.table.deleteMany()
  await prisma.user.deleteMany()
  await prisma.outlet.deleteMany()

  // Create outlet
  const outlet = await prisma.outlet.create({
    data: {
      name: 'Warung Nusantara',
      slug: 'warung-nusantara-sby',
      address: 'Jl. Soekarno Hatta No. 123, Surabaya',
      phone: '031-1234567',
      avgPrepTimeMinutes: 10,
      isEstimationEnabled: true,
    },
  })

  console.log(`✅ Created outlet: ${outlet.name}`)

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@warungnusantara.com',
      password: hashedPassword,
      name: 'Admin Warung',
      role: 'ADMIN',
      outletId: outlet.id,
    },
  })

  console.log('✅ Created admin user: admin@warungnusantara.com / admin123')

  // Generate random secure tokens for tables
  function generateSecureToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const length = 12
    let token = ''
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  // Create tables (12 tables) with random secure tokens
  const tables: Array<{ id: string; tableNumber: number }> = []
  for (let i = 1; i <= 12; i++) {
    tables.push(
      await prisma.table.create({
        data: {
          outletId: outlet.id,
          tableNumber: i,
          qrToken: generateSecureToken(),
          status: 'EMPTY',
        },
      })
    )
  }

  console.log(`✅ Created ${tables.length} tables with secure tokens`)

  // Create categories
  const categoriesData = [
    { name: 'Minuman', sortOrder: 0 },
    { name: 'Makanan Berat', sortOrder: 1 },
    { name: 'Snack', sortOrder: 2 },
    { name: 'Dessert', sortOrder: 3 },
  ]

  const categories = []
  for (const cat of categoriesData) {
    categories.push(
      await prisma.category.create({
        data: {
          outletId: outlet.id,
          name: cat.name,
          sortOrder: cat.sortOrder,
          isActive: true,
        },
      })
    )
  }

  console.log(`✅ Created ${categories.length} categories`)

  // Create menu items
  const menuItemsData = [
    // Minuman (10 items)
    { name: 'Americano', basePrice: 25000, avgPrepTime: 4, category: 'Minuman', description: 'Kopi hitam dengan rasa yang kaya dan seimbang', photoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', isAvailable: true },
    { name: 'Kopi Susu Gula Aren', basePrice: 28000, avgPrepTime: 5, category: 'Minuman', description: 'Kopi susu dengan gula aren asli, manis khas', photoUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400', isAvailable: true },
    { name: 'Matcha Latte', basePrice: 32000, avgPrepTime: 5, category: 'Minuman', description: 'Matcha premium dengan susu segar', photoUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400', isAvailable: true },
    { name: 'Cappuccino', basePrice: 28000, avgPrepTime: 4, category: 'Minuman', description: 'Espresso dengan busa susu yang lembut', photoUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', isAvailable: true },
    { name: 'Es Teh Manis', basePrice: 10000, avgPrepTime: 2, category: 'Minuman', description: 'Teh manis dingin segar', photoUrl: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400', isAvailable: true },
    { name: 'Jus Jeruk', basePrice: 18000, avgPrepTime: 3, category: 'Minuman', description: 'Jus jeruk peras segar', photoUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', isAvailable: true },
    { name: 'Taro Latte', basePrice: 30000, avgPrepTime: 5, category: 'Minuman', description: 'Minuman taro cream yang manis dan lembut', photoUrl: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400', isAvailable: true },
    { name: 'Vietnamese Coffee', basePrice: 35000, avgPrepTime: 6, category: 'Minuman', description: 'Kopi Vietnam dengan susu kental manis', photoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', isAvailable: true },
    { name: 'Es Jeruk Peras', basePrice: 15000, avgPrepTime: 3, category: 'Minuman', description: 'Jeruk peras segar dengan es batu', photoUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', isAvailable: true },
    { name: 'Teh Tarik', basePrice: 18000, avgPrepTime: 4, category: 'Minuman', description: 'Teh tarik Malaysia yang creamy', photoUrl: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400', isAvailable: true },
    // Makanan Berat (8 items)
    { name: 'Nasi Goreng Spesial', basePrice: 35000, avgPrepTime: 12, category: 'Makanan Berat', description: 'Nasi goreng dengan telur, ayam, dan sayuran', photoUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', isAvailable: true },
    { name: 'Mie Goreng Jawa', basePrice: 32000, avgPrepTime: 10, category: 'Makanan Berat', description: 'Mie goreng dengan bumbu tradisional Jawa', photoUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', isAvailable: true },
    { name: 'Ayam Geprek', basePrice: 30000, avgPrepTime: 8, category: 'Makanan Berat', description: 'Ayam crispy dengan sambal pedas', photoUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400', isAvailable: true },
    { name: 'Rice Bowl Teriyaki', basePrice: 38000, avgPrepTime: 10, category: 'Makanan Berat', description: 'Nasi dengan ayam teriyaki dan sayuran', photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', isAvailable: true },
    { name: 'Soto Ayam', basePrice: 32000, avgPrepTime: 12, category: 'Makanan Berat', description: 'Soto ayam dengan kuah bening dan nasi', photoUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400', isAvailable: true },
    { name: 'Ayam Bakar', basePrice: 38000, avgPrepTime: 15, category: 'Makanan Berat', description: 'Ayam bakar dengan bumbu kecap manis', photoUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400', isAvailable: true },
    { name: 'Nasi Uduk', basePrice: 28000, avgPrepTime: 10, category: 'Makanan Berat', description: 'Nasi uduk dengan lauk khas Betawi', photoUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', isAvailable: true },
    { name: 'Mie Ayam', basePrice: 25000, avgPrepTime: 8, category: 'Makanan Berat', description: 'Mie ayam dengan topping ayam cincang', photoUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', isAvailable: true },
    // Snack (6 items)
    { name: 'Roti Bakar Coklat Keju', basePrice: 22000, avgPrepTime: 8, category: 'Snack', description: 'Roti bakar dengan selai coklat dan keju', photoUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400', isAvailable: true },
    { name: 'Pisang Goreng Keju', basePrice: 18000, avgPrepTime: 6, category: 'Snack', description: 'Pisang goreng crispy dengan taburan keju', photoUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', isAvailable: true },
    { name: 'French Fries', basePrice: 15000, avgPrepTime: 5, category: 'Snack', description: 'Kentang goreng crispy dengan saus', photoUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', isAvailable: true },
    { name: 'Tahu Crispy', basePrice: 12000, avgPrepTime: 5, category: 'Snack', description: 'Tahu goreng crispy dengan saus kacang', photoUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', isAvailable: true },
    { name: 'Bakso', basePrice: 25000, avgPrepTime: 8, category: 'Snack', description: 'Bakso sapi dengan kuah kaldu segar', photoUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400', isAvailable: true },
    { name: 'Singkong Goreng', basePrice: 12000, avgPrepTime: 5, category: 'Snack', description: 'Singkong goreng crispy', photoUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', isAvailable: true },
    // Dessert (5 items)
    { name: 'Pudding Coklat', basePrice: 15000, avgPrepTime: 3, category: 'Dessert', description: 'Pudding coklat lembut', photoUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', isAvailable: true },
    { name: 'Es Krim Vanila', basePrice: 12000, avgPrepTime: 2, category: 'Dessert', description: 'Es krim vanila premium', photoUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400', isAvailable: true },
    { name: 'Mango Sticky Rice', basePrice: 22000, avgPrepTime: 5, category: 'Dessert', description: 'Ketan mangga dengan saus santan', photoUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', isAvailable: true },
    { name: 'Es Campur', basePrice: 18000, avgPrepTime: 4, category: 'Dessert', description: 'Es campur dengan berbagai topping segar', photoUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400', isAvailable: true },
    { name: 'Klepon', basePrice: 10000, avgPrepTime: 3, category: 'Dessert', description: 'Bola ketan hijau dengan gula merah', photoUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', isAvailable: true },
  ]

  const categoryMap = new Map(categories.map(c => [c.name, c.id]))
  const menuItemIds: Record<string, string> = {}

  for (const item of menuItemsData) {
    const menuItem = await prisma.menuItem.create({
      data: {
        outletId: outlet.id,
        categoryId: categoryMap.get(item.category)!,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        photoUrl: item.photoUrl,
        avgPrepTimeMinutes: item.avgPrepTime,
        isAvailable: item.isAvailable,
        sortOrder: 0,
      },
    })
    menuItemIds[item.name] = menuItem.id

    // Add variants for drinks
    if (['Americano', 'Kopi Susu Gula Aren', 'Matcha Latte', 'Cappuccino'].includes(item.name)) {
      await prisma.menuVariant.createMany({
        data: [
          { menuItemId: menuItem.id, name: 'Regular', additionalPrice: 0, isDefault: true },
          { menuItemId: menuItem.id, name: 'Large', additionalPrice: 5000, isDefault: false },
        ],
      })
    }
  }

  console.log(`✅ Created ${menuItemsData.length} menu items with variants`)

  // Create demo orders for queue demonstration
  console.log('📝 Creating demo orders...')

  // Helper function to generate order number matching app format: ORD-WAR-01-001
  const generateOrderNumber = (tableNum: number, orderCount: number) => {
    const prefix = 'WAR' // outlet slug first 3 chars
    const table = String(tableNum).padStart(2, '0')
    const count = String(orderCount).padStart(3, '0')
    return `ORD-${prefix}-${table}-${count}`
  }

  // Count existing orders for this outlet
  let orderCounter = 0

  // Meja 03 - Active Processing order (queue position 1)
  orderCounter++
  const table03 = tables.find(t => t.tableNumber === 3)!
  await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(3, orderCounter),
      tableId: table03.id,
      outletId: outlet.id,
      status: 'PROCESSING',
      notes: 'Pelanggan anniversary, buat cantik ya',
      totalAmount: 53000,
      queuePosition: 1,
      estimatedDoneAt: new Date(Date.now() + 8 * 60 * 1000),
      processedAt: new Date(Date.now() - 5 * 60 * 1000),
      items: {
        create: [
          { menuItemId: menuItemIds['Americano'], qty: 2, unitPrice: 25000 },
          { menuItemId: menuItemIds['Nasi Goreng Spesial'], qty: 1, unitPrice: 35000, itemNotes: 'kurang pedas' },
        ],
      },
    },
  })

  // Meja 07 - Active Pending order (queue position 2)
  orderCounter++
  const table07 = tables.find(t => t.tableNumber === 7)!
  await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(7, orderCounter),
      tableId: table07.id,
      outletId: outlet.id,
      status: 'PENDING',
      notes: 'Bawa pulang, jangan lupa tutup rapat',
      totalAmount: 60000,
      queuePosition: 2,
      estimatedDoneAt: new Date(Date.now() + 16 * 60 * 1000),
      items: {
        create: [
          { menuItemId: menuItemIds['Mie Goreng Jawa'], qty: 1, unitPrice: 32000 },
          { menuItemId: menuItemIds['Es Teh Manis'], qty: 2, unitPrice: 10000 },
        ],
      },
    },
  })

  // Meja 11 - Active Pending order (queue position 3)
  orderCounter++
  const table11 = tables.find(t => t.tableNumber === 11)!
  await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(11, orderCounter),
      tableId: table11.id,
      outletId: outlet.id,
      status: 'PENDING',
      totalAmount: 74000,
      queuePosition: 3,
      estimatedDoneAt: new Date(Date.now() + 24 * 60 * 1000),
      items: {
        create: [
          { menuItemId: menuItemIds['Kopi Susu Gula Aren'], qty: 2, unitPrice: 28000 },
          { menuItemId: menuItemIds['Ayam Geprek'], qty: 1, unitPrice: 30000 },
          { menuItemId: menuItemIds['French Fries'], qty: 1, unitPrice: 15000, itemNotes: 'extra crispy' },
        ],
      },
    },
  })

  // Update table statuses for active orders
  await prisma.table.update({ where: { id: table03.id }, data: { status: 'ACTIVE' } })
  await prisma.table.update({ where: { id: table07.id }, data: { status: 'ACTIVE' } })
  await prisma.table.update({ where: { id: table11.id }, data: { status: 'ACTIVE' } })

  console.log(`✅ Created ${orderCounter} active demo orders for queue demonstration`)

  // Create historical orders for reports (completed orders)
  const createHistoricalOrder = async (
    tableNum: number,
    hoursAgo: number,
    items: { name: string; qty: number; notes?: string }[],
    orderNum: number,
    orderNote?: string
  ) => {
    const table = tables.find(t => t.tableNumber === tableNum)!
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    const totalAmount = items.reduce((sum, item) => {
      const menuItem = menuItemsData.find(m => m.name === item.name)
      return sum + (menuItem ? menuItem.basePrice * item.qty : 0)
    }, 0)

    await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(tableNum, orderNum),
        tableId: table.id,
        outletId: outlet.id,
        status: 'COMPLETED',
        notes: orderNote || null,
        totalAmount,
        queuePosition: 1,
        estimatedDoneAt: new Date(createdAt.getTime() + 8 * 60 * 1000),
        createdAt,
        processedAt: new Date(createdAt.getTime() + 2 * 60 * 1000),
        completedAt: new Date(createdAt.getTime() + 15 * 60 * 1000),
        items: {
          create: items.map(item => ({
            menuItemId: menuItemIds[item.name],
            qty: item.qty,
            unitPrice: menuItemsData.find(m => m.name === item.name)?.basePrice || 0,
            itemNotes: item.notes || null,
          })),
        },
      },
    })
  }

  // Historical orders for past hours
  orderCounter = 1
  await createHistoricalOrder(1, 5.5, [{ name: 'Americano', qty: 2 }, { name: 'Nasi Goreng Spesial', qty: 1 }], orderCounter, 'Minta level pedas biasa aja')
  orderCounter++
  await createHistoricalOrder(2, 5, [{ name: 'Kopi Susu Gula Aren', qty: 1 }, { name: 'Roti Bakar Coklat Keju', qty: 1 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(4, 4.5, [{ name: 'Matcha Latte', qty: 2 }, { name: 'Pisang Goreng Keju', qty: 1 }], orderCounter, 'Matchanya jangan terlalu manis')
  orderCounter++
  await createHistoricalOrder(5, 4, [{ name: 'Mie Goreng Jawa', qty: 2 }, { name: 'Es Teh Manis', qty: 2 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(6, 3.5, [{ name: 'Ayam Geprek', qty: 1 }, { name: 'Jus Jeruk', qty: 1 }], orderCounter, 'Ayam gepreknya pedes banget ya')
  orderCounter++
  await createHistoricalOrder(8, 3, [{ name: 'Cappuccino', qty: 1 }, { name: 'French Fries', qty: 1 }, { name: 'Pudding Coklat', qty: 1 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(9, 2.5, [{ name: 'Nasi Goreng Spesial', qty: 2 }, { name: 'Americano', qty: 2 }], orderCounter, 'Kopi jangan dicampur gula')
  orderCounter++
  await createHistoricalOrder(10, 2, [{ name: 'Rice Bowl Teriyaki', qty: 1 }, { name: 'Es Krim Vanila', qty: 2 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(12, 1.5, [{ name: 'Kopi Susu Gula Aren', qty: 3 }, { name: 'Roti Bakar Coklat Keju', qty: 2 }], orderCounter, 'Kopi susu semua ya mbak')
  orderCounter++
  await createHistoricalOrder(3, 1.2, [{ name: 'Soto Ayam', qty: 1 }, { name: 'Taro Latte', qty: 1 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(7, 1.0, [{ name: 'Ayam Bakar', qty: 1 }, { name: 'Mango Sticky Rice', qty: 1 }], orderCounter, 'Nasinya多一点 ya')
  orderCounter++
  await createHistoricalOrder(11, 0.8, [{ name: 'Mie Ayam', qty: 2 }, { name: 'Teh Tarik', qty: 2 }], orderCounter)

  // More orders for peak hour (lunch time simulation)
  orderCounter++
  await createHistoricalOrder(1, 1, [{ name: 'Americano', qty: 1 }, { name: 'Nasi Goreng Spesial', qty: 1 }], orderCounter, 'Pesanan employee discount')
  orderCounter++
  await createHistoricalOrder(3, 0.9, [{ name: 'Mie Goreng Jawa', qty: 1 }, { name: 'Jus Jeruk', qty: 1 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(5, 0.8, [{ name: 'Ayam Geprek', qty: 2 }, { name: 'Es Teh Manis', qty: 2 }], orderCounter, 'Ayamnya crispy ya')
  orderCounter++
  await createHistoricalOrder(7, 0.7, [{ name: 'Kopi Susu Gula Aren', qty: 2 }], orderCounter, 'Takeaway')
  orderCounter++
  await createHistoricalOrder(9, 0.6, [{ name: 'Cappuccino', qty: 1 }, { name: 'French Fries', qty: 1 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(11, 0.5, [{ name: 'Rice Bowl Teriyaki', qty: 1 }, { name: 'Pudding Coklat', qty: 1 }], orderCounter, 'Puddingnya jangan terlalu dingin')
  orderCounter++
  await createHistoricalOrder(2, 0.4, [{ name: 'Americano', qty: 3 }], orderCounter, '3 americano, semua hot ya')
  orderCounter++
  await createHistoricalOrder(4, 0.3, [{ name: 'Nasi Goreng Spesial', qty: 2 }, { name: 'Mie Goreng Jawa', qty: 1 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(6, 0.2, [{ name: 'Kopi Susu Gula Aren', qty: 2 }, { name: 'Roti Bakar Coklat Keju', qty: 2 }], orderCounter, 'Roti bakarnya快点 ya lagi buru')
  orderCounter++
  await createHistoricalOrder(8, 0.1, [{ name: 'Ayam Geprek', qty: 1 }, { name: 'Jus Jeruk', qty: 1 }, { name: 'Pisang Goreng Keju', qty: 1 }], orderCounter)
  orderCounter++
  await createHistoricalOrder(10, 0.05, [{ name: 'Soto Ayam', qty: 1 }, { name: 'Es Campur', qty: 1 }], orderCounter, 'Sotonya tanpa bihun ya')
  orderCounter++
  await createHistoricalOrder(12, 0.02, [{ name: 'Bakso', qty: 2 }, { name: 'Vietnamese Coffee', qty: 1 }], orderCounter, 'Baksonya masukin ke.box aja')

  console.log('✅ Created historical completed orders for reports')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n========================================')
  console.log('Demo credentials:')
  console.log('  Email: admin@warungnusantara.com')
  console.log('  Password: admin123')
  console.log('\nOutlet: Warung Nusantara')
  console.log('  Slug: warung-nusantara-sby')
  console.log('  Address: Jl. Soekarno Hatta No. 123, Surabaya')
  console.log('\nMenu Summary:')
  console.log('  - 10 Minuman')
  console.log('  - 8 Makanan Berat')
  console.log('  - 6 Snack')
  console.log('  - 5 Dessert')
  console.log('  - Total: 29 menu items')
  console.log('\nActive Orders (for queue demo):')
  console.log('  - ORD-WAR-03-001 (Meja 3) - PROCESSING')
  console.log('  - ORD-WAR-07-001 (Meja 7) - PENDING')
  console.log('  - ORD-WAR-11-001 (Meja 11) - PENDING')
  console.log('\nTable QR Tokens:')
  console.log('  12 random secure tokens (12 chars each)')
  console.log('  View tokens in admin panel: /admin/tables')
  console.log('========================================')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
