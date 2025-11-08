import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const HistoryCard = ({ analysis }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (String(status).toUpperCase()) {
      case "HEALTHY": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "DEGRADED": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "CRITICAL": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div
      className="border border-gray-200 bg-white rounded-xl p-4 hover:shadow cursor-pointer transition"
      onClick={() => navigate(`/analysis/${analysis.id}`)} // ✅ OPEN BY ID
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon(analysis.overall_status)}
          <p className="font-semibold text-gray-800">{analysis.overall_status}</p>
        </div>
        <p className="text-sm text-gray-500">{new Date(analysis.timestamp).toLocaleString()}</p>
      </div>

      <p className="mt-2 text-gray-700 line-clamp-1">{analysis.query}</p>
    </div>
  );
};

export default HistoryCard;
