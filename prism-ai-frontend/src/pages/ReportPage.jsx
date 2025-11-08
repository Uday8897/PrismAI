import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ReportPage() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:7000/run-agent?owner=${owner}&repo=${repo}`,
        { method: "POST" }
      );
      const data = await res.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Incident Analyzer Dashboard</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 flex-1"
          type="text"
          placeholder="GitHub Owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        />
        <input
          className="border p-2 flex-1"
          type="text"
          placeholder="Repository Name"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2"
          onClick={runAnalysis}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>

      <div className="border p-4 rounded bg-gray-50">
        {summary ? (
          <ReactMarkdown>{summary}</ReactMarkdown>
        ) : (
          <p className="text-gray-500">No report yet. Run the analysis.</p>
        )}
      </div>
    </div>
  );
}
