import { useEffect, useMemo, useState } from 'react';
import http from '../../lib/http';
import { Button, Card, Input, Label, Select } from '../../components/UI';
import { useToast } from '../../components/Toast';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import AdminTabs from './AdminTabs';

export default function QuestionsPage() {
  const { push } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qListBusy, setQListBusy] = useState(false);
  const [filterExamId, setFilterExamId] = useState<number | ''>('');
  const [qViewMode, setQViewMode] = useState<'chart' | 'list'>('chart');
  const [qGroupBy, setQGroupBy] = useState<'subject' | 'topic' | 'difficulty' | 'exam'>('subject');
  const [showCreate, setShowCreate] = useState(false);

  const [qExamId, setQExamId] = useState<number | ''>('');
  const [qSubject, setQSubject] = useState<string>('Mathematics');
  const [qText, setQText] = useState('');
  const [qTopic, setQTopic] = useState('General');
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [qRationale, setQRationale] = useState('');
  const [qHint, setQHint] = useState('');
  const [qOptions, setQOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ]);
  const subjects = [
    'Mathematics','Algebra','Geometry','Calculus','Statistics','Physics','Chemistry','Biology','Computer Science','Programming','Data Structures','Algorithms',
    'English','Literature','Grammar','History','Geography','Economics','Business Studies','Accounting','Finance','Marketing','Civics','Psychology','Sociology',
    'Philosophy','Art','Music','Design','Health','Physical Education','Environmental Science','Political Science','Law','Engineering','Medicine','Nursing',
    'Pharmacology','Anatomy','Astronomy','Earth Science','Geology','French','Spanish','German','Arabic','Chinese','Japanese','Portuguese','Statistics & Probability'
  ];
  const [subjectQuery, setSubjectQuery] = useState('');
  const filteredSubjects = subjects.filter((s) => s.toLowerCase().includes(subjectQuery.toLowerCase()));

  const load = () => http.get('/exams').then((r) => setExams(r.data));
  const fetchQuestions = async () => {
    setQListBusy(true);
    try {
      const r = await http.get('/questions');
      setQuestions(r.data || []);
    } finally {
      setQListBusy(false);
    }
  };
  useEffect(() => { load(); fetchQuestions(); }, []);

  const uploadCSV = async () => {
    if (!file) return alert('Please choose a CSV file first.');
    if (!selectedExamId) return alert('Please select an Exam to attach these questions.');
    const fd = new FormData();
    fd.append('file', file);
    if (selectedExamId) fd.append('examId', String(selectedExamId));
    setBusy(true);
    try {
      const resp = await http.post('/questions/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const count = resp?.data?.imported ?? resp?.data?.ids?.length ?? 0;
      const skipped = resp?.data?.skipped ?? 0;
      push({ type: 'success', title: 'Import complete', message: `Imported ${count} questions${skipped ? `, skipped ${skipped}` : ''}.` });
      setImportErrors(Array.isArray(resp?.data?.errors) ? resp.data.errors : []);
      await fetchQuestions();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Import failed';
      push({ type: 'error', title: 'Import failed', message: msg });
    } finally {
      setBusy(false);
    }
  };

  const [importErrors, setImportErrors] = useState<Array<{ row: number; reason: string; question?: string }>>([]);

  const addOption = () => setQOptions((opts) => [...opts, { text: '', isCorrect: false }]);
  const updateOption = (i: number, patch: Partial<{ text: string; isCorrect: boolean }>) =>
    setQOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const setCorrect = (i: number) => setQOptions((opts) => opts.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  const removeOption = (i: number) => setQOptions((opts) => opts.filter((_, idx) => idx !== i));

  const createQuestion = async () => {
    if (!qText.trim() || qOptions.some((o) => !o.text.trim())) return alert('Please fill in question and all options.');
    if (!qOptions.some((o) => o.isCorrect)) return alert('Please mark a correct answer.');
    setBusy(true);
    try {
      await http.post('/questions', {
        examId: qExamId || undefined,
        text: qText,
        subject: qSubject,
        topic: qTopic,
        difficulty: qDifficulty,
        rationale: qRationale,
        hint: qHint || undefined,
        options: qOptions,
      });
      setQText(''); setQRationale(''); setQHint(''); setQOptions([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
      setShowCreate(false);
      alert('Question created');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <AdminTabs />
      <h1 className="text-2xl font-semibold mb-3">Questions</h1>

      <Card>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Attach to Exam (required for import)</Label>
            <Select value={selectedExamId as any} onChange={(e) => setSelectedExamId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— None —</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          </div>
          <div>
            <Label>Questions CSV</Label>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={uploadCSV} disabled={!file || busy}>Upload</Button>
        </div>
        <div className="mt-4">
          <Button onClick={() => setShowCreate(true)}>Create question manually</Button>
        </div>
        {importErrors.length > 0 && (
          <div className="mt-4">
            <div className="font-medium mb-1">Import issues</div>
            <div className="max-h-56 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                    <th className="px-2 py-1">Row</th>
                    <th className="px-2 py-1">Reason</th>
                    <th className="px-2 py-1">Question</th>
                  </tr>
                </thead>
                <tbody>
                  {importErrors.map((er, i) => (
                    <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="px-2 py-1 whitespace-nowrap">{er.row}</td>
                      <td className="px-2 py-1">{er.reason}</td>
                      <td className="px-2 py-1 truncate" title={er.question}>{er.question || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <Card>
          <div className="grid gap-3">
            <div className="font-medium">Create Question</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Exam (optional)</Label>
                <Select value={qExamId as any} onChange={(e) => setQExamId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— None —</option>
                  {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={subjectQuery} onChange={(e) => setSubjectQuery(e.target.value)} placeholder="Search subject…" />
                <Select value={qSubject} onChange={(e) => setQSubject(e.target.value)}>
                  {filteredSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <Label>Topic</Label>
              <Input value={qTopic} onChange={(e) => setQTopic(e.target.value)} />
            </div>
            <div>
              <Label>Question</Label>
              <Input value={qText} onChange={(e) => setQText(e.target.value)} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Difficulty</Label>
                <Input value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)} />
              </div>
              <div>
                <Label>Hint (optional)</Label>
                <Input value={qHint} onChange={(e) => setQHint(e.target.value)} placeholder="e.g., recall the Pythagorean theorem" />
              </div>
            </div>
            <div>
              <Label>Options</Label>
              <div className="grid gap-2">
                {qOptions.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={o.isCorrect} onChange={() => setCorrect(i)} />
                    <Input value={o.text} onChange={(e) => updateOption(i, { text: e.target.value })} placeholder={`Option ${i + 1}`} />
                    <Button onClick={() => removeOption(i)} disabled={qOptions.length <= 2}>Remove</Button>
                  </div>
                ))}
                <div>
                  <Button onClick={addOption}>Add Option</Button>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={createQuestion} disabled={busy}>Create Question</Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Question Overview</div>
          <div className="flex items-center gap-2">
            <Select value={filterExamId as any} onChange={(e) => setFilterExamId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">All exams</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
            <Select value={qGroupBy} onChange={(e) => setQGroupBy(e.target.value as any)}>
              <option value="subject">By Subject</option>
              <option value="topic">By Topic</option>
              <option value="difficulty">By Difficulty</option>
              <option value="exam">By Exam</option>
            </Select>
            <Select value={qViewMode} onChange={(e) => setQViewMode(e.target.value as any)}>
              <option value="chart">Chart</option>
              <option value="list">List</option>
            </Select>
            <Button onClick={fetchQuestions} disabled={qListBusy}>{qListBusy ? 'Loading…' : 'Refresh'}</Button>
          </div>
        </div>

        {(() => {
          const filtered = questions.filter((q) => (filterExamId ? q.examId === filterExamId : true));
          const examTitleById = Object.fromEntries(exams.map((e) => [e.id, e.title]));
          const keyOf = (q: any) => {
            if (qGroupBy === 'subject') return q.subject || 'Unspecified';
            if (qGroupBy === 'topic') return q.topic || 'General';
            if (qGroupBy === 'difficulty') return q.difficulty || 'Medium';
            return examTitleById[q.examId] || '—';
          };
          const counts = new Map<string, number>();
          for (const q of filtered) {
            const k = String(keyOf(q));
            counts.set(k, (counts.get(k) || 0) + 1);
          }
          let data = Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
          const total = filtered.length;
          const colors = [
            '#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f43f5e','#22c55e','#eab308','#3b82f6','#06b6d4','#a855f7',
            '#84cc16','#d946ef','#0ea5e9','#f97316'
          ];

          const TOP_SLICES = 7;
          if (data.length > TOP_SLICES) {
            const top = data.slice(0, TOP_SLICES);
            const otherValue = data.slice(TOP_SLICES).reduce((s, d) => s + d.value, 0);
            data = [...top, { name: 'Other', value: otherValue }];
          }

          if (qViewMode === 'chart') {
            return (
              <div className="grid md:grid-cols-2 gap-4 items-center min-h-[320px]">
                <div className="h-80">
                  {total === 0 ? (
                    <div className="text-sm text-gray-500">No questions yet. Import a CSV or create one manually.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2} labelLine={false}>
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, _n: any, p: any) => [`${v} (${Math.round((v/Math.max(1,total))*100)}%)`, p?.payload?.name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Total questions: {total}</div>
                  <div className="space-y-1 max-h-72 overflow-auto pr-1">
                    {data.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between border rounded px-2 py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: colors[i % colors.length] }} />
                          <span className="truncate" title={d.name}>{d.name}</span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap ml-2">{d.value} ({Math.round((d.value/Math.max(1,total))*100)}%)</div>
                      </div>
                    ))}
                    {data.length === 0 && <div className="text-sm text-gray-500">Nothing to show yet.</div>}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="grid gap-2 max-h-[420px] overflow-auto pr-1">
              {filtered.map((q) => (
                <div key={q.id} className="border rounded p-3">
                  <div className="font-medium">Q{q.id}: {q.text}</div>
                  <div className="text-sm text-gray-600">{q.subject ? `${q.subject} • ` : ''}{q.topic} • {q.difficulty}</div>
                  <div className="text-sm mt-1">Options: {Array.isArray(q.options) ? q.options.map((o: any) => (o.isCorrect ? `✔ ${o.text}` : o.text)).join(' | ') : '-'}</div>
                </div>
              ))}
              {!qListBusy && filtered.length === 0 && (
                <div className="text-sm text-gray-500">No questions yet. Import a CSV or create one manually.</div>
              )}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
