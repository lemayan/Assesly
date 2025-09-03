import { NavLink } from 'react-router-dom';

export default function AdminTabs() {
  const tabs = [
    { to: '/admin/exams', label: 'Exams' },
    { to: '/admin/questions', label: 'Questions' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/settings', label: 'Settings' },
  ];
  return (
    <div className="mb-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-3 py-2 text-sm rounded-t ${isActive ? 'bg-gray-100 dark:bg-gray-800 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
