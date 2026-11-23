import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  CheckSquare,
  PlusCircle,
  Kanban,
  Table,
  Calendar,
  User,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Edit3,
  RotateCcw,
  Users,
  Layers,
  Crown
} from 'lucide-react';

function PriorityBadge({ priority }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  if (priority === 'High') {
    color = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
  } else if (priority === 'Medium') {
    color = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  } else if (priority === 'Low') {
    color = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      {priority || 'Medium'}
    </span>
  );
}

export default function TaskManagementPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // View state: 'grouped' (default) | 'kanban' | 'table'
  const [viewMode, setViewMode] = useState('grouped');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Assign Task Modal State (Change 2)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [assignLoading, setAssignLoading] = useState(false);

  // Edit / Reassign Task Modal State (Change 2)
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('Pending');
  const [editLoading, setEditLoading] = useState(false);

  // Delete Task Confirm State (Change 2)
  const [deleteTaskObj, setDeleteTaskObj] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const teamRes = await apiRequest('/teams/my-team');
      if (teamRes.success && teamRes.data) {
        setTeam(teamRes.data);
        if (teamRes.data.project) {
          const taskRes = await apiRequest(`/tasks/project/${teamRes.data.project.projectId}`);
          if (taskRes.success && taskRes.data) {
            setTasks(taskRes.data.tasks || []);
            setProgress(taskRes.data.progress || { total: 0, pending: 0, inProgress: 0, completed: 0, completionRate: 0 });
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load task board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.success) {
        setSuccess(`Task status updated to ${newStatus}.`);
        setTasks(prev =>
          prev.map(t => (t.taskId === taskId ? { ...t, status: newStatus } : t))
        );
        // Recalculate progress
        const updated = tasks.map(t => (t.taskId === taskId ? { ...t, status: newStatus } : t));
        const total = updated.length;
        const comp = updated.filter(t => t.status === 'Completed').length;
        setProgress({
          total,
          pending: updated.filter(t => t.status === 'Pending').length,
          inProgress: updated.filter(t => t.status === 'In Progress').length,
          completed: comp,
          completionRate: total > 0 ? Math.round((comp / total) * 100) : 0
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update task status.');
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!team?.project) return;
    setAssignLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/tasks/assign', {
        method: 'POST',
        body: JSON.stringify({
          projectId: team.project.projectId,
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
          assignedTo: newTaskAssignee ? parseInt(newTaskAssignee) : null
        })
      });

      if (res.success) {
        setSuccess('Project part assigned successfully!');
        setIsAssignModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskDueDate('');
        setNewTaskAssignee('');
        setNewTaskPriority('Medium');
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign task.');
    } finally {
      setAssignLoading(false);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title || '');
    setEditDesc(task.description || '');
    setEditAssignee(task.assignedTo ? String(task.assignedTo) : '');
    setEditDueDate(task.dueDate || '');
    setEditPriority(task.priority || 'Medium');
    setEditStatus(task.status || 'Pending');
    setError('');
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest(`/tasks/${editingTask.taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          priority: editPriority,
          dueDate: editDueDate || null,
          assignedTo: editAssignee ? parseInt(editAssignee) : null,
          status: editStatus
        })
      });

      if (res.success) {
        setSuccess('Task updated and reassigned successfully!');
        setEditingTask(null);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update task.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTaskObj) return;
    setDeleteLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest(`/tasks/${deleteTaskObj.taskId}`, { method: 'DELETE' });
      if (res.success) {
        setSuccess(`Task "${deleteTaskObj.title}" deleted.`);
        setDeleteTaskObj(null);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading project task board...</p>
      </div>
    );
  }

  if (!team || !team.project) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-slate-200 dark:border-slate-700/80 text-center max-w-xl mx-auto my-8 shadow-sm">
        <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          No Project Configured
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          You must be part of an active team with a project to manage and assign tasks.
        </p>
        <Link
          to="/teams/search"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
        >
          Form or Join a Team &rarr;
        </Link>
      </div>
    );
  }

  const isLeader = team.isCurrentUserLeader;
  const currentStudentId = team.currentStudentId;

  // Filter tasks if filterAssignee is selected in alternate views
  const filteredTasks = filterAssignee === 'all'
    ? tasks
    : tasks.filter(t => t.assignedTo === parseInt(filterAssignee));

  // If regular member, only render their own member card (or members who have visible tasks)
  const displayMembers = isLeader
    ? (team.members || [])
    : (team.members || []).filter(m => m.studentId === currentStudentId);

  // Unassigned tasks (only visible to leader if any exist)
  const unassignedTasks = tasks.filter(t => !t.assignedTo);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {team.teamName} • Task Tracker
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            Project Task Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLeader
              ? 'As Team Leader, assign different project parts to members, set due dates and priorities, and track milestones.'
              : 'View your assigned project parts and update their progress.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CHANGE 2: "Assign New Task" button ONLY for the team leader */}
          {isLeader && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" /> Assign New Task
            </button>
          )}

          {/* View switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grouped')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="Grouped by Member"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Revisions Requested Alert */}
      {team?.project?.status === 'Needs Changes' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Action Required: Update Tasks (do / Modify / Reassign)
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                Faculty review requested task adjustments. Use the <strong>Edit</strong> button on tasks below to modify details or reassign members, then return to Faculty Review to resubmit.
              </p>
            </div>
          </div>
          <Link
            to="/review"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            Return to Faculty Review &rarr;
          </Link>
        </div>
      )}

      {/* Overall Sprint Progress Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Overall Project Completion: {progress.completionRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({progress.completed} of {progress.total} tasks completed)
            </span>
          </div>

          {viewMode !== 'grouped' && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Assignees</option>
                {team.members?.map(m => (
                  <option key={m.studentId} value={m.studentId}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
            title={`Completed: ${progress.completed}`}
          ></div>
          <div
            className="bg-indigo-500 h-full transition-all duration-500"
            style={{ width: `${progress.total > 0 ? (progress.inProgress / progress.total) * 100 : 0}%` }}
            title={`In Progress: ${progress.inProgress}`}
          ></div>
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${progress.total > 0 ? (progress.pending / progress.total) * 100 : 0}%` }}
            title={`Pending: ${progress.pending}`}
          ></div>
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

      {/* CHANGE 2 VIEW: TASKS GROUPED BY MEMBER (One Card Per Member) */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayMembers.map((member) => {
              const memberTasks = tasks.filter(t => t.assignedTo === member.studentId);
              const totalMemberTasks = memberTasks.length;
              const completedMemberTasks = memberTasks.filter(t => t.status === 'Completed').length;
              const inProgressMemberTasks = memberTasks.filter(t => t.status === 'In Progress').length;
              const pendingMemberTasks = memberTasks.filter(t => t.status === 'Pending').length;
              const memberProgressRate = totalMemberTasks > 0 ? Math.round((completedMemberTasks / totalMemberTasks) * 100) : 0;
              const isCurrentMemberCard = member.studentId === currentStudentId;

              return (
                <div
                  key={member.studentId}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Member Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {member.name}
                            </h3>
                            {member.isLeader ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                                <Crown className="w-3 h-3 text-amber-600" /> Leader
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                                Member
                              </span>
                            )}
                            {isCurrentMemberCard && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {member.email} • {member.department} (Sem {member.semester})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {totalMemberTasks} {totalMemberTasks === 1 ? 'part' : 'parts'}
                        </span>
                        {isLeader && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewTaskAssignee(String(member.studentId));
                              setIsAssignModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
                            title={`Assign a project part to ${member.name}`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Assign Part
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Member Progress Bar */}
                    <div className="mt-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Progress: {memberProgressRate}%
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {completedMemberTasks} / {totalMemberTasks} completed
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${totalMemberTasks > 0 ? (completedMemberTasks / totalMemberTasks) * 100 : 0}%` }}
                        ></div>
                        <div
                          className="bg-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${totalMemberTasks > 0 ? (inProgressMemberTasks / totalMemberTasks) * 100 : 0}%` }}
                        ></div>
                        <div
                          className="bg-amber-400 h-full transition-all duration-300"
                          style={{ width: `${totalMemberTasks > 0 ? (pendingMemberTasks / totalMemberTasks) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Assigned Parts List */}
                    <div className="mt-4 space-y-3">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Assigned Project Parts
                      </div>

                      {memberTasks.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                          No project parts assigned yet.
                          {isLeader && (
                            <button
                              onClick={() => {
                                setNewTaskAssignee(String(member.studentId));
                                setIsAssignModalOpen(true);
                              }}
                              className="block mx-auto mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                            >
                              + Assign a part to {member.name}
                            </button>
                          )}
                        </div>
                      ) : (
                        memberTasks.map((task) => {
                          const canChangeStatus = isLeader || task.assignedTo === currentStudentId;

                          return (
                            <div
                              key={task.taskId}
                              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                </div>

                                {/* CHANGE 2: Leader controls (Edit / Reassign & Delete) */}
                                {isLeader && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(task)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                      title="Edit or Reassign task"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTaskObj(task)}
                                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                      title="Delete task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                <div className="flex items-center gap-2">
                                  <PriorityBadge priority={task.priority} />
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {task.dueDate || 'Flexible'}
                                  </span>
                                </div>

                                {/* Status badge and status changer */}
                                <div>
                                  {canChangeStatus ? (
                                    <select
                                      value={task.status}
                                      onChange={(e) => handleStatusChange(task.taskId, e.target.value)}
                                      className="text-[11px] font-semibold py-1 px-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  ) : (
                                    <StatusBadge status={task.status} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned Tasks Section (Leader Only) */}
          {isLeader && unassignedTasks.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl p-6 border border-amber-200 dark:border-amber-800 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Unassigned Tasks ({unassignedTasks.length})
                  </h3>
                </div>
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Assign these parts to team members
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unassignedTasks.map((task) => (
                  <div
                    key={task.taskId}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 flex items-start justify-between gap-3 shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{task.title}</h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-[11px] text-slate-400">{task.dueDate || 'No due date'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                      >
                        Assign Member
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTaskObj(task)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column: Pending */}
          <div className="bg-slate-100/70 dark:bg-slate-800/60 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col">
            <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pending
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full text-slate-500">
                {filteredTasks.filter(t => t.status === 'Pending').length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {filteredTasks
                .filter(t => t.status === 'Pending')
                .map((task) => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    isLeader={isLeader}
                    currentStudentId={currentStudentId}
                    onStatusChange={handleStatusChange}
                    onEdit={() => openEditModal(task)}
                    onDelete={() => setDeleteTaskObj(task)}
                  />
                ))}
              {filteredTasks.filter(t => t.status === 'Pending').length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No pending tasks</div>
              )}
            </div>
          </div>

          {/* Column: In Progress */}
          <div className="bg-slate-100/70 dark:bg-slate-800/60 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col">
            <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  In Progress
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full text-slate-500">
                {filteredTasks.filter(t => t.status === 'In Progress').length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {filteredTasks
                .filter(t => t.status === 'In Progress')
                .map((task) => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    isLeader={isLeader}
                    currentStudentId={currentStudentId}
                    onStatusChange={handleStatusChange}
                    onEdit={() => openEditModal(task)}
                    onDelete={() => setDeleteTaskObj(task)}
                  />
                ))}
              {filteredTasks.filter(t => t.status === 'In Progress').length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No tasks in progress</div>
              )}
            </div>
          </div>

          {/* Column: Completed */}
          <div className="bg-slate-100/70 dark:bg-slate-800/60 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col">
            <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Completed
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full text-slate-500">
                {filteredTasks.filter(t => t.status === 'Completed').length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {filteredTasks
                .filter(t => t.status === 'Completed')
                .map((task) => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    isLeader={isLeader}
                    currentStudentId={currentStudentId}
                    onStatusChange={handleStatusChange}
                    onEdit={() => openEditModal(task)}
                    onDelete={() => setDeleteTaskObj(task)}
                  />
                ))}
              {filteredTasks.filter(t => t.status === 'Completed').length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No completed tasks yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5">Part / Module Title</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Assigned Member</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  {isLeader && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={isLeader ? 6 : 5} className="py-8 text-center text-slate-400">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const canChangeStatus = isLeader || task.assignedTo === currentStudentId;
                    return (
                      <tr key={task.taskId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{task.title}</div>
                          {task.description && (
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{task.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {task.assignedToName || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {task.dueDate || 'Flexible'}
                        </td>
                        <td className="px-6 py-4">
                          {canChangeStatus ? (
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.taskId, e.target.value)}
                              className="text-xs px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          ) : (
                            <StatusBadge status={task.status} />
                          )}
                        </td>
                        {isLeader && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                title="Modify / Reassign task"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTaskObj(task)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHANGE 2: "Assign New Task" Modal (Leader Only) */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign New Project Part"
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Part / module title *
              </label>
              <span className="text-[10px] text-slate-400">Quick-pick preset part:</span>
            </div>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Frontend UI Design, REST API Backend, Database Schema"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
            {/* Quick part shortcut chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { title: 'Frontend UI & Pages', desc: 'Design responsive interface and client navigation' },
                { title: 'Backend API & Controllers', desc: 'Develop REST endpoints and business logic' },
                { title: 'Database & Data Models', desc: 'Schema modeling, relations, and data persistence' },
                { title: 'Testing & Verification', desc: 'Unit testing and API compliance validation' },
                { title: 'Documentation & Report', desc: 'Write final project report and architecture diagrams' },
                { title: 'Security & Auth Middleware', desc: 'Authentication, RBAC guards, and security controls' }
              ].map((chip) => (
                <button
                  key={chip.title}
                  type="button"
                  onClick={() => {
                    setNewTaskTitle(chip.title);
                    if (!newTaskDesc) setNewTaskDesc(chip.desc);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-700 dark:hover:bg-indigo-950/40 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  + {chip.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Describe deliverables and milestones for this part..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assign to *
            </label>
            <select
              required
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            >
              <option value="">-- Select Team Member --</option>
              {team.members?.map(m => (
                <option key={m.studentId} value={m.studentId}>
                  {m.name} {m.isLeader ? '(Leader)' : '(Member)'} - {m.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignLoading || !newTaskTitle.trim() || !newTaskAssignee}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              {assignLoading ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CHANGE 2: Edit / Reassign Task Modal (Leader Only) */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit / Reassign Task"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Part / module title *
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assign to *
            </label>
            <select
              value={editAssignee}
              onChange={(e) => setEditAssignee(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            >
              <option value="">-- Unassigned --</option>
              {team?.members?.map((m) => (
                <option key={m.studentId} value={m.studentId}>
                  {m.name} {m.isLeader ? '(Leader)' : '(Member)'} - {m.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading || !editTitle.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              {editLoading ? 'Saving...' : 'Save & Reassign Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CHANGE 2: Delete Task Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTaskObj}
        onClose={() => setDeleteTaskObj(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task?"
        message={`Are you sure you want to delete task "${deleteTaskObj?.title}"? This cannot be undone.`}
        confirmText="Delete Task"
        loading={deleteLoading}
        isDanger={true}
      />
    </div>
  );
}

// Kanban Task Card Component
function TaskCard({ task, isLeader, currentStudentId, onStatusChange, onEdit, onDelete }) {
  const canChangeStatus = isLeader || task.assignedTo === currentStudentId;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">
          {task.title}
        </h4>
        {isLeader && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
              title="Modify / Reassign task"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
        <PriorityBadge priority={task.priority} />
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{task.dueDate || 'Flexible'}</span>
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        <span className="flex items-center gap-1 truncate max-w-[150px]">
          <User className="w-3 h-3 text-indigo-500 flex-shrink-0" />
          <span className="truncate">{task.assignedToName || 'Unassigned'}</span>
        </span>
      </div>

      {canChangeStatus && (
        <div className="mt-2.5">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.taskId, e.target.value)}
            className="w-full text-[11px] font-semibold py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="Pending">Move to: Pending</option>
            <option value="In Progress">Move to: In Progress</option>
            <option value="Completed">Move to: Completed</option>
          </select>
        </div>
      )}
    </div>
  );
}
