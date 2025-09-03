import { useEffect, useState } from 'react';
import http from '../../lib/http';
import { Card, Button, Skeleton } from '../../components/UI';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [topics, setTopics] = useState<{ topic: string; percentage: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [e, t, mine] = await Promise.all([
          http.get('/exams'),
          http.get('/results/analytics/overview'),
          http.get('/results/mine'),
        ]);
        setExams(e.data);
        setTopics(t.data.topics);
        setRecent(mine.data.slice(0, 5));
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
  <Card>
          <div className="font-medium mb-2">Performance by Topic</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={topics} margin={{ top: 10, right: 10, bottom: 24, left: 0 }}>
                <defs>
                  <linearGradient id="topicGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="topic" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval="preserveStartEnd" minTickGap={10} tick={{ fontSize: 12 }} height={40} angle={-15} dx={-6} dy={10} />
                <YAxis domain={[0,100]} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Area type="monotone" dataKey="percentage" stroke="#10b981" fillOpacity={1} fill="url(#topicGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
  <Card>
          <div className="font-medium mb-2">Upcoming Exams</div>
          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </>
            ) : exams.length === 0 ? (
              <div className="text-sm text-gray-500">No exams available yet.</div>
            ) : (
              exams.map((e) => (
                <div key={e.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-sm text-gray-500">{e.mode} • {e.duration} min • Qs: {e._count?.questions ?? '—'}</div>
                  </div>
                  <Button onClick={() => nav(`/exam/${e.id}`)}>Start</Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent attempts with completion and badge */}
      <Card>
        <div className="font-medium mb-2">Recent Attempts</div>
        {recent.length === 0 ? (
          <div className="text-sm text-gray-500">No attempts yet.</div>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.exam?.title}</div>
                  <div className="text-sm text-gray-500">Completed • {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.percentage >= 80 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs border border-yellow-200 dark:border-yellow-800">🏅 80%+</span>
                  )}
                  <span className="text-sm font-medium">{r.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
