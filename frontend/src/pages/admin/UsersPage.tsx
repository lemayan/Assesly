import { useState } from 'react';
import http from '../../lib/http';
import { Button, Card, Input, Label } from '../../components/UI';
import { useToast } from '../../components/Toast';
import AdminTabs from './AdminTabs';

export default function UsersPage() {
  const { push } = useToast();
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');

  return (
    <div>
      <AdminTabs />
      <h1 className="text-2xl font-semibold mb-3">Users</h1>

      <Card>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <Label>Student Name</Label>
            <Input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <Label>Student Email</Label>
            <Input value={sEmail} onChange={(e) => setSEmail(e.target.value)} placeholder="student@example.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={sPassword} onChange={(e) => setSPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={async () => {
            if (!sName.trim() || !sEmail.trim() || !sPassword.trim()) {
              push({ type: 'error', title: 'Missing fields', message: 'Enter name, email, and password.' });
              return;
            }
            try {
              await http.post('/auth/register', { name: sName.trim(), email: sEmail.trim(), password: sPassword, role: 'student' });
              push({ type: 'success', title: 'Student created', message: sEmail.trim() });
              setSName(''); setSEmail(''); setSPassword('');
            } catch (e: any) {
              const msg = e?.response?.data?.error || e?.message || 'Create failed';
              push({ type: 'error', title: 'Create failed', message: typeof msg === 'string' ? msg : 'Please try a different email.' });
            }
          }}>Create Student</Button>
        </div>
      </Card>
    </div>
  );
}
