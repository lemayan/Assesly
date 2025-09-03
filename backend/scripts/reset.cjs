// Reset the database to a brand-new state.
// WARNING: This deletes ALL data. Optionally recreates a default admin if ADMIN_EMAIL and ADMIN_PASSWORD are set.
// Usage (PowerShell):
//   $env:ADMIN_EMAIL = 'admin@example.com'
//   $env:ADMIN_PASSWORD = 'ChangeMe123!'
//   $env:ADMIN_NAME = 'Admin'
//   npm run reset
//   Remove-Item Env:ADMIN_EMAIL; Remove-Item Env:ADMIN_PASSWORD; Remove-Item Env:ADMIN_NAME

require('dotenv/config');
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting database...');
  // Delete in FK-safe order
  const results = [];
  results.push({ table: 'Answer', ...(await prisma.answer.deleteMany()) });
  results.push({ table: 'Result', ...(await prisma.result.deleteMany()) });
  results.push({ table: 'Option', ...(await prisma.option.deleteMany()) });
  results.push({ table: 'Question', ...(await prisma.question.deleteMany()) });
  results.push({ table: 'Exam', ...(await prisma.exam.deleteMany()) });
  results.push({ table: 'User', ...(await prisma.user.deleteMany()) });
  console.table(results.map(r => ({ table: r.table, deleted: r.count })));

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const user = await prisma.user.create({
      data: { name: ADMIN_NAME || 'Admin', email: ADMIN_EMAIL, passwordHash, role: Role.admin }
    });
    console.log('Created default admin:', { id: user.id, email: user.email });
  } else {
    console.log('No default admin created (set ADMIN_EMAIL and ADMIN_PASSWORD to create one).');
  }
  console.log('Reset complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
