import { useEffect, useState } from 'react';
import http from '../../lib/http';
import { Button, Card, Input, Label, Select } from '../../components/UI';
import AdminTabs from './AdminTabs';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [title, setTitle] = useState('New Exam');
  const [duration, setDuration] = useState(30);
  const [mode, setMode] = useState<'practice' | 'exam'>('exam');
  const [busy, setBusy] = useState(false);

  const load = () => http.get('/exams').then((r) => setExams(r.data));
  useEffect(() => { load(); }, []);

  const createExam = async () => {
    setBusy(true);
    await http.post('/exams', { title, duration, mode });
    setTitle('New Exam'); setDuration(30); setMode('exam');
    await load();
    setBusy(false);
  };

  return (
    <div>
      <AdminTabs />
      <h1 className="text-2xl font-semibold mb-3">Exams</h1>

      <Card>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Duration (min)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div>
            <Label>Mode</Label>
            <Select value={mode} onChange={(e) => setMode(e.target.value as any)}>
              <option value="exam">Exam</option>
              <option value="practice">Practice</option>
            </Select>
          </div>
          <Button onClick={createExam} disabled={busy}>Create Exam</Button>
        </div>
      </Card>

      <div className="grid gap-3 mt-4">
        {exams.map((e) => (
          <Card key={e.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-gray-500">{e.mode} • {e.duration} min</div>
              </div>
              <Button onClick={async () => { await http.delete(`/exams/${e.id}`); await load(); }}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
