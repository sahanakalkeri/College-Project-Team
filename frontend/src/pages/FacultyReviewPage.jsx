import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Award,
  Send,
  Star,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Bell,
  Database,
  User
} from 'lucide-react';

export default function FacultyReviewPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const teamRes = await apiRequest('/teams/my-team');
      if (teamRes.success && teamRes.data) {
        setTeam(teamRes.data);
        if (teamRes.data.project) {
          const projRes = await apiRequest(`/projects/${teamRes.data.project.projectId}`);
          if (projRes.success) {
            setProjectDetails(projRes.data);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load review data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitForReview = async () => {
    if (!projectDetails) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/projects/submit-review', {
        method: 'POST',
        body: JSON.stringify({ projectId: projectDetails.projectId })
      });

      if (res.success) {
        setSuccess('Project submitted to faculty mentor for milestone review!');
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Loading faculty review status...</p>
      </div>
    );
  }

  if (!team || !projectDetails) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-slate-200 dark:border-slate-700/80 text-center max-w-xl mx-auto my-8 shadow-sm">
        <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          No Active Project Milestone
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Form a team and pick a confirmed topic before submitting for faculty review.
        </p>
        <Link
          to="/teams/search"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
        >
          Form Team &rarr;
        </Link>
      </div>
    );
  }

  const isLeader = team.isCurrentUserLeader;
  const isNeedsChanges = projectDetails.status === 'Needs Changes';
  const isApproved = projectDetails.status === 'Approved' || projectDetails.status === 'Completed';
  const isUnderReview = projectDetails.status === 'Submitted' || projectDetails.status === 'Submitted for Review';

  return (
    <div className="space-y-6">
      {/* Review Status Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {team.teamName} • Capstone Evaluation
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Faculty Review & Milestone Signoff
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Supervising Faculty: <span className="font-semibold text-slate-700 dark:text-slate-300">{projectDetails.facultyName || 'Dr. Robert Vance'}</span> ({projectDetails.facultyDesignation || 'Professor'})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={projectDetails.status} />

            {/* Submit / Resubmit Button for Leader */}
            {isLeader && !isUnderReview && (
              <button
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  'Submitting...'
                ) : isNeedsChanges ? (
                  <>
                    <RotateCcw className="w-4 h-4" /> Resubmit for Review
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit for Faculty Review
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Needs Changes Alert & Loop Indicator (Activity Diagram Flow) */}
        {isNeedsChanges && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-amber-800 dark:text-amber-300">
                Action Required: Project Needs Revisions (Loop in Flow)
              </h4>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                Faculty has evaluated your submission and requested adjustments. Please review the feedback below, go to <strong>Update Tasks</strong> (modify/reassign deliverables), and click "Resubmit for Review".
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Link
                  to="/tasks"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Go to Update Tasks (Modify / Reassign) &rarr;
                </Link>
                {isLeader && (
                  <button
                    onClick={handleSubmitForReview}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Resubmit Project Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approved Success Banner with Three Parallel Post-Approval Actions */}
        {isApproved && (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="text-xs">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300">
                  Project Milestone Approved!
                </h4>
                <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Faculty guide has certified this milestone with full academic approval.
                </p>
              </div>
            </div>

            {/* Three Parallel Post-Approval Actions (Activity Diagram: Send Notifications, Store Data, Update Profile) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-2">
                Post-Approval Activities (Activity Diagram Specification)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-1">
                    <Bell className="w-4 h-4 text-emerald-600" /> 1. Send Notifications
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Notified all team members and supervising faculty of approval.
                  </p>
                  <Link to="/notifications" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    View Notifications &rarr;
                  </Link>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-1">
                    <Database className="w-4 h-4 text-emerald-600" /> 2. Store Data
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Project status, rating score, and feedback archived permanently.
                  </p>
                  <span className="inline-block text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                    Stored in Database
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-1">
                    <User className="w-4 h-4 text-emerald-600" /> 3. Update Profile
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Update student academic information, semester, or profile photo.
                  </p>
                  <Link to="/profile" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    Manage Profile &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Under Review Wait Banner */}
        {isUnderReview && (
          <div className="mt-6 p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-600 flex-shrink-0" />
            <div className="text-xs">
              <h4 className="font-bold text-cyan-800 dark:text-cyan-300">
                Awaiting Faculty Evaluation
              </h4>
              <p className="text-cyan-700 dark:text-cyan-400 mt-0.5">
                Project details and completed sprint deliverables have been transmitted to your faculty guide.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-start gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Chronological Feedback Thread */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            Faculty Review Logs & Feedback Thread ({projectDetails.feedback?.length || 0})
          </h3>
          <span className="text-xs text-slate-400">1–5 Star Rating System</span>
        </div>

        <div className="space-y-4">
          {projectDetails.feedback?.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No faculty reviews posted yet. Submit project deliverables to receive evaluation.
            </div>
          ) : (
            projectDetails.feedback.map((fb) => (
              <div
                key={fb.feedbackId}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      {fb.facultyName}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {fb.designation} • {new Date(fb.date).toLocaleDateString()} at {new Date(fb.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* 1-5 Star Visual Rating */}
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-200/80 dark:border-amber-800">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= fb.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 ml-1">
                      {fb.rating}.0
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 mt-3 leading-relaxed bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  "{fb.comments}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
