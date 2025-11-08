import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">
        🧠 Central Log Analyzer
      </h1>

      <p className="text-gray-600 max-w-xl mb-8">
        Automatically analyze incidents across Kubernetes, AWS, GitHub and CI/CD
        pipelines. Identify root causes and get guided remediation steps in seconds.
      </p>

      <div className="flex space-x-4">
        <Link
          to="/report"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Run Analysis
        </Link>

        <a
          href="https://github.com/Uday8897"
          target="_blank"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          View GitHub
        </a>
      </div>

      <footer className="text-gray-400 text-sm mt-10">
        Built with ❤️ using FastAPI + React + TailwindCSS
      </footer>
    </div>
  );
}
