import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const examSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().min(1),
  mode: z.enum(['practice', 'exam']).default('exam')
});

router.post('/', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  const parsed = examSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { title, description, duration, mode } = parsed.data;
  const exam = await prisma.exam.create({ data: {
    title,
    description,
    duration,
  mode,
    createdBy: req.user!.id
  }});
  res.json(exam);
});

router.get('/', requireAuth, async (_req, res) => {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } }
  });
  res.json(exams);
});

router.get('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const shuffle = (req.query.shuffle ?? '1') !== '0';
  const exam = await prisma.exam.findUnique({ where: { id }, include: { questions: { include: { options: true } } } });
  if (!exam) return res.status(404).json({ error: 'Not found' });

  // Sanitize: remove questions lacking options or a correct answer; clean empty option texts
  let questions = exam.questions
    .map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] }))
    .map((q) => ({
      ...q,
      options: q.options.filter((o) => o && typeof o.text === 'string' && o.text.trim().length > 0)
    }))
    .filter((q) => q.options.length > 0 && q.options.some((o) => !!o.isCorrect));

  if (questions.length === 0) {
    return res.status(400).json({ error: 'This exam has no valid questions. Ensure each question has options and a correct answer.' });
  }
  if (shuffle) {
    questions.sort(() => Math.random() - 0.5);
  }
  if (typeof limit === 'number' && !Number.isNaN(limit)) {
    questions = questions.slice(0, Math.max(1, Math.min(limit, questions.length)));
  }
  // shuffle options per question
  if (shuffle) {
    questions = questions.map((q) => ({ ...q, options: [...q.options].sort(() => Math.random() - 0.5) }));
  }

  res.json({ ...exam, questions });
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = examSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const exam = await prisma.exam.update({ where: { id }, data: parsed.data });
  res.json(exam);
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.$transaction(async (tx) => {
      // Delete answers tied to results for this exam
      const results = await tx.result.findMany({ where: { examId: id }, select: { id: true } });
      const resultIds = results.map(r => r.id);
      if (resultIds.length) {
        await tx.answer.deleteMany({ where: { resultId: { in: resultIds } } });
      }
      await tx.result.deleteMany({ where: { examId: id } });

      // Delete answers/options for questions of this exam, then the questions
      const questions = await tx.question.findMany({ where: { examId: id }, select: { id: true } });
      const qIds = questions.map(q => q.id);
      if (qIds.length) {
        await tx.answer.deleteMany({ where: { questionId: { in: qIds } } });
        await tx.option.deleteMany({ where: { questionId: { in: qIds } } });
      }
      await tx.question.deleteMany({ where: { examId: id } });

      // Finally delete the exam
      await tx.exam.delete({ where: { id } });
    });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to delete exam' });
  }
});

export default router;
