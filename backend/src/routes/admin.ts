import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

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
