import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import http from '../lib/http';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/UI';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [count, setCount] = useState<number>(50);
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'));
  const nav = useNavigate();

  useEffect(() => {
    http.get('/exams').then((r) => setExams(r.data));
  }, []);

  return (
    <div className="container py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
        <div className="space-x-2 flex items-center">
          <select className="border rounded px-2 py-1" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[20,30,50,70,100,120,150,200].map((n) => <option key={n} value={n}>{n} Qs</option>)}
          </select>
          <Button onClick={() => { document.documentElement.classList.toggle('dark'); setDark((d) => !d); }}>{dark ? 'Light' : 'Dark'} Mode</Button>
          <Link to="/results"><Button>Review Results</Button></Link>
          <Link to="/analytics"><Button>Performance Analytics</Button></Link>
          {user?.role === 'admin' && <Link to="/admin"><Button>Admin</Button></Link>}
          <Button onClick={logout}>Logout</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {exams.map((e) => (
          <Card key={e.id}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{e.title}</h3>
                <p className="text-sm text-gray-500">Duration: {e.duration} min • Mode: {e.mode} • Qs: {e._count?.questions ?? '—'}</p>
              </div>
              <Button onClick={() => nav(`/exam/${e.id}?limit=${count}`)}>Take Exam</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
