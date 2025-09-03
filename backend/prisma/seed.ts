import { PrismaClient, Role, ExamMode } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
      role: 'admin' as Role
    }
  });

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      name: 'Student',
      email: studentEmail,
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'student' as Role
    }
  });

  const exam = await prisma.exam.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Sample Exam',
      description: 'A sample exam for testing',
      duration: 30,
      mode: 'exam' as ExamMode,
      createdBy: admin.id
    }
  });

  const q1 = await prisma.question.create({
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

  const q2 = await prisma.question.create({
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

  console.log({ admin: admin.email, student: student.email, examId: exam.id, questions: [q1.id, q2.id] });
}

main().finally(async () => {
  await prisma.$disconnect();
});
