import { useEffect, useMemo, useRef, useState } from 'react';
import http from '../lib/http';
import { X } from 'lucide-react';

type Props = { resultId: number; onClose: () => void };

export default function ResultReportModal({ resultId, onClose }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    http.get(`/results/${resultId}/detail`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [resultId]);

  const summary = useMemo(() => {
    if (!data) return null;
    const total = data.answers?.length || 0;
    const correct = data.answers?.filter((a: any) => a.isCorrect).length || 0;
    const pct = total ? Math.round((correct / total) * 10000) / 100 : 0;
    return { total, correct, incorrect: Math.max(total - correct, 0), pct };
  }, [data]);

  const hasIncorrect = useMemo(() => !!data?.answers?.some?.((a: any) => !a.isCorrect), [data]);

  const jumpFirstIncorrect = () => {
    if (!data?.answers) return;
    const idx = data.answers.findIndex((a: any) => !a.isCorrect);
    if (idx < 0) return;
    const el = bodyRef.current?.querySelector(`#ans-${idx}`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="font-semibold">Report</div>
          <div className="flex items-center gap-2">
            <button
              onClick={jumpFirstIncorrect}
              disabled={!hasIncorrect}
              className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title={hasIncorrect ? 'Jump to first incorrect answer' : 'All answers correct'}
            >
              Jump to first incorrect
            </button>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div ref={bodyRef} className="p-4 overflow-y-auto space-y-4 min-h-0">
          {loading && <div>Loading…</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && data && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Exam</div>
                  <div className="text-lg font-semibold">{data.exam?.title}</div>
                </div>
                <div className="flex gap-3">
                  <Stat label="Score" value={`${summary?.correct}/${summary?.total}`} />
                  <Stat label="Percentage" value={`${summary?.pct}%`} highlight={summary && summary.pct >= 70 ? 'good' : 'bad'} />
                </div>
              </div>

              {/* Topic breakdown */}
              <TopicBreakdown answers={data.answers || []} />

              {/* Answers list */}
              <div>
                <div className="font-medium mb-2">Answers</div>
                <div className="space-y-3">
                  {data.answers.map((a: any, idx: number) => (
                    <div key={a.id || idx} id={`ans-${idx}`} className="p-3 rounded border border-gray-200 dark:border-gray-800 scroll-mt-20">
                      <div className="font-medium mb-1">{idx + 1}. {a.question?.text}</div>
                      <div className="text-sm"><span className="text-gray-500">Your answer:</span> <span className={a.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{a.selectedOption?.text || '-'}</span></div>
                      <div className="text-sm"><span className="text-gray-500">Correct:</span> <span className="text-emerald-600 dark:text-emerald-400">{(a.question?.options || []).find((o: any) => o.isCorrect)?.text || '-'}</span></div>
                      {a.question?.rationale && <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{a.question.rationale}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: 'good'|'bad' }) {
  const color = highlight === 'good' ? 'text-emerald-600 dark:text-emerald-400' : highlight === 'bad' ? 'text-red-600 dark:text-red-400' : '';
  return (
    <div className="px-3 py-2 rounded border border-gray-200 dark:border-gray-800">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function TopicBreakdown({ answers }: { answers: any[] }) {
  const items = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const a of answers) {
      const key = a.question?.topic || 'General';
      const stat = map.get(key) || { correct: 0, total: 0 };
      stat.total += 1; if (a.isCorrect) stat.correct += 1; map.set(key, stat);
    }
    return Array.from(map.entries()).map(([topic, s]) => ({ topic, pct: s.total ? Math.round((s.correct / s.total) * 100) : 0, total: s.total, correct: s.correct }))
      .sort((a, b) => b.pct - a.pct);
  }, [answers]);

  if (!items.length) return null;
  return (
    <div>
      <div className="font-medium mb-2">Topic breakdown</div>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((t) => (
          <div key={t.topic} className="p-3 rounded border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.topic}</div>
              <div className="text-sm text-gray-500">{t.correct}/{t.total}</div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-800 rounded">
              <div className="h-2 bg-blue-500 rounded" style={{ width: `${t.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
