import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Send,
  BookOpen,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export default function ProjectTopicPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [standardTopics, setStandardTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Custom Topic Form
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [mode, setMode] = useState('curated'); // 'curated' | 'custom'

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamRes, topicsRes] = await Promise.all([
        apiRequest('/teams/my-team'),
        apiRequest('/projects/topics/standard')
      ]);

      if (teamRes.success && teamRes.data) {
        setTeam(teamRes.data);
        if (teamRes.data.projectTopic) {
          setCustomTitle(teamRes.data.projectTopic);
        }
        if (teamRes.data.project?.description) {
          setCustomDescription(teamRes.data.project.description);
        }
      }

      if (topicsRes.success) {
        setStandardTopics(topicsRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load project topics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCuratedTopic = async (topicObj) => {
    if (!team) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/projects/topics/select', {
        method: 'POST',
        body: JSON.stringify({
          teamId: team.teamId,
          topic: topicObj.topic,
          description: topicObj.description,
          isCustom: false
        })
      });

      if (res.success) {
        setSuccess(`Topic confirmed: "${topicObj.topic}"`);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to select topic.');
    } finally {
      setSaving(false);
    }
  };

  const handleProposeCustomTopic = async (e) => {
    e.preventDefault();
    if (!team) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/projects/topics/select', {
        method: 'POST',
        body: JSON.stringify({
          teamId: team.teamId,
          topic: customTitle,
          description: customDescription,
          isCustom: true
        })
      });

      if (res.success) {
        setSuccess('Custom project topic proposed and confirmed!');
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to propose custom topic.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Loading topic repository...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-slate-200 dark:border-slate-700/80 text-center max-w-xl mx-auto my-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          Team Required
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          You must create or join a project team before selecting a capstone project topic.
        </p>
        <Link
          to="/teams/search"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
        >
          Go to Teams &rarr;
        </Link>
      </div>
    );
  }

  const currentTopic = team.projectTopic || team.project?.title;

  return (
    <div className="space-y-6">
      {/* Current Topic Banner (Topic Confirmed State) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <span className="text-[11px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              {team.teamName} • Capstone Milestone
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Project Topic Selection
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Topic Confirmed
            </span>
            {team.project && <StatusBadge status={team.project.status} />}
          </div>
        </div>

        <div className="mt-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            Current Selected Topic
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {currentTopic || 'No topic confirmed yet.'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {team.project?.description || 'Pick a curated departmental topic below or propose a custom research topic.'}
          </p>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500">
            <span>Faculty Reviewer: <strong className="text-slate-700 dark:text-slate-200">{team.project?.facultyName || 'Dr. Alan Turing'}</strong></span>
            <span>•</span>
            <Link to="/tasks" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              Proceed to Tasks &rarr;
            </Link>
          </div>
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
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setMode('curated')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            mode === 'curated'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Curated Academic Topics ({standardTopics.length})
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            mode === 'custom'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Propose Custom Topic
        </button>
      </div>

      {/* Mode 1: Curated Topics List (FR6) */}
      {mode === 'curated' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {standardTopics.map((topicItem, index) => {
            const isSelected = currentTopic === topicItem.topic;
            return (
              <div
                key={index}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {topicItem.department}
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
                    {topicItem.topic}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {topicItem.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectCuratedTopic(topicItem)}
                  disabled={saving || isSelected}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                  }`}
                >
                  {isSelected ? (
                    'Topic Active for Team'
                  ) : (
                    <>
                      Confirm & Adopt Topic <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Propose Custom Topic Form (FR6) */}
      {mode === 'custom' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm max-w-2xl">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
            Propose a Novel Research Topic
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Enter your proposed project title and preliminary technical scope for faculty review.
          </p>

          <form onSubmit={handleProposeCustomTopic} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Topic Title *
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus Engine for Edge IoT Clusters"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Scope & Objectives *
              </label>
              <textarea
                rows={4}
                required
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Explain the technical problem statement, planned tech stack, and expected deliverables..."
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="submit"
                disabled={saving || !customTitle.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Propose & Confirm Topic'} <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
