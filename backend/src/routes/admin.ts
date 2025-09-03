import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// POST /api/admin/reset
// Clears all app data and preserves only the current admin user.
router.post('/reset', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  const currentAdminId = req.user!.id;
  try {
    const summary = await prisma.$transaction(async (tx) => {
      // Remove answers tied to results
      const answersRes = await tx.answer.deleteMany({});
      // Remove results
      const resultsRes = await tx.result.deleteMany({});

      // Remove options and answers for questions
      const questions = await tx.question.findMany({ select: { id: true } });
      const qIds = questions.map((q) => q.id);
      let answersQRes = { count: 0 } as { count: number };
      if (qIds.length) {
        answersQRes = await tx.answer.deleteMany({ where: { questionId: { in: qIds } } });
        await tx.option.deleteMany({ where: { questionId: { in: qIds } } });
      }
      const questionsRes = await tx.question.deleteMany({});

      // Remove exams
      const examsRes = await tx.exam.deleteMany({});

      // Remove users except current admin
      const usersRes = await tx.user.deleteMany({ where: { id: { not: currentAdminId } } });

      return {
        answersFromResults: answersRes.count,
        answersFromQuestions: answersQRes.count,
        results: resultsRes.count,
        options: 'deleted with questions',
        questions: questionsRes.count,
        exams: examsRes.count,
        usersDeleted: usersRes.count,
        adminPreserved: currentAdminId,
      };
    }); 
    res.json({ ok: true, summary });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to reset system' });
  }
});

export default router;
// Create student users (admin) with relaxed email rules
const createStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

router.post('/users', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  const parsed = createStudentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name } = parsed.data;
  let { email, password } = parsed.data as { email?: string; password?: string };

  // Helpers
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'student';
  const ensureUniqueEmail = async (baseEmail: string) => {
    const at = baseEmail.indexOf('@');
    if (at < 0) {
      // Fallback to default domain
      baseEmail = `${baseEmail}@examina.local`;
    }
    const [local, domain] = baseEmail.split('@');
    let candidate = `${local}@${domain}`;
    let i = 1;
    while (await prisma.user.findUnique({ where: { email: candidate } })) {
      i += 1;
      candidate = `${local}+${i}@${domain}`;
    }
    return candidate;
  };

  try {
    // Generate email if missing
    if (!email) {
      email = await ensureUniqueEmail(`${slugify(name)}@examina.local`);
    } else {
      // De-duplicate if email taken
      email = await ensureUniqueEmail(email);
    }

    // Generate password if missing
    let plainPassword = password;
    if (!plainPassword) {
      plainPassword = Math.random().toString(36).slice(-10);
    }
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'student' },
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: password ? undefined : plainPassword,
      note: password ? undefined : 'Password generated; share it securely with the student.'
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to create user' });
  }
});
