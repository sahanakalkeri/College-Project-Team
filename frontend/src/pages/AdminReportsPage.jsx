import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import Modal from '../components/Modal';
import {
  FileText,
  Download,
  PlusCircle,
  BarChart3,
  Users,
  CheckSquare,
  Award,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/reports');
      if (res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load report history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (reportType = 'Comprehensive College Project Audit') => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/admin/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ reportType })
      });

      if (res.success) {
        setSuccess('New audit report generated and archived!');
        fetchReports();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCsv = async (type) => {
    try {
      const blob = await apiRequest(`/admin/export/csv?type=${type}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `college_project_${type}_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Academic Accreditation & Oversight
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            Reports & Analytics Generator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate system-wide audit reports per UML specifications and export data in standard CSV format
          </p>
        </div>

        <button
          onClick={() => handleGenerateReport('Mid-Term Capstone Milestone Audit')}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" />
          {generating ? 'Compiling Metrics...' : 'Generate New Audit Report'}
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* CSV Export Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Teams & Projects CSV</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Rosters, leaders, topics, status</p>
          </div>
          <button
            onClick={() => handleDownloadCsv('teams')}
            className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            title="Download Teams CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">User Registrations CSV</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Students, faculty, departments</p>
          </div>
          <button
            onClick={() => handleDownloadCsv('users')}
            className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            title="Download Users CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Task Velocity & Sprint CSV</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Due dates, assignees, completion</p>
          </div>
          <button
            onClick={() => handleDownloadCsv('tasks')}
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            title="Download Tasks CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generated Reports History */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          Audit Report Log ({reports.length})
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No reports generated yet. Click above to generate.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.reportId}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {report.reportType}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      ID #{report.reportId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Generated on {new Date(report.generatedOn).toLocaleDateString()} at {new Date(report.generatedOn).toLocaleTimeString()} by Admin
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" /> View Summary
                  </button>
                  <button
                    onClick={() => handleDownloadCsv('teams')}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Export Related CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.reportType || 'Report Overview'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Generated: {selectedReport && new Date(selectedReport.generatedOn).toLocaleString()}
          </div>

          {/* Quick Metrics from Summary Data */}
          {selectedReport?.summaryData?.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Total Users</span>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {selectedReport.summaryData.metrics.totalUsers}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Students</span>
                <div className="text-lg font-bold text-blue-600">
                  {selectedReport.summaryData.metrics.totalStudents}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Teams</span>
                <div className="text-lg font-bold text-indigo-600">
                  {selectedReport.summaryData.metrics.totalTeams}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Projects</span>
                <div className="text-lg font-bold text-emerald-600">
                  {selectedReport.summaryData.metrics.totalProjects}
                </div>
              </div>
            </div>
          )}

          {/* Raw JSON or Formatted Data */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono max-h-72 overflow-y-auto">
            <pre>{JSON.stringify(selectedReport?.summaryData, null, 2)}</pre>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedReport(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
