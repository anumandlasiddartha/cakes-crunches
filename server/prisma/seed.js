/**
 * ═══════════════════════════════════════════════════════════════
 * Prisma Seed Script — Populate database with demo data
 *
 * Run: npm run prisma:seed
 * ═══════════════════════════════════════════════════════════════
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Roles ──────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "admin" },
      update: {},
      create: {
        name: "admin",
        description: "Full system access",
        permissions: JSON.stringify(["all"]),
      },
    }),
    prisma.role.upsert({
      where: { name: "manager" },
      update: {},
      create: {
        name: "manager",
        description: "Order and payment management",
        permissions: JSON.stringify(["orders", "payments", "customers", "reports", "wallet"]),
      },
    }),
    prisma.role.upsert({
      where: { name: "staff" },
      update: {},
      create: {
        name: "staff",
        description: "Basic order entry and viewing",
        permissions: JSON.stringify(["orders.view", "orders.create", "customers.view", "payments.view"]),
      },
    }),
  ]);
  console.log(`✅ Roles: ${roles.length} created`);

  // ── Users ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@cakesandcrunches.com" },
      update: {},
      create: {
        email: "admin@cakesandcrunches.com",
        passwordHash,
        firstName: "Admin",
        lastName: "Chef",
        phone: "9876543210",
        roleId: roles[0].id,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager@cakesandcrunches.com" },
      update: {},
      create: {
        email: "manager@cakesandcrunches.com",
        passwordHash,
        firstName: "Priya",
        lastName: "Sharma",
        phone: "9876543211",
        roleId: roles[1].id,
      },
    }),
    prisma.user.upsert({
      where: { email: "staff@cakesandcrunches.com" },
      update: {},
      create: {
        email: "staff@cakesandcrunches.com",
        passwordHash,
        firstName: "Rahul",
        lastName: "Kumar",
        phone: "9876543212",
        roleId: roles[2].id,
      },
    }),
  ]);
  console.log(`✅ Users: ${users.length} created (password: admin123)`);

  // ── Payment Methods ────────────────────────────────
  const methods = ["cash", "upi", "card", "bank_transfer", "cheque"];
  const methodDisplayNames = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

  for (let i = 0; i < methods.length; i++) {
    await prisma.paymentMethod.upsert({
      where: { name: methods[i] },
      update: {},
      create: { name: methods[i], displayName: methodDisplayNames[i], sortOrder: i },
    });
  }
  console.log(`✅ Payment Methods: ${methods.length} created`);

  // ── Settings ───────────────────────────────────────
  const settings = [
    { key: "low_advance_limit_percent", value: "30", type: "number", category: "payments", description: "Minimum advance percentage to accept orders" },
    { key: "overdue_grace_days", value: "3", type: "number", category: "payments", description: "Grace days before marking as overdue" },
    { key: "large_order_limit", value: "50000", type: "number", category: "orders", description: "Amount threshold for high-value order alerts" },
    { key: "company_name", value: "Cakes and Crunches", type: "string", category: "general", description: "Company name" },
    { key: "company_phone", value: "+91 98765 43210", type: "string", category: "general", description: "Company phone" },
    { key: "company_email", value: "info@cakesandcrunches.com", type: "string", category: "general", description: "Company email" },
    { key: "company_address", value: "123 Baker Street, Sweet City, India", type: "string", category: "general", description: "Company address" },
    { key: "tax_rate", value: "18", type: "number", category: "payments", description: "Default GST rate (%)" },
    { key: "currency", value: "INR", type: "string", category: "general", description: "Default currency" },
    { key: "reminder_days_before", value: "3", type: "number", category: "reminders", description: "Days before event to send reminder" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`✅ Settings: ${settings.length} created`);

  // ── Sample Customers ───────────────────────────────
  const customerData = [
    { name: "Ananya Patel", phone: "9812345001", email: "ananya@email.com", city: "Mumbai", address: "45 Marine Drive, Mumbai" },
    { name: "Vikram Mehta", phone: "9812345002", email: "vikram@email.com", city: "Delhi", address: "12 Connaught Place, Delhi" },
    { name: "Sneha Reddy", phone: "9812345003", email: "sneha@email.com", city: "Hyderabad", address: "78 Banjara Hills, Hyderabad" },
    { name: "Rajesh Kumar", phone: "9812345004", email: "rajesh@email.com", city: "Bangalore", address: "56 MG Road, Bangalore" },
    { name: "Meera Iyer", phone: "9812345005", email: "meera@email.com", city: "Chennai", address: "23 Anna Nagar, Chennai" },
    { name: "Arjun Singh", phone: "9812345006", email: "arjun@email.com", city: "Jaipur", address: "90 MI Road, Jaipur" },
    { name: "Kavitha Nair", phone: "9812345007", email: "kavitha@email.com", city: "Kochi", address: "34 MG Road, Kochi" },
    { name: "Deepak Sharma", phone: "9812345008", email: "deepak@email.com", city: "Pune", address: "67 FC Road, Pune" },
  ];

  const customers = [];
  for (const c of customerData) {
    const cust = await prisma.customer.create({ data: c });
    // Auto-create wallet
    await prisma.wallet.create({ data: { customerId: cust.id, balance: 0 } });
    customers.push(cust);
  }
  console.log(`✅ Customers: ${customers.length} created with wallets`);

  // ── Sample Bulk Orders ─────────────────────────────
  const orderData = [
    {
      customer: 0, event: "Wedding", items: [
        { itemName: "3-Tier Wedding Cake", quantity: 1, unitPrice: 15000, weight: "5 kg", flavor: "Vanilla Butterscotch" },
        { itemName: "Cup Cakes", quantity: 100, unitPrice: 80, flavor: "Assorted" },
        { itemName: "Pastries Box", quantity: 50, unitPrice: 120, flavor: "Chocolate" },
      ],
    },
    {
      customer: 1, event: "Corporate Event", items: [
        { itemName: "Corporate Logo Cake", quantity: 1, unitPrice: 8000, weight: "3 kg", flavor: "Red Velvet" },
        { itemName: "Mini Croissants", quantity: 200, unitPrice: 45, category: "Pastries" },
      ],
    },
    {
      customer: 2, event: "Birthday", items: [
        { itemName: "Birthday Cake", quantity: 1, unitPrice: 3500, weight: "2 kg", flavor: "Chocolate Truffle" },
        { itemName: "Cake Pops", quantity: 30, unitPrice: 60 },
      ],
    },
    {
      customer: 3, event: "Anniversary", items: [
        { itemName: "Heart Shape Cake", quantity: 1, unitPrice: 4500, weight: "2 kg", flavor: "Strawberry" },
        { itemName: "Chocolate Truffles", quantity: 50, unitPrice: 35 },
      ],
    },
    {
      customer: 4, event: "Engagement", items: [
        { itemName: "Engagement Cake", quantity: 1, unitPrice: 12000, weight: "4 kg", flavor: "Vanilla" },
        { itemName: "Danish Pastries", quantity: 80, unitPrice: 90 },
      ],
    },
  ];

  const statuses = ["pending", "confirmed", "in_production", "ready", "delivered"];

  for (let i = 0; i < orderData.length; i++) {
    const od = orderData[i];
    let totalAmount = 0;
    const items = od.items.map((item) => {
      const total = item.quantity * item.unitPrice;
      totalAmount += total;
      return { ...item, totalPrice: total };
    });

    const grandTotal = totalAmount;
    const advanceAmount = i < 3 ? Math.round(grandTotal * 0.4) : 0;
    const paidAmount = advanceAmount;
    const balanceAmount = grandTotal - paidAmount;
    const status = statuses[i % statuses.length];
    const paymentStatus = advanceAmount > 0 ? (balanceAmount <= 0 ? "paid" : "partial") : "unpaid";

    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + (i + 1) * 5);

    const dueDate = new Date(eventDate);
    dueDate.setDate(dueDate.getDate() - 1);

    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - (i * 3));

    const order = await prisma.bulkOrder.create({
      data: {
        orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(i + 1).padStart(4, "0")}`,
        customerId: customers[od.customer].id,
        orderDate,
        eventDate,
        eventType: od.event,
        totalAmount,
        grandTotal,
        advanceAmount,
        paidAmount,
        balanceAmount,
        status,
        paymentStatus,
        paymentDueDate: dueDate,
        priority: i === 0 ? "high" : "normal",
        createdBy: users[0].id,
        orderItems: {
          create: items,
        },
      },
    });

    // Create advance payment if applicable
    if (advanceAmount > 0) {
      await prisma.advancePayment.create({
        data: {
          bulkOrderId: order.id,
          amount: advanceAmount,
          paymentMethod: ["cash", "upi", "card"][i % 3],
          receivedBy: users[0].id,
          receivedDate: orderDate,
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          transactionRef: `TXN-SEED-${String(i + 1).padStart(4, "0")}`,
          type: "advance_received",
          credit: advanceAmount,
          runningBalance: advanceAmount * (i + 1),
          description: `Seed advance for ${order.orderNumber}`,
          createdBy: users[0].id,
        },
      });
    }

    // Create order history
    await prisma.orderHistory.create({
      data: {
        bulkOrderId: order.id,
        toStatus: status,
        changedBy: users[0].id,
        notes: "Seeded order",
      },
    });

    // Update customer stats
    await prisma.customer.update({
      where: { id: customers[od.customer].id },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: paidAmount },
      },
    });
  }
  console.log(`✅ Bulk Orders: ${orderData.length} created with items, payments, and ledger entries`);

  // ── Sample Alerts ──────────────────────────────────
  await prisma.alert.createMany({
    data: [
      { type: "balance_due", severity: "warning", title: "Balance Due Today", message: "Order ORD-20260628-0001 has ₹40,500 balance due today." },
      { type: "high_value_order", severity: "info", title: "New High Value Order", message: "Order ORD-20260628-0001 worth ₹29,000+ created." },
      { type: "production_pending", severity: "info", title: "Production Pending", message: "3 orders are awaiting production start." },
    ],
  });
  console.log("✅ Alerts: 3 created");

  // ── Sample Activity Logs ───────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { userId: users[0].id, action: "user_login", details: "Admin logged in" },
      { userId: users[0].id, action: "order_created", details: "Created bulk order ORD-20260628-0001" },
      { userId: users[0].id, action: "payment_received", details: "Advance payment of ₹11,600 received" },
      { userId: users[1].id, action: "user_login", details: "Manager logged in" },
      { userId: users[1].id, action: "customer_created", details: "Added new customer Ananya Patel" },
    ],
  });
  console.log("✅ Activity Logs: 5 created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("   Admin:   admin@cakesandcrunches.com / admin123");
  console.log("   Manager: manager@cakesandcrunches.com / admin123");
  console.log("   Staff:   staff@cakesandcrunches.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
