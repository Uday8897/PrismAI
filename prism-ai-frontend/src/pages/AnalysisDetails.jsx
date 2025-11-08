import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { getAnalysisById } from '../services/api';
import AnalysisResult from '../components/Analysis/AnalysisResult';

const AnalysisDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await getAnalysisById(id);

        // ✅ Normalize shape so AnalysisResult always works
        setAnalysis({
          ...data,
          analysis: data.analysis || {
            overall_status: data.overall_status,
            services: data.services,
            root_cause_analysis: data.root_cause_analysis,
            immediate_actions: data.immediate_actions,
            long_term_recommendations: data.long_term_recommendations,
            confidence: data.confidence
          }
        });
      } catch (error) {
        console.error("Failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-gray-600">Loading...</div>;

  if (!analysis) return <div className="p-6 text-center text-red-600">Analysis not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate('/history')} className="p-2 hover:bg-gray-100 rounded-lg">
        <ArrowLeft className="h-5 w-5 text-gray-600" />
      </button>

      <AnalysisResult 
        analysis={analysis.analysis} 
        onNewAnalysis={() => navigate('/analyze')}
      />
    </div>
  );
};

export default AnalysisDetails;
