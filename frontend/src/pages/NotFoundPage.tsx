import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container py-10 text-center">
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">The page you’re looking for doesn’t exist.</p>
      <Link to="/">
        <span className="inline-block px-4 py-2 rounded bg-blue-600 text-white">Back to Dashboard</span>
      </Link>
    </div>
  );
}
