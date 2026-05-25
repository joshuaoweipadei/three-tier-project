import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-100 rounded-full">
            <ShieldX className="w-10 h-10 text-red-600" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          You don't have permission to view this page.
        </p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Go back
        </button>
      </div>
    </main>
  );
}