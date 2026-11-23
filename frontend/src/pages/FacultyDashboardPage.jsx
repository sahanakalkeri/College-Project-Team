import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  Award,
  Users,
  CheckCircle,
  Star,
  MessageSquare,
  AlertCircle,
  Clock,
  Filter,
  CheckCircle2,
  FileText,
  RotateCcw
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const [teams, setTeams] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Review & Feedback Modal State (FR8)
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackStatusDecision, setFeedbackStatusDecision] = useState('Approved');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/faculty/teams');
      if (res.success) {
        setTeams(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openReviewModal = async (team) => {
    setSelectedTeam(team);
    setFeedbackComments('');
    setFeedbackRating(5);
    setFeedbackStatusDecision(team.projectStatus === 'Needs Changes' ? 'Needs Changes' : 'Approved');
    setModalLoading(true);

    try {
      if (team.projectId) {
        const res = await apiRequest(`/faculty/project/${team.projectId}`);
        if (res.success) {
          setProjectDetails(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!projectDetails) return;
    setSubmittingFeedback(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest(`/faculty/project/${projectDetails.projectId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          comments: feedbackComments,
          rating: parseInt(feedbackRating),
          statusUpdate: feedbackStatusDecision
        })
      });

      if (res.success) {
        setSuccess(`Feedback submitted and project status updated to "${feedbackStatusDecision}"!`);
        setSelectedTeam(null);
        setProjectDetails(null);
        fetchTeams();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredTeams = filterStatus === 'all'
    ? teams
    : teams.filter(t => (t.projectStatus === filterStatus) || (filterStatus === 'Submitted' && t.projectStatus === 'Submitted for Review'));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Faculty Evaluation Console
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            Supervised Project Teams
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review submitted sprint milestones, track student task progress, and submit 1–5 star ratings
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses ({teams.length})</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted (Needs Review)</option>
            <option value="Needs Changes">Needs Changes</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
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

      {/* Teams Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading assigned student teams...</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 border border-slate-200 dark:border-slate-700/80 text-center shadow-sm">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
            No Teams Matching Criteria
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Try switching the filter dropdown to view all teams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((t) => {
            const completion = t.taskCount > 0 ? Math.round((t.completedTaskCount / t.taskCount) * 100) : 0;
            const needsReview = t.projectStatus === 'Submitted' || t.projectStatus === 'Submitted for Review';

            return (
              <div
                key={t.teamId}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition-all ${
                  needsReview
                    ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {t.teamName}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Leader: {t.leaderName} ({t.leaderEmail})
                      </p>
                    </div>
                    <StatusBadge status={t.projectStatus || 'Proposing'} />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 mb-4">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Project Topic
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                      {t.projectTopic || t.projectTitle || 'Topic Pending'}
                    </p>
                  </div>

                  {/* Task Progress Bar (FR8) */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>Task Completion</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {completion}% ({t.completedTaskCount} / {t.taskCount} tasks)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {t.memberCount} Members
                  </span>

                  <button
                    onClick={() => openReviewModal(t)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-500/20 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Review & Grade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Faculty Review & Feedback Modal (FR8) */}
      <Modal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title={`Review Team: ${selectedTeam?.teamName}`}
        maxWidth="max-w-2xl"
      >
        {modalLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Fetching project deliverables...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            {/* Project Overview Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Project Title
                </span>
                {projectDetails && <StatusBadge status={projectDetails.status} />}
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {projectDetails?.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {projectDetails?.description}
              </p>

              {/* Members preview */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400">Team Members:</span>
                {projectDetails?.members?.map(m => (
                  <span key={m.studentId} className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {m.name} {m.isLeader ? '(Leader)' : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* Task Deliverables Breakdown */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Sprint Tasks ({projectDetails?.tasks?.length || 0})
              </span>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {projectDetails?.tasks?.map(task => (
                  <div key={task.taskId} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{task.title}</span>
                      <span className="text-[10px] text-slate-400 block">Assigned to: {task.assignedToName || 'Unassigned'}</span>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* 1-5 Star Interactive Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Faculty Evaluation Rating (1–5 Stars) *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= feedbackRating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-bold text-amber-600 ml-2">
                  {feedbackRating}.0 / 5.0 Stars
                </span>
              </div>
            </div>

            {/* Evaluation Decision */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Review Decision Status *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  feedbackStatusDecision === 'Approved'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="statusDecision"
                    value="Approved"
                    checked={feedbackStatusDecision === 'Approved'}
                    onChange={(e) => setFeedbackStatusDecision(e.target.value)}
                    className="hidden"
                  />
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Approve Milestone</span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  feedbackStatusDecision === 'Needs Changes'
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="statusDecision"
                    value="Needs Changes"
                    checked={feedbackStatusDecision === 'Needs Changes'}
                    onChange={(e) => setFeedbackStatusDecision(e.target.value)}
                    className="hidden"
                  />
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold">Request Task Revisions</span>
                </label>
              </div>
            </div>

            {/* Feedback Comments Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Feedback & Guidance Comments *
              </label>
              <textarea
                rows={3}
                required
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Detail recommendations, architecture feedback, or necessary task adjustments..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingFeedback || !feedbackComments.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 disabled:opacity-50 transition-colors"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Evaluation & Rating'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
