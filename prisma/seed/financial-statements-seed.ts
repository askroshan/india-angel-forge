import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Financial Statements
 * 
 * Creates test financial statements for users with completed payments.
 * Generates statements for the last 6 months with both SUMMARY and DETAILED formats.
 * 
 * E2E Tests: FS-E2E-001 to FS-E2E-008
 */
export async function seedFinancialStatements() {
  console.log('Seeding financial statements...');

  try {
    // Get users with payments
    const usersWithPayments = await prisma.user.findMany({
      where: {
        payments: {
          some: {
            status: 'COMPLETED',
          },
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (usersWithPayments.length === 0) {
      console.log('No users with payments found. Skipping financial statements seed.');
      return;
    }

    console.log(`Found ${usersWithPayments.length} users with payments`);

    // Generate statements for the last 6 months
    const today = new Date();
    const statementsToCreate = [];
    let statementCount = 0;

    for (const user of usersWithPayments) {
      for (let monthsAgo = 0; monthsAgo < 6; monthsAgo++) {
        const statementDate = new Date(today);
        statementDate.setMonth(today.getMonth() - monthsAgo);
        
        const month = statementDate.getMonth() + 1; // 1-12
        const year = statementDate.getFullYear();

        // Check if user has payments for this month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const paymentsInPeriod = await prisma.payment.findMany({
          where: {
            userId: user.id,
            status: 'COMPLETED',
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        if (paymentsInPeriod.length === 0) {
          continue; // Skip months with no payments
        }

        // Calculate totals
        const totalAmount = Number(paymentsInPeriod.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2));
        const totalTax = Number((totalAmount * 0.19).toFixed(2)); // 18% GST + 1% TDS
        const netAmount = Number((totalAmount - totalTax).toFixed(2));

        // Generate statement number
        const statementNumber = `FS-${year}-${month.toString().padStart(2, '0')}-${(statementCount + 1).toString().padStart(5, '0')}`;

        // Create DETAILED statement
        const detailedStatement = {
          userId: user.id,
          statementNumber: statementNumber,
          dateFrom: startDate,
          dateTo: endDate,
          format: 'detailed',
          totalInvested: totalAmount,
          totalRefunded: 0,
          netInvestment: netAmount,
          totalTax,
          pdfUrl: `/statements/${statementNumber}.pdf`,
          emailedTo: monthsAgo === 0 ? [user.email] : [], // Latest statement is emailed
          generatedAt: new Date(year, month - 1, 25), // Generated on 25th of the month
        };

        statementsToCreate.push(detailedStatement);
        statementCount++;

        // Create SUMMARY statement for every other month
        if (monthsAgo % 2 === 0) {
          const summaryNumber = `FS-${year}-${month.toString().padStart(2, '0')}-${(statementCount + 1).toString().padStart(5, '0')}`;
          
          const summaryStatement = {
            userId: user.id,
            statementNumber: summaryNumber,
            dateFrom: startDate,
            dateTo: endDate,
            format: 'summary',
            totalInvested: totalAmount,
            totalRefunded: 0,
            netInvestment: netAmount,
            totalTax,
            pdfUrl: `/statements/${summaryNumber}.pdf`,
            emailedTo: [],
            generatedAt: new Date(year, month - 1, 26), // Generated on 26th of the month
          };

          statementsToCreate.push(summaryStatement);
          statementCount++;
        }
      }
    }

    // Create all statements
    for (const statement of statementsToCreate) {
      await prisma.financialStatement.upsert({
        where: {
          statementNumber: statement.statementNumber,
        },
        create: statement,
        update: statement,
      });
    }

    console.log(`✅ Created ${statementsToCreate.length} financial statements`);
  } catch (error) {
    console.error('Error seeding financial statements:', error);
    throw error;
  }
}

// If run directly, execute the seed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFinancialStatements()
    .catch((e) => {
      console.error('❌ Financial statements seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
