const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@examina.local';
  const studentEmail = 'student@examina.local';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'admin'
    }
  });

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      name: 'Student',
      email: studentEmail,
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'student'
    }
  });

  const exam = await prisma.exam.create({
    data: {
      title: 'Sample Exam',
      description: 'A sample exam for testing',
      duration: 30,
      mode: 'exam',
      createdBy: admin.id
    }
  });

  await prisma.question.create({
    data: {
      examId: exam.id,
      text: 'What is 2 + 2?',
      topic: 'Math',
      difficulty: 'Easy',
      rationale: 'Basic arithmetic',
      options: { createMany: { data: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false }
      ] } }
    }
  });

  await prisma.question.create({
    data: {
      examId: exam.id,
      text: 'Capital of France?',
      topic: 'Geography',
      difficulty: 'Easy',
      rationale: 'Paris is the capital city of France',
      options: { createMany: { data: [
        { text: 'Berlin', isCorrect: false },
        { text: 'Madrid', isCorrect: false },
        { text: 'Paris', isCorrect: true }
      ] } }
    }
  });

  console.log({ admin: admin.email, student: student.email, examId: exam.id });
}

main().finally(async () => {
  await prisma.$disconnect();
});
