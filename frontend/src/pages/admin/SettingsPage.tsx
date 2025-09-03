import http from '../../lib/http';
import { Button, Card } from '../../components/UI';
import { useToast } from '../../components/Toast';
import AdminTabs from './AdminTabs';

export default function SettingsPage() {
  const { push } = useToast();
  return (
    <div>
      <AdminTabs />
      <h1 className="text-2xl font-semibold mb-3">Settings</h1>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-red-600">Danger Zone</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Reset the entire system to a brand-new state. This deletes exams, questions, results, and users (except you).</div>
          </div>
          <Button
            onClick={async () => {
              const ok = window.confirm('This will delete ALL data and keep only your admin account. Continue?');
              if (!ok) return;
              try {
                await http.post('/admin/reset');
                push({ type: 'success', title: 'System reset', message: 'All data cleared. Please refresh dashboards.' });
              } catch (e: any) {
                const msg = e?.response?.data?.error || e?.message || 'Reset failed';
                push({ type: 'error', title: 'Reset failed', message: msg });
              }
            }}
          >Reset System</Button>
        </div>
      </Card>
    </div>
  );
}
