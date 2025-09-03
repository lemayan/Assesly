import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();
const router = Router();

const submitSchema = z.object({
  examId: z.number().int(),
  answers: z.array(z.object({ questionId: z.number().int(), selectedOptionId: z.number().int() }))
});

router.post('/submit', requireAuth, async (req: AuthRequest, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { examId, answers } = parsed.data;

  // fetch correct options
  const questions = await prisma.question.findMany({
    where: { examId },
    include: { options: true }
  });
  const correctMap = new Map<number, number>();
  for (const q of questions) {
    const correct = q.options.find((o) => o.isCorrect);
    if (correct) correctMap.set(q.id, correct.id);
  }

  let correctCount = 0;
  const answerCreates = answers.map((a) => {
    const correctId = correctMap.get(a.questionId);
    const isCorrect = correctId === a.selectedOptionId;
    if (isCorrect) correctCount += 1;
    return { questionId: a.questionId, selectedOptionId: a.selectedOptionId, isCorrect };
  });

  const percentage = questions.length ? Math.round((correctCount / questions.length) * 10000) / 100 : 0;
  const result = await prisma.result.create({
    data: {
      userId: req.user!.id,
      examId,
      score: correctCount,
      percentage,
      answers: { createMany: { data: answerCreates } }
    }
  });

  const pass = percentage >= 70;
  res.json({ id: result.id, score: result.score, percentage, pass });
});

router.get('/mine', requireAuth, async (req: AuthRequest, res) => {
  const results = await prisma.result.findMany({
    where: { userId: req.user!.id },
    include: { exam: { include: { _count: { select: { questions: true } } } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(results);
});

router.get('/:id/detail', requireAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const result = await prisma.result.findFirst({
    where: { id, userId: req.user!.id },
    include: { answers: { include: { question: { include: { options: true } }, selectedOption: true } }, exam: true }
  });
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json(result);
});

// Basic analytics for admin dashboard
router.get('/analytics/overview', requireAuth, async (req: AuthRequest, res) => {
  // If admin, show global; if student, show personal
  const filter = req.user!.role === 'admin' ? {} : { userId: req.user!.id };
  const results = await prisma.result.findMany({ where: filter, include: { answers: { include: { question: true } } } });

  const total = results.length;
  const avg = total ? results.reduce((s, r) => s + r.percentage, 0) / total : 0;
  const passRate = total ? (results.filter(r => r.percentage >= 70).length / total) * 100 : 0;

  const topicStats = new Map<string, { correct: number; total: number }>();
  for (const r of results) {
    for (const a of r.answers) {
      const topic = a.question.topic;
      const stat = topicStats.get(topic) || { correct: 0, total: 0 };
      stat.total += 1;
      if (a.isCorrect) stat.correct += 1;
      topicStats.set(topic, stat);
    }
  }
  const topics = Array.from(topicStats.entries()).map(([topic, s]) => ({ topic, percentage: s.total ? Math.round((s.correct / s.total) * 10000) / 100 : 0 }));

  res.json({ totalAttempts: total, averagePercentage: Math.round(avg * 100) / 100, passRate: Math.round(passRate * 100) / 100, topics });
});

// List students (admin only) for analytics selection
router.get('/analytics/students', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    select: { id: true, email: true, name: true, _count: { select: { results: true } } },
    orderBy: { email: 'asc' }
  });
  res.json(students);
});

// Per-student analytics (admin only): attempts over time and topic breakdown
router.get('/analytics/user/:userId', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId)) return res.status(400).json({ error: 'Invalid user id' });

  const results = await prisma.result.findMany({
    where: { userId },
    include: {
      exam: true,
      answers: { include: { question: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  const attempts = results.map((r) => ({
    id: r.id,
    date: r.createdAt,
    exam: r.exam.title,
    percentage: r.percentage
  }));

  const topicStats = new Map<string, { correct: number; total: number }>();
  for (const r of results) {
    for (const a of r.answers) {
      const topic = a.question.topic || 'General';
      const stat = topicStats.get(topic) || { correct: 0, total: 0 };
      stat.total += 1;
      if (a.isCorrect) stat.correct += 1;
      topicStats.set(topic, stat);
    }
  }
  const topics = Array.from(topicStats.entries()).map(([topic, s]) => ({
    topic,
    correct: s.correct,
    total: s.total,
    percentage: s.total ? Math.round((s.correct / s.total) * 10000) / 100 : 0
  }));

  const avg = attempts.length ? attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length : 0;
  const best = attempts.length ? Math.max(...attempts.map((a) => a.percentage)) : 0;
  const worst = attempts.length ? Math.min(...attempts.map((a) => a.percentage)) : 0;

  res.json({ attempts, topics, summary: { attempts: attempts.length, averagePercentage: Math.round(avg * 100) / 100, best, worst } });
});

// Export all results as CSV (admin only)
router.get('/export/csv', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const examId = req.query.examId ? Number(req.query.examId) : undefined;
  const results = await prisma.result.findMany({
    where: examId ? { examId } : {},
    include: { user: true, exam: true },
    orderBy: { createdAt: 'desc' }
  });
  const rows = results.map((r) => ({
    user: r.user.email,
    exam: r.exam.title,
    score: r.score,
    percentage: r.percentage,
    createdAt: r.createdAt.toISOString()
  }));
  const { Parser } = await import('json2csv');
  const parser = new Parser({ fields: ['user', 'exam', 'score', 'percentage', 'createdAt'] });
  const csv = parser.parse(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
  res.send(csv);
});

// Export a single result as PDF (owner or admin)
router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const result = await prisma.result.findUnique({
    where: { id },
    include: { user: true, exam: true, answers: { include: { question: { include: { options: true } }, selectedOption: true } } }
  });
  if (!result) return res.status(404).json({ error: 'Not found' });
  if (req.user!.role !== 'admin' && result.userId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

  res.status(200);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="result-${id}.pdf"`);
  const doc = new PDFDocument({ autoFirstPage: true });
  doc.on('error', (err) => {
    console.error('PDF stream error:', err);
    if (!res.headersSent) res.status(500);
    try { res.end(); } catch {}
  });
  doc.pipe(res);
  const pageMargin = 50;

  // Brand header
  doc.rect(0, 0, doc.page.width, 70).fill('#0f172a'); // slate-900
  doc.fill('#ffffff').fontSize(20).text('Examina — Result Report', pageMargin, 24);
  doc.fillColor('#64748b').fontSize(10).text(new Date(result.createdAt).toLocaleString(), doc.page.width - pageMargin - 160, 28, { width: 160, align: 'right' });

  // Overview card
  doc.fillColor('#000000');
  doc.rect(pageMargin, 90, doc.page.width - pageMargin * 2, 90).stroke('#e5e7eb');
  const leftX = pageMargin + 14;
  const topY = 100;
  doc.fontSize(12).fillColor('#0f172a').text(`Student: `, leftX, topY);
  doc.font('Helvetica-Bold').text(`${result.user.name || result.user.email}`, { continued: false });
  doc.font('Helvetica').fillColor('#0f172a').text(`Exam: ${result.exam.title}`);
  doc.text(`Date: ${new Date(result.createdAt).toLocaleString()}`);
  const totalQuestions = result.answers.length;
  const correct = result.answers.filter(a => a.isCorrect).length;
  const incorrect = Math.max(totalQuestions - correct, 0);
  const pct = Math.round((correct / Math.max(1,totalQuestions)) * 10000)/100;
  doc.moveDown(0.3);
  doc.fontSize(13).fillColor(pct >= 70 ? '#16a34a' : '#ef4444').text(`Score: ${correct}/${totalQuestions} (${pct}%)`);

  // Mini chart: topic accuracy horizontal bars
  const topics = (() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const a of result.answers) {
      const key = a.question.topic || 'General';
      const s = map.get(key) || { correct: 0, total: 0 };
      s.total += 1; if (a.isCorrect) s.correct += 1; map.set(key, s);
    }
    return Array.from(map.entries()).map(([topic, s]) => ({ topic, pct: s.total ? Math.round((s.correct/s.total)*100) : 0 })).sort((a,b)=>b.pct-a.pct).slice(0, 8);
  })();
  const chartX = pageMargin + 300;
  const chartY = 105;
  const barW = doc.page.width - pageMargin - chartX - 20;
  const lineH = 12;
  doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text('Topic accuracy', chartX, chartY - 12);
  topics.forEach((t, i) => {
    const y = chartY + i * (lineH + 6);
    // background
    doc.rect(chartX, y, barW, lineH).fill('#e5e7eb');
    // value
    const w = Math.max(2, Math.round((t.pct/100) * barW));
    doc.rect(chartX, y, w, lineH).fill('#3b82f6');
    doc.fillColor('#0f172a').text(`${t.topic} — ${t.pct}%`, chartX + 4, y - 1);
  });

  // Body: Answer details
  doc.addPage();
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Answers & Explanations', pageMargin, pageMargin);
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(11);

  const bodyWidth = doc.page.width - pageMargin * 2;
  for (let i = 0; i < result.answers.length; i++) {
    const a = result.answers[i];
    const correctOpt = (a.question.options || []).find(o => o.isCorrect);
    const color = a.isCorrect ? '#16a34a' : '#ef4444';
    doc.fillColor('#0f172a').text(`${i + 1}. ${a.question.text}`, { width: bodyWidth });
    doc.fillColor('#475569').text(`Your answer: `, { continued: true });
    doc.fillColor(color).text(`${a.selectedOption?.text || '-'}`);
    doc.fillColor('#475569').text(`Correct answer: `, { continued: true });
    doc.fillColor('#16a34a').text(`${correctOpt?.text || '-'}`);
    if (a.question.rationale) {
      doc.fillColor('#64748b').text(`Explanation: ${a.question.rationale}`, { width: bodyWidth });
    }
    doc.moveDown(0.6);
    // Add page break safety
    if (doc.y > doc.page.height - pageMargin - 60 && i < result.answers.length - 1) {
      doc.addPage();
      doc.y = pageMargin;
    }
  }

  // Footer page numbers
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(9).fillColor('#94a3b8').text(`Page ${i + 1} of ${range.count}`,
      0, doc.page.height - 30, { align: 'center' });
  }

  doc.end();
});

export default router;
// Additional admin analytics
router.get('/analytics/admin/series', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const since = new Date(); since.setDate(since.getDate() - 13); since.setHours(0,0,0,0);
  const rows = await prisma.result.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = new Date(r.createdAt).toISOString().slice(0,10);
    map.set(key, (map.get(key) || 0) + 1);
  }
  const series: { date: string; attempts: number }[] = [];
  for (let i=0;i<14;i++) {
    const d = new Date(since); d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0,10);
    series.push({ date: key, attempts: map.get(key) || 0 });
  }
  res.json(series);
});

router.get('/analytics/admin/top-exams', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const rows = await prisma.result.groupBy({
    by: ['examId'],
    _count: { _all: true },
  });
  const withExam = await Promise.all(rows.map(async (r) => ({
    exam: await prisma.exam.findUnique({ where: { id: r.examId } }),
    attempts: (r._count as any)._all,
  })));
  withExam.sort((a,b) => b.attempts - a.attempts);
  res.json(withExam.slice(0, 5));
});

router.get('/analytics/admin/recent', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const recents = await prisma.result.findMany({
    include: { user: true, exam: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  res.json(recents);
});
