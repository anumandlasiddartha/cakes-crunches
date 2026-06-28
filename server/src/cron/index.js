/**
 * Cron Job Registration — Automated scheduled tasks
 */
import cron from "node-cron";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

export function registerCronJobs() {
  // ── Daily: Check for overdue payments (runs at 8:00 AM) ────
  cron.schedule("0 8 * * *", async () => {
    try {
      logger.info("⏰ Running overdue payment check...");

      const today = new Date();
      const overdueOrders = await prisma.bulkOrder.findMany({
        where: {
          deletedAt: null,
          paymentDueDate: { lt: today },
          balanceAmount: { gt: 0 },
          paymentStatus: { in: ["unpaid", "partial"] },
        },
        include: { customer: true },
      });

      for (const order of overdueOrders) {
        // Update payment status to overdue
        await prisma.bulkOrder.update({
          where: { id: order.id },
          data: { paymentStatus: "overdue" },
        });

        // Create alert
        const existingAlert = await prisma.alert.findFirst({
          where: {
            entityType: "bulk_order",
            entityId: order.id,
            type: "payment_overdue",
            createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) },
          },
        });

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              type: "payment_overdue",
              severity: "critical",
              title: "Payment Overdue",
              message: `Order ${order.orderNumber} from ${order.customer.name} has ₹${order.balanceAmount} overdue. Due date was ${order.paymentDueDate?.toISOString().split("T")[0]}.`,
              entityType: "bulk_order",
              entityId: order.id,
            },
          });
        }
      }

      logger.info(`⏰ Overdue check complete: ${overdueOrders.length} orders found.`);
    } catch (error) {
      logger.error("Cron error (overdue check):", error);
    }
  });

  // ── Daily: Send payment reminders (runs at 9:00 AM) ────────
  cron.schedule("0 9 * * *", async () => {
    try {
      logger.info("⏰ Running payment reminder check...");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const reminders = await prisma.reminder.findMany({
        where: {
          status: "pending",
          reminderDate: { gte: today, lt: tomorrow },
        },
        include: {
          bulkOrder: { include: { customer: true } },
        },
      });

      for (const reminder of reminders) {
        // Create notification alert
        await prisma.alert.create({
          data: {
            type: "reminder_today",
            severity: "info",
            title: "Payment Reminder",
            message: reminder.message || `Reminder for order ${reminder.bulkOrder.orderNumber}`,
            entityType: "bulk_order",
            entityId: reminder.bulkOrderId,
          },
        });

        // Mark reminder as sent
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "sent", emailSent: true, sentAt: new Date() },
        });
      }

      logger.info(`⏰ Reminders processed: ${reminders.length} sent.`);
    } catch (error) {
      logger.error("Cron error (reminders):", error);
    }
  });

  // ── Weekly: Balance due summary (runs Monday 7:00 AM) ──────
  cron.schedule("0 7 * * 1", async () => {
    try {
      logger.info("⏰ Running weekly balance summary...");

      const pendingOrders = await prisma.bulkOrder.count({
        where: { deletedAt: null, balanceAmount: { gt: 0 } },
      });

      const totalPending = await prisma.bulkOrder.aggregate({
        where: { deletedAt: null, balanceAmount: { gt: 0 } },
        _sum: { balanceAmount: true },
      });

      await prisma.alert.create({
        data: {
          type: "balance_due",
          severity: "warning",
          title: "Weekly Balance Summary",
          message: `${pendingOrders} orders have pending balances totaling ₹${(parseFloat(totalPending._sum.balanceAmount) || 0).toLocaleString()}.`,
        },
      });

      logger.info("⏰ Weekly summary created.");
    } catch (error) {
      logger.error("Cron error (weekly summary):", error);
    }
  });

  logger.info("📅 Cron jobs scheduled: overdue@8AM, reminders@9AM, weekly@Mon7AM");
}
