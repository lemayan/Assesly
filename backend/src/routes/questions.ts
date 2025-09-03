import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import { parse } from '@fast-csv/parse';
import { requireAuth, requireRole } from '../middleware/auth';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const questionSchema = z.object({
  examId: z.number().int().optional(),
  text: z.string().min(1),
  subject: z.string().optional().nullable(),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  rationale: z.string().min(1),
  hint: z.string().optional().nullable(),
  options: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean() })).min(2)
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { examId, text, subject, topic, difficulty, rationale, hint, options } = parsed.data;
  const question = await prisma.question.create({
    data: ({
      examId,
      text,
      ...(subject ? { subject } : {}),
      topic,
      difficulty,
      rationale,
      ...(hint ? { hint } : {}),
      options: { createMany: { data: options } }
    } as any),
    include: { options: true }
  });
  res.json(question);
});

router.post('/import', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const examId = req.body.examId ? Number(req.body.examId) : undefined;
  if (!examId) return res.status(400).json({ error: 'Please select an exam to attach these questions.' });

  // Helpers to normalize headers and values
  const lc = (s: any) => String(s ?? '').trim();
  const stripBOM = (s: string) => s?.replace(/^\uFEFF/, '') ?? s;
  const normalize = (s: any) => String(s ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
  const getField = (row: any, names: string[]) => {
    const map: Record<string, any> = {};
    Object.keys(row || {}).forEach((k) => {
      const key = stripBOM(String(k)).trim().toLowerCase();
      map[key] = row[k];
    });
    for (const n of names) {
      const v = map[stripBOM(String(n)).trim().toLowerCase()];
      if (v !== undefined) return v;
    }
    return undefined;
  };
  const splitOptions = (raw: string) =>
    String(raw ?? '')
      .split(/\||;|,/)
      .map((s) => normalize(s))
      .filter(Boolean);
  const letterToIndex = (s: string) => {
    const str = String(s ?? '').trim().toLowerCase();
    if (/^[a-z]$/.test(str)) return str.charCodeAt(0) - 'a'.charCodeAt(0); // 0-based
    const n = Number(str);
    if (!Number.isNaN(n)) return n - 1; // 1-based to 0-based
    return -1;
  };

  const rows: any[] = [];
  type RowError = { row: number; reason: string; question?: string };
  const errors: RowError[] = [];
  let parseError: string | undefined;
  const stream = parse({ headers: true })
    .on('error', (err) => {
      parseError = err.message;
    })
    .on('data', (row) => rows.push(row))
    .on('end', async () => {
      try {
        if (parseError) return res.status(400).json({ error: parseError });
        let imported = 0;
        let skipped = 0;
        const ids: number[] = [];
        for (let i = 0; i < rows.length; i++) {
          const rowNum = i + 2; // header is row 1 in CSV
          const row = rows[i];
          // Support multiple header variants
          const qText = lc(getField(row, ['Question', 'question', 'Text', 'Prompt']));
          if (!qText) { skipped++; errors.push({ row: rowNum, reason: 'Missing question text' }); continue; }

          const optionsRaw = getField(row, ['Options', 'options']);
          let optionsList: string[] = [];
          if (optionsRaw !== undefined) {
            optionsList = splitOptions(String(optionsRaw));
          } else {
            // Try Option A/B/C... columns (with and without underscores)
            const letters = ['A','B','C','D','E','F','G','H'];
            optionsList = letters
              .map((L) => getField(row, [
                `Option ${L}`, `option ${L}`,
                `Option_${L}`, `option_${L}`,
                `Option${L}`, `option${L}`
              ]))
              .map((v) => normalize(v))
              .filter(Boolean);
          }
          if (optionsList.length < 2) { skipped++; errors.push({ row: rowNum, reason: 'Less than 2 options', question: qText }); continue; }

          const correctRaw = getField(row, ['Correct Answer', 'correct_answer', 'Answer', 'Correct Option', 'Correct']);
          const correctText = normalize(correctRaw);
          let correctIndex = letterToIndex(correctText);
          if (correctIndex < 0) {
            // Try text match (case-insensitive)
            const ct = correctText.toLowerCase();
            correctIndex = optionsList.findIndex((t) => normalize(t).toLowerCase() === ct);
          }
          if (correctIndex < 0) { skipped++; errors.push({ row: rowNum, reason: 'Cannot determine correct answer', question: qText }); continue; }

          const options = optionsList.map((t, i) => ({ text: t, isCorrect: i === correctIndex }));
          if (!options.some((o) => o.isCorrect)) { skipped++; errors.push({ row: rowNum, reason: 'No correct option found after parsing', question: qText }); continue; }

          const subject = normalize(getField(row, ['Subject', 'subject'])) || undefined;
          const topic = normalize(getField(row, ['Topic', 'topic'])) || 'General';
          const difficulty = normalize(getField(row, ['Difficulty', 'difficulty'])) || 'Medium';
          const rationale = normalize(getField(row, ['Rationale', 'Explanation', 'rationale']));
          const hint = normalize(getField(row, ['Hint', 'hint'])) || undefined;

      const q = await prisma.question.create({
            data: ({
              examId,
              text: qText,
              ...(subject ? { subject } : {}),
              topic,
              difficulty,
        rationale,
              ...(hint ? { hint } : {}),
              options: { createMany: { data: options } }
            } as any)
          });
          ids.push(q.id);
          imported++;
        }
    return res.json({ imported, skipped, ids, errors });
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    });

  // Ensure proper text input to parser
  stream.write(req.file.buffer.toString('utf8'));
  stream.end();
});

router.get('/', requireAuth, requireRole('admin'), async (_req, res) => {
  const questions = await prisma.question.findMany({ include: { options: true }, orderBy: { id: 'desc' } });
  res.json(questions);
});

export default router;
// Excel import (.xlsx)
router.post('/import-excel', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
  const examId = req.body.examId ? Number(req.body.examId) : undefined;
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    let imported = 0;
    let skipped = 0;
    const ids: number[] = [];
    const errors: { row: number; reason: string; question?: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const qText = String(row['Question'] || row['Text'] || '').trim();
      if (!qText) { skipped++; errors.push({ row: rowNum, reason: 'Missing question text' }); continue; }
      const rawOptions = String(row['Options'] || '').trim();
      const optionsList = rawOptions.split(/\||;|,/).map((s: string) => s.trim()).filter(Boolean);
      if (optionsList.length < 2) { skipped++; errors.push({ row: rowNum, reason: 'Less than 2 options', question: qText }); continue; }
      const correctRaw = String(row['Correct Answer'] || row['Answer'] || '').trim();
      let correctIndex = -1;
      if (/^[A-Za-z]$/.test(correctRaw)) correctIndex = correctRaw.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
      if (correctIndex < 0 && /^\d+$/.test(correctRaw)) correctIndex = Number(correctRaw) - 1;
      if (correctIndex < 0) {
        const ct = correctRaw.toLowerCase();
        correctIndex = optionsList.findIndex((t: string) => t.trim().toLowerCase() === ct);
      }
      if (correctIndex < 0) { skipped++; errors.push({ row: rowNum, reason: 'Cannot determine correct answer', question: qText }); continue; }
      const options = optionsList.map((t: string, idx: number) => ({ text: t, isCorrect: idx === correctIndex }));
      if (!options.some((o: any) => o.isCorrect)) { skipped++; errors.push({ row: rowNum, reason: 'No correct option found after parsing', question: qText }); continue; }
      const data: any = {
        examId,
        subject: row['Subject'] ? String(row['Subject']).trim() : undefined,
        text: qText,
        topic: String(row['Topic'] || 'General').trim(),
        difficulty: String(row['Difficulty'] || 'Medium').trim(),
        rationale: String(row['Rationale'] || '').trim(),
        ...(row['Hint'] ? { hint: String(row['Hint']).trim() } : {}),
        options: { createMany: { data: options } }
      };
      const q = await prisma.question.create({ data });
      ids.push(q.id);
      imported += 1;
    }
    res.json({ imported, skipped, ids, errors });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
