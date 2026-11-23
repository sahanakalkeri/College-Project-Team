import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  Search,
  Users,
  PlusCircle,
  LogIn,
  Crown,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function SearchTeamsPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Team Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTopic, setNewTeamTopic] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Joining Team State
  const [joiningTeamId, setJoiningTeamId] = useState(null);

  // Debounce search input (NFR5 Performance)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchTeams = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/teams/search?keyword=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=9`);
      if (res.success) {
        setTeams(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to search teams.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchTeams(1);
  }, [fetchTeams]);

  const handleJoinTeam = async (teamId) => {
    setJoiningTeamId(teamId);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/teams/join', {
        method: 'POST',
        body: JSON.stringify({ teamId })
      });

      if (res.success) {
        setSuccess('Successfully joined the team! Redirecting to My Team...');
        await refreshUser();
        setTimeout(() => {
          navigate('/team');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Could not join team.');
    } finally {
      setJoiningTeamId(null);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/teams/create', {
        method: 'POST',
        body: JSON.stringify({
          teamName: newTeamName,
          projectTopic: newTeamTopic
        })
      });

      if (res.success) {
        setSuccess('Team created successfully! You are now the Team Leader.');
        setIsCreateModalOpen(false);
        setNewTeamName('');
        setNewTeamTopic('');
        await refreshUser();
        setTimeout(() => {
          navigate('/team');
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create team.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Search & Join Project Teams
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse available teams by name or project topic, or launch your own team as leader
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" /> Create New Team
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
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Debounced Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by team name or project topic..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Searching active teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 border border-slate-200 dark:border-slate-700/80 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">
            No Teams Found
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            No teams match your search keyword. Be the first to create one!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
          >
            Create Team Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => {
            const isFull = t.memberCount >= 4;
            return (
              <div
                key={t.teamId}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                      {t.teamName}
                    </h3>
                    <StatusBadge status={t.projectStatus || 'Proposing'} />
                  </div>

                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Project Topic
                    </span>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                      {t.projectTopic || 'Topic not yet finalized'}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate">Leader: {t.leaderName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Capacity: {t.memberCount} / 4 Students</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${isFull ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {isFull ? 'Team Full' : `${4 - t.memberCount} spots open`}
                  </span>

                  <button
                    onClick={() => handleJoinTeam(t.teamId)}
                    disabled={isFull || joiningTeamId === t.teamId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-500/20"
                  >
                    {joiningTeamId === t.teamId ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" /> Join Team
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls (NFR5 Performance) */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} teams)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTeams(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs text-slate-700 dark:text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchTeams(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs text-slate-700 dark:text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Team Modal (FR3) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Team Name *
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Nexus Innovations"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Preliminary Project Topic (Optional)
            </label>
            <input
              type="text"
              value={newTeamTopic}
              onChange={(e) => setNewTeamTopic(e.target.value)}
              placeholder="e.g. Autonomous Campus Delivery Rover"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              You can confirm or select from suggested topics after creating the team.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            👑 As the creator of this team, you will automatically be assigned as <strong>Team Leader</strong>.
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || !newTeamName.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              {createLoading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
