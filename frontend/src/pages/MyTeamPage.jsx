import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Mail,
  GraduationCap,
  Award,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Search,
  UserCheck
} from 'lucide-react';

export default function MyTeamPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Member Modal State (Change 1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingStudentId, setAddingStudentId] = useState(null);

  // Remove Member Confirm Dialog State (Change 1)
  const [removeStudent, setRemoveStudent] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await apiRequest('/teams/my-team');
      if (res.success) {
        setTeam(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load team details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchAvailableStudents = useCallback(async (keyword = '') => {
    setSearching(true);
    try {
      const res = await apiRequest(`/teams/available-students?keyword=${encodeURIComponent(keyword.trim())}`);
      if (res.success) {
        setAvailableStudents(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load available students:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const openAddModal = () => {
    setSearchKeyword('');
    setIsAddModalOpen(true);
    fetchAvailableStudents('');
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchKeyword(val);
    fetchAvailableStudents(val);
  };

  const handleAddMember = async (studentId, studentEmail = null) => {
    if (!team) return;
    setAddingStudentId(studentId || studentEmail || 'custom');
    setError('');
    setSuccess('');

    try {
      const payload = { teamId: team.teamId };
      if (studentId) payload.studentId = parseInt(studentId, 10);
      if (studentEmail) payload.studentEmail = studentEmail.trim();

      const res = await apiRequest('/teams/members/add', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setSuccess('Member added to the team successfully!');
        setIsAddModalOpen(false);
        setSearchKeyword('');
        // Refresh team members immediately without full page reload
        await fetchTeam();
      }
    } catch (err) {
      setError(err.message || 'Could not add member.');
    } finally {
      setAddingStudentId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeStudent || !team) return;
    setRemoveLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/teams/members/remove', {
        method: 'POST',
        body: JSON.stringify({
          teamId: team.teamId,
          studentId: removeStudent.studentId
        })
      });

      if (res.success) {
        setSuccess(`Removed ${removeStudent.name} from the team.`);
        setRemoveStudent(null);
        // Refresh team members immediately without full page reload
        await fetchTeam();
      }
    } catch (err) {
      setError(err.message || 'Could not remove member.');
      setRemoveStudent(null);
    } finally {
      setRemoveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading your team roster...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-slate-200 dark:border-slate-700/80 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          You Are Not in a Team Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          To begin work on your college capstone project, you can either create your own team or browse and join existing student teams.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/teams/search"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-colors"
          >
            Create or Join Team &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const isLeader = team.isCurrentUserLeader;
  const memberCount = team.members?.length || 0;

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
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

      {/* Team Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {team.teamName}
              </h2>
              {isLeader ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> You are Team Leader
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                  Team Member
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created on {new Date(team.createdOn).toLocaleDateString()} • Team ID #{team.teamId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/project/topic"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" /> Manage Topic
            </Link>
          </div>
        </div>

        {/* Project Topic & Faculty Guide Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Confirmed Project Topic
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {team.projectTopic || team.project?.title || 'No Topic Selected Yet'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {team.project?.description || 'Pick or propose a topic to finalize milestones.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Project Status & Faculty Guide
            </span>
            <div className="flex items-center gap-2 mt-1">
              {team.project ? (
                <StatusBadge status={team.project.status} />
              ) : (
                <span className="text-xs text-slate-400">Proposing</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Faculty: {team.project?.facultyName || 'Dr. Alan Turing (Assigned)'}
            </p>
          </div>
        </div>
      </div>

      {/* CHANGE 1: Dedicated "Manage Members" area for TeamLeader */}
      {isLeader && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Manage Members
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                As Team Leader, search and add available students or remove members from your team.
              </p>
            </div>

            {memberCount < 4 ? (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
            ) : (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500">
                Team Full (Max 4 Members)
              </span>
            )}
          </div>
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Current roster: <span className="font-bold text-slate-700 dark:text-slate-200">{memberCount} / 4 members</span>. Students can belong to only one team at a time.
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Team Members ({memberCount} / 4)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              UML Multiplicity: Student 0..* — 1..* Team (Minimum 1 member)
            </p>
          </div>

          {memberCount >= 4 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Team Full (Max 4)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.members?.map((member) => (
            <div
              key={member.studentId}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {member.name}
                    </span>
                    {member.isLeader ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                        <Crown className="w-3 h-3 text-amber-600" /> Leader
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                        Member
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {member.email}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    <span>Sem: {member.semester}</span>
                    <span>•</span>
                    <span>Dept: {member.department}</span>
                    <span>•</span>
                    <span>CGPA: {member.cgpa}</span>
                  </div>
                </div>
              </div>

              {/* CHANGE 1: "Remove" button next to every member EXCEPT the leader, shown ONLY to team leader */}
              {isLeader && !member.isLeader && (
                <button
                  type="button"
                  onClick={() => setRemoveStudent(member)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  title={`Remove ${member.name} from team`}
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CHANGE 1: Add Member Modal with Real-time Search Box */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search students by name or email. Only students who are not yet in any team are shown.
          </p>

          {/* Search Box with Enter support */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchKeyword.trim()) {
                // If it looks like an email or no matching student in list, attempt add by email
                const match = availableStudents.find(
                  s => s.email.toLowerCase() === searchKeyword.trim().toLowerCase()
                );
                if (match) {
                  handleAddMember(match.studentId);
                } else if (searchKeyword.trim().includes('@')) {
                  handleAddMember(null, searchKeyword.trim());
                }
              }
            }}
            className="space-y-3"
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={handleSearchChange}
                placeholder="Search by student name or enter student email..."
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                autoFocus
              />
            </div>

            {searchKeyword.trim().includes('@') && (
              <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3">
                <div className="text-xs text-indigo-900 dark:text-indigo-200 truncate">
                  Add student with email: <span className="font-semibold">{searchKeyword.trim()}</span>
                </div>
                <button
                  type="button"
                  disabled={addingStudentId !== null}
                  onClick={() => handleAddMember(null, searchKeyword.trim())}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {addingStudentId ? 'Adding...' : 'Add by Email'}
                </button>
              </div>
            )}
          </form>

          {/* Search Results / Available Students List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pt-1 divide-y divide-slate-100 dark:divide-slate-700/60">
            {searching ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Searching available students...
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {searchKeyword ? `No available unassigned students matching "${searchKeyword}"` : 'No available unassigned students found'}
              </div>
            ) : (
              availableStudents.map((st) => (
                <div
                  key={st.studentId}
                  className="pt-2 pb-1 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {st.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {st.email} • {st.department} (Sem {st.semester}, CGPA {st.cgpa})
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={addingStudentId === st.studentId}
                    onClick={() => handleAddMember(st.studentId)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {addingStudentId === st.studentId ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* CHANGE 1: Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!removeStudent}
        onClose={() => setRemoveStudent(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Member?"
        message={`Remove ${removeStudent?.name} from the team?`}
        confirmText="Remove"
        loading={removeLoading}
        isDanger={true}
      />
    </div>
  );
}
