import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import http from '../lib/http';
import { Button, Card } from '../components/UI';
import ErrorBoundary from '../components/ErrorBoundary';

export default function ExamPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [exam, setExam] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [showReview, setShowReview] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Current question index must be declared before any conditional return to obey hooks rules
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const limit = sp.get('limit');
    const qs = limit ? `?limit=${encodeURIComponent(limit)}` : '';
  http.get(`/exams/${id}${qs}`).then((r) => {
      setExam(r.data);
      setTimeLeft(r.data.duration * 60);
      const map: Record<number, null> = {} as any;
      for (const q of r.data.questions) map[q.id] = null;
      setAnswers(map);
    }).catch((e) => {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load exam.';
      setLoadError(msg);
    });
  }, [id, sp]);

  // Fallback timeout if request hangs silently (network issues)
  useEffect(() => {
    if (exam || loadError) return;
    const t = setTimeout(() => {
      if (!exam && !loadError) setLoadError('Taking too long to load the exam. Please go back and try again.');
    }, 12000);
    return () => clearTimeout(t);
  }, [exam, loadError]);

  useEffect(() => {
    if (!timeLeft) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && exam) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Auto-save every 30s
  useEffect(() => {
    if (!exam) return;
    const t = setInterval(async () => {
      setSaving(true);
      try {
        // No-op: could persist draft to backend/localStorage
        localStorage.setItem(`draft-${exam.id}`, JSON.stringify({ answers, flags }));
      } finally { setSaving(false); }
    }, 30000);
    return () => clearInterval(t);
  }, [exam, answers, flags]);

  const questions = Array.isArray((exam as any)?.questions) ? ((exam as any).questions as any[]) : [];
  const total = questions.length;
  const safeIndex = total > 0 ? Math.min(Math.max(0, currentIndex), total - 1) : 0;
  const current = total > 0 ? questions[safeIndex] : null;
  // Build a lookup of optionId -> { isCorrect, text } for fast scoring
  const optionIndex = useMemo(() => {
    const map = new Map<number, { isCorrect: boolean; text: string; qid: number }>();
    for (const q of questions) {
  const opts = Array.isArray((q as any).options) ? q.options : [];
  for (const o of opts) {
        map.set(o.id, { isCorrect: !!o.isCorrect, text: String(o.text), qid: q.id });
      }
    }
    return map;
  }, [questions]);
  const correctCount = useMemo(() => {
    let c = 0;
    for (const [, oid] of Object.entries(answers)) {
      if (oid != null) {
        const rec = optionIndex.get(Number(oid));
        if (rec?.isCorrect) c += 1;
      }
    }
    return c;
  }, [answers, optionIndex]);
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const percent = total ? Math.round((answeredCount / total) * 100) : 0;

  // Keyboard shortcuts: Left/Right navigate, F flag, Enter to confirm on review
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!exam) return;
      // Avoid interfering with inputs
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(((exam?.questions?.length ?? 1) - 1), i + 1));
      } else if ((e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const q = Array.isArray((exam as any)?.questions) ? (exam as any).questions[currentIndex] : null;
        if (q) setFlags((s) => ({ ...s, [q.id]: !s[q.id] }));
      } else if (e.key === 'Enter' && showReview) {
        e.preventDefault();
        // Confirm submit when review panel open
        if (answeredCount < (exam?.questions?.length ?? 0)) {
          const ok = window.confirm(`You have ${(exam?.questions?.length ?? 0) - answeredCount} unanswered questions. Submit anyway?`);
          if (!ok) return;
        }
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exam, currentIndex, answeredCount, showReview]);

  const submit = async () => {
    const payload = {
      examId: exam.id,
      answers: Object.entries(answers).filter(([, v]) => v !== null).map(([qid, oid]) => ({ questionId: Number(qid), selectedOptionId: Number(oid) }))
    };
  const r = await http.post('/results/submit', payload);
    nav('/results', { state: { last: r.data } });
  };

  return (
    <ErrorBoundary>
      {loadError ? (
        <div className="container py-10 space-y-4">
          <div className="text-red-600">{loadError}</div>
          <div className="flex items-center gap-2">
            <Button onClick={() => nav('/')}>Back to Dashboard</Button>
            <Button onClick={() => { setLoadError(null); window.location.reload(); }}>Retry</Button>
          </div>
        </div>
      ) : !exam ? (
        <div className="container py-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
            <div className="text-sm text-gray-600 dark:text-gray-300">Loading exam…</div>
          </div>
        </div>
      ) : (
  <div className="container py-6 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{exam.title}</h1>
          <p className="text-sm text-gray-500">Question {safeIndex + 1}/{total} — {percent}% complete</p>
          <div className="mt-1 text-sm"><span className="inline-block px-2 py-0.5 rounded bg-green-600 text-white">Score so far: {correctCount}/{total}</span></div>
        </div>
        <div className="text-right space-y-2">
          <div className="text-lg font-mono">⏱️ {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
          <div className="text-xs text-gray-500">{saving ? 'Auto-saving…' : 'Auto-saves every 30s'}</div>
          <div>
            <Button onClick={() => nav('/')}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded h-2"><div className="bg-blue-600 h-2 rounded" style={{ width: `${percent}%`}}/></div>

      {total === 0 && (
        <Card>
          <div className="space-y-2">
            <div className="font-medium">No questions available for this exam yet.</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Please try another exam or contact your administrator.</div>
            <div>
              <Button onClick={() => nav('/')}>Back to Dashboard</Button>
            </div>
          </div>
        </Card>
      )}
      {total > 0 && !current && (
        <Card>
          <div className="space-y-2">
            <div className="font-medium">We couldn’t load this question.</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Try navigating to another question or go back.</div>
            <div className="flex gap-2">
              <Button onClick={() => setCurrentIndex(0)}>Go to first</Button>
              <Button onClick={() => nav('/')}>Back to Dashboard</Button>
            </div>
          </div>
        </Card>
      )}

  {total > 0 && current && (
      <Card>
        <div className="space-y-3">
          <div className="font-medium">{current.text}</div>
          <div className="grid gap-2">
            {(Array.isArray((current as any).options) ? current.options : []).map((o: any) => {
              const sel = answers[current.id];
              const selected = sel === o.id;
              const answered = sel !== null && sel !== undefined;
              const correct = !!o.isCorrect;
              const classWhen = answered
                ? selected && correct
                  ? 'border-green-600 ring-2 ring-green-200'
                  : selected && !correct
                  ? 'border-red-600 ring-2 ring-red-200'
                  : correct
                  ? 'border-green-500'
                  : 'border-gray-300 dark:border-gray-700'
                : selected
                ? 'border-blue-600 ring-2 ring-blue-200'
                : 'border-gray-300 dark:border-gray-700';
              return (
                <label key={o.id} className={`border rounded p-3 cursor-pointer ${classWhen}`}>
                  <input
                    className="mr-2"
                    type="radio"
                    name={`q-${current.id}`}
                    checked={selected}
                    onChange={() => setAnswers((s) => ({ ...s, [current.id]: o.id }))}
                  />
                  {o.text}
                </label>
              );
            })}
          </div>
          {/* Per-question feedback after answering */}
          {(() => {
            const sel = answers[current.id];
            if (sel == null) return null;
            const rec = optionIndex.get(Number(sel));
            const correctOpt = (Array.isArray((current as any).options) ? (current.options as any[]) : []).find((x) => !!x.isCorrect);
            const ok = !!rec?.isCorrect;
            return (
              <div className={`text-sm mt-1 ${ok ? 'text-green-600' : 'text-red-600'}`}>
                {ok ? 'Correct!' : (
                  <>Incorrect. Correct answer: <span className="font-medium">{correctOpt?.text}</span></>
                )}
                {current.rationale && (
                  <div className="mt-1 text-gray-700 dark:text-gray-300">Explanation: {current.rationale}</div>
                )}
              </div>
            );
          })()}
          {current.hint && (
            <div className="mt-2">
              <button className="text-sm underline" onClick={() => setShowHint((s) => ({ ...s, [current.id]: !s[current.id] }))}>
                {showHint[current.id] ? 'Hide hint' : 'Show hint'}
              </button>
              {showHint[current.id] && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">💡 {current.hint}</div>
              )}
            </div>
          )}
      <div className="flex items-center justify-between">
            <div className="space-x-2">
        <Button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={safeIndex === 0}>Previous</Button>
        <Button onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))} disabled={safeIndex === total - 1}>Next</Button>
            </div>
            <Button onClick={() => setFlags((s) => ({ ...s, [current.id]: !s[current.id] }))}>{flags[current.id] ? 'Unflag' : 'Flag Question'}</Button>
          </div>
        </div>
  </Card>
  )}

      {/* Question grid navigator */}
  {total > 0 && current && (
  <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Question Navigator</div>
          <div className="text-sm text-gray-500">Answered: {answeredCount}/{total} {answeredCount < total ? `(Missing ${total - answeredCount})` : ''}</div>
        </div>
        <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 lg:grid-cols-16 gap-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
            const isFlagged = !!flags[q.id];
            const base = isCurrent ? 'bg-blue-600 text-white' : isAnswered ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-800';
            return (
              <button
                key={q.id}
                title={isFlagged ? 'Flagged' : isAnswered ? 'Answered' : 'Unanswered'}
                className={`text-sm rounded px-2 py-1 ${base} ${isFlagged ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </Card>
      )}

  {total > 0 && current && (
        <div className="flex justify-end">
          <Button onClick={() => setShowReview(true)}>Review & Submit</Button>
        </div>
      )}

      {/* Review screen modal-like card */}
      {showReview && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Review Answers</div>
              <Button onClick={() => setShowReview(false)}>Close</Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Answered {answeredCount} of {total}. {total - answeredCount > 0 ? `${total - answeredCount} unanswered.` : 'All answered.'}
            </div>
            <div className="grid gap-2 max-h-[320px] overflow-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
                const isFlagged = !!flags[q.id];
                return (
                  <div key={q.id} className="flex items-center justify-between border rounded p-2">
                    <div className="truncate mr-2"><span className="font-medium">Q{idx + 1}.</span> {q.text}</div>
                    <div className="flex items-center gap-2">
                      {isFlagged && <span className="text-yellow-600">⚑</span>}
                      <span className={`text-sm ${isAnswered ? 'text-green-600' : 'text-red-600'}`}>{isAnswered ? 'Answered' : 'Unanswered'}</span>
                      <Button onClick={() => { setCurrentIndex(idx); setShowReview(false); }}>Go</Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              {answeredCount < total && (
                <Button onClick={() => {
                  // Jump to first unanswered
                  const firstMissingIdx = questions.findIndex((q) => answers[q.id] === null || answers[q.id] === undefined);
                  if (firstMissingIdx >= 0) { setCurrentIndex(firstMissingIdx); setShowReview(false); }
                }}>Go to first missing</Button>
              )}
              <Button onClick={async () => {
                if (answeredCount < total) {
                  const ok = window.confirm(`You have ${total - answeredCount} unanswered questions. Submit anyway?`);
                  if (!ok) return;
                }
                await submit();
              }}>Confirm Submit</Button>
            </div>
          </div>
        </Card>
      )}
  </div>
      )}
      {/* Sticky toolbar */}
      {exam && total > 0 && (
        <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-sm font-mono">⏱️ {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
              <div className="w-40 h-2 bg-gray-200 dark:bg-gray-800 rounded">
                <div className="h-2 bg-blue-600 rounded" style={{ width: `${percent}%` }} />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{answeredCount}/{total} answered</div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={safeIndex === 0} title="Previous (←)">Previous</Button>
              <Button onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))} disabled={safeIndex === total - 1} title="Next (→)">Next</Button>
              <Button onClick={() => setFlags((s) => ({ ...s, [questions[safeIndex].id]: !s[questions[safeIndex].id] }))} title="Flag (F)">{flags[questions[safeIndex]?.id] ? 'Unflag' : 'Flag'}</Button>
              <Button onClick={() => setShowReview(true)} title="Review & Submit (Enter on review)">Review</Button>
            </div>
          </div>
        </div>
      )}
  </ErrorBoundary>
  );
}
