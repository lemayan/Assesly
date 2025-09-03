import { useEffect, useState } from 'react';
import http from '../../lib/http';
import { Card, Button } from '../../components/UI';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ exams: number; questions: number; attempts: number; avg: number; pass: number }>({ exams: 0, questions: 0, attempts: 0, avg: 0, pass: 0 });
  const [series, setSeries] = useState<{ date: string; attempts: number }[]>([]);
  const [topExams, setTopExams] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      http.get('/exams'),
      http.get('/questions'),
      http.get('/results/analytics/overview'),
      http.get('/results/analytics/admin/series'),
      http.get('/results/analytics/admin/top-exams'),
      http.get('/results/analytics/admin/recent'),
    ]).then(([ex, qs, an, sr, top, rc]) => {
      setStats({ exams: ex.data.length, questions: qs.data.length, attempts: an.data.totalAttempts, avg: an.data.averagePercentage || 0, pass: an.data.passRate || 0 });
      setSeries(sr.data);
      setTopExams(top.data);
      setRecent(rc.data);
    });
  }, []);

  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Stat title="Exams" value={stats.exams} />
      <Stat title="Questions" value={stats.questions} />
      <Stat title="Attempts" value={stats.attempts} />
      <Stat title="Pass Rate" value={`${Math.round(stats.pass)}%`} />
  <Stat title="Average %" value={`${Math.round(stats.avg)}%`} />
      <Card className="md:col-span-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Quick Actions</div>
            <div className="text-sm text-gray-500">Create an exam or import questions</div>
          </div>
          <div className="space-x-2">
            <a href="/admin"><Button>Manage Exams</Button></a>
            <a href="/analytics"><Button>View Analytics</Button></a>
          </div>
        </div>
      </Card>
      {/* Attempts trend */}
      <Card className="md:col-span-3">
        <div className="font-medium mb-2">Attempts (last 14 days)</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="attempts" stroke="#3b82f6" fillOpacity={1} fill="url(#admGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      {/* Top exams */}
      <Card>
        <div className="font-medium mb-2">Top Exams</div>
        <div className="space-y-2">
          {topExams.length === 0 ? <div className="text-sm text-gray-500">No data</div> : topExams.map((x, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="truncate mr-2">{x.exam?.title || `Exam #${x.exam?.id}`}</div>
              <div className="text-sm">{x.attempts}</div>
            </div>
          ))}
        </div>
      </Card>
      {/* Recent activity */}
      <Card className="md:col-span-4">
        <div className="font-medium mb-2">Recent Attempts</div>
        <div className="grid md:grid-cols-2 gap-2">
          {recent.length === 0 ? <div className="text-sm text-gray-500">No recent attempts</div> : recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2 last:border-0">
              <div>
                <div className="font-medium truncate max-w-[320px]">{r.user?.email} • {r.exam?.title}</div>
                <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm font-medium">{Math.round(r.percentage)}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <Card>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </Card>
  );
}
