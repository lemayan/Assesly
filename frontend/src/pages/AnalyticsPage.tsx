import { useEffect, useState } from 'react';
import http from '../lib/http';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<{ topic: string; percentage: number }[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [userAnalytics, setUserAnalytics] = useState<{ attempts: any[]; topics: any[]; summary: any } | null>(null);

  useEffect(() => {
    http.get('/results/analytics/overview').then((r) => setOverview(r.data.topics));
    if (user?.role === 'admin') {
      http.get('/results/analytics/students').then((r) => setStudents(r.data));
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' && selectedUserId) {
      http.get(`/results/analytics/user/${selectedUserId}`).then((r) => setUserAnalytics(r.data));
    } else {
      setUserAnalytics(null);
    }
  }, [user, selectedUserId]);

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Performance Analytics</h1>

      {/* Everyone: Topic overview (yours if student, global if admin) */}
      <div>
        <div className="font-medium mb-2">Topic performance</div>
  <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={overview} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
              <defs>
                <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="topic" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval="preserveStartEnd" minTickGap={12} tick={{ fontSize: 12, fill: '#374151' }} height={42} angle={-15} dx={-6} dy={12} />
              <YAxis domain={[0,100]} tick={{ fill: '#374151' }} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Area type="monotone" dataKey="percentage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPct)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admin-only: per-student analytics */}
      {user?.role === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <div className="font-medium">Student analytics</div>
              <select className="border rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100" value={selectedUserId as any} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— Select a student —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.email} ({s._count?.results || 0})</option>
                ))}
              </select>
            </div>
            {userAnalytics && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Attempts: {userAnalytics.summary.attempts} • Avg: {userAnalytics.summary.averagePercentage}% • Best: {userAnalytics.summary.best}% • Worst: {userAnalytics.summary.worst}%
              </div>
            )}
          </div>

          {userAnalytics && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Attempts over time */}
              <div className="h-72">
                <div className="font-medium mb-2">Scores over time</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userAnalytics.attempts.map((a) => ({ ...a, date: new Date(a.date).toLocaleDateString() }))} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} minTickGap={16} tick={{ fill: '#374151' }} />
                    <YAxis domain={[0,100]} tick={{ fill: '#374151' }} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Line type="monotone" dataKey="percentage" stroke="#10b981" name="Score %" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Topic comparison */}
              <div className="h-72">
                <div className="font-medium mb-2">Topic comparison</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userAnalytics.topics} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="topic" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval="preserveStartEnd" minTickGap={12} tick={{ fontSize: 12, fill: '#374151' }} height={42} angle={-15} dx={-6} dy={12} />
                    <YAxis domain={[0,100]} tick={{ fill: '#374151' }} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="percentage" fill="#6366f1" name="Accuracy %" radius={[4,4,0,0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
