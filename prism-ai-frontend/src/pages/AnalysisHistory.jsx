// src/pages/AnalysisHistory.jsx
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getAnalysisHistory } from "../services/api";
// import LoadingSpinner from "../components/Common/LoadingSpinner";
// import LoadingSpinner from "../components/common/LoadingSpinner";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import EmptyState from "../components/Common/EmptyState";
// import EmptyState from "../components/common/EmptyState";
import HistoryCard from "../components/History/HistoryCard";

const AnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getAnalysisHistory(50);
      setAnalyses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesSearch =
      analysis.query?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.services_analyzed?.some((service) =>
        service.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" ||
      analysis.analysis?.overall_status?.toLowerCase() === statusFilter;

    const analysisDate = new Date(analysis.timestamp);
    const now = new Date();
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" &&
        analysisDate.toDateString() === now.toDateString()) ||
      (dateFilter === "week" && now - analysisDate < 7 * 24 * 60 * 60 * 1000) ||
      (dateFilter === "month" && now - analysisDate < 30 * 24 * 60 * 60 * 1000);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "HEALTHY":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "DEGRADED":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: analyses.length,
      healthy: 0,
      degraded: 0,
      critical: 0,
    };
    analyses.forEach((analysis) => {
      const status = analysis.analysis?.overall_status?.toLowerCase();
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={XCircle}
          title="Failed to load history"
          description={error}
          action={{
            label: "Try Again",
            onClick: loadHistory,
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
          <p className="text-gray-600">
            {analyses.length} total analyses • {filteredAnalyses.length}{" "}
            filtered
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className={`bg-white p-4 rounded-xl border-2 cursor-pointer transition-all ${
            statusFilter === "all"
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200"
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Analyses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts.all}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div
          className={`bg-white p-4 rounded-xl border-2 cursor-pointer transition-all ${
            statusFilter === "healthy"
              ? "border-green-500 bg-green-50"
              : "border-gray-200"
          }`}
          onClick={() => setStatusFilter("healthy")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Healthy</p>
              <p className="text-2xl font-bold text-green-600">
                {statusCounts.healthy}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div
          className={`bg-white p-4 rounded-xl border-2 cursor-pointer transition-all ${
            statusFilter === "degraded"
              ? "border-yellow-500 bg-yellow-50"
              : "border-gray-200"
          }`}
          onClick={() => setStatusFilter("degraded")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Degraded</p>
              <p className="text-2xl font-bold text-yellow-600">
                {statusCounts.degraded}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div
          className={`bg-white p-4 rounded-xl border-2 cursor-pointer transition-all ${
            statusFilter === "critical"
              ? "border-red-500 bg-red-50"
              : "border-gray-200"
          }`}
          onClick={() => setStatusFilter("critical")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {statusCounts.critical}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search analyses by query or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex space-x-2">
            <Filter className="h-5 w-5 text-gray-400 mt-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="healthy">Healthy</option>
              <option value="degraded">Degraded</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex space-x-2">
            <Calendar className="h-5 w-5 text-gray-400 mt-2" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis List */}
      <div className="space-y-4">
        {filteredAnalyses.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No analyses found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={{
              label: "Clear Filters",
              onClick: () => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
              },
            }}
          />
        ) : (
          filteredAnalyses.map((analysis) => (
            <HistoryCard key={analysis._id} analysis={analysis} />
          ))
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;
