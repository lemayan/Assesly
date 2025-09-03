import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import http from '../lib/http';
import { Button, Card } from '../components/UI';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { useToast } from '../components/Toast';
// Use dynamic import to avoid transient module resolution hiccups in some setups
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let ResultReportModal: any;
import ConfettiBurst from '../components/ConfettiBurst';
const LazyResultReportModal = lazy(() => import('../components/ResultReportModal'));
import { useLocation } from 'react-router-dom';

export default function ResultsPage() {
  const loc = useLocation() as any;
  const [results, setResults] = useState<any[]>([]);
  const { push } = useToast();
  const [reportId, setReportId] = useState<number | null>(null);
  const [overview, setOverview] = useState<{ totalAttempts: number; averagePercentage: number; topics: { topic: string; percentage: number }[] } | null>(null);
  const last = (loc?.state as any)?.last as { id: number; percentage: number } | undefined;
  const celebrate = !!last && last.percentage >= 80;

  useEffect(() => {
    http.get('/results/mine').then((r) => setResults(r.data));
    http.get('/results/analytics/overview').then((r) => setOverview(r.data)).catch(() => {});
  }, []);

  const summary = useMemo(() => {
    if (!results.length) return { avg: 0, best: 0 };
    const avg = Math.round((results.reduce((s, r) => s + r.percentage, 0) / results.length) * 100) / 100;
    const best = Math.max(...results.map((r) => r.percentage));
    return { avg, best };
  }, [results]);

  const donutData = (r: any) => {
    const totalQ = r.exam?._count?.questions ?? r.totalQuestions ?? 0;
    const correct = r.score;
    const incorrect = Math.max(totalQ - correct, 0);
    return [
      { name: 'Correct', value: correct },
      { name: 'Incorrect', value: incorrect },
    ];
  };

  const COLORS = ['#10b981', '#ef4444'];

  // Build data for progress chart
  const progressData = useMemo(() =>
    results
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((r) => ({ date: new Date(r.createdAt).toLocaleDateString(), percentage: r.percentage })),
    [results]
  );

  return (
    <div className="container py-6 space-y-4">
      {/* Completion banner if coming from exam submit */}
      {last && (
        <div className="p-3 rounded border border-gray-200 dark:border-gray-800 bg-green-50/50 dark:bg-emerald-900/20 flex items-center justify-between">
          <div>
            <div className="font-medium">Completed</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Your exam has been submitted. Great work!</div>
          </div>
          {celebrate && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
              <span>🏅</span> <span className="text-sm font-medium">High Score Badge (80%+)</span>
            </div>
          )}
        </div>
      )}
      <ConfettiBurst show={celebrate} onEnd={() => { /* no-op */ }} />
      <h1 className="text-2xl font-semibold">My Results</h1>
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-gray-500">Average</div>
          <div className="text-3xl font-semibold">{summary.avg}%</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Best</div>
          <div className="text-3xl font-semibold">{summary.best}%</div>
        </Card>
      </div>

      {/* Progress over time */}
      {progressData.length > 0 && (
        <Card>
          <div className="font-medium mb-2">Progress over time</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0,100]} />
                <Tooltip />
                <Area type="monotone" dataKey="percentage" stroke="#10b981" fillOpacity={1} fill="url(#pgGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Topic mastery (aggregated) */}
      {overview?.topics?.length ? (
        <Card>
          <div className="font-medium mb-2">Topic mastery</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.topics.sort((a,b)=>b.percentage-a.percentage)} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0,100]} hide />
                <YAxis type="category" dataKey="topic" width={140} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" radius={[3,3,3,3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}
      <div className="space-y-3">
        {results.map((r) => (
          <Card key={r.id}>
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.exam.title}</div>
                  <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold">{r.percentage}%</div>
                  <div className="text-sm">Score: {r.score}</div>
                </div>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData(r)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={35}
                      outerRadius={55}
                    >
                      {donutData(r).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-1 text-sm">
                  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: COLORS[0] }} /> Correct</div>
                  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: COLORS[1] }} /> Incorrect</div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => setReportId(r.id)}>Report</Button>
            </div>
          </Card>
        ))}
      </div>

      {reportId != null && (
        <Suspense fallback={<div className="p-4">Loading…</div>}>
          <LazyResultReportModal resultId={reportId} onClose={() => setReportId(null)} />
        </Suspense>
      )}
    </div>
  );
}
