import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { apiRequest } from '../services/api';
import ProgressStepper from '../components/ProgressStepper';
import StatusBadge from '../components/StatusBadge';
import DonutChart from '../components/DonutChart';
import {
  Users,
  UserPlus,
  Lightbulb,
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Calendar,
  PlusCircle,
  ExternalLink,
  Bell,
  Database,
  User,
  RotateCcw,
  CheckCircle,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const [tasksData, setTasksData] = useState({ tasks: [], progress: { total: 0, pending: 0, inProgress: 0, completed: 0, completionRate: 0 } });
  const [facultyTeams, setFacultyTeams] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        if (user.role === 'Student') {
          // Load student's team
          const teamRes = await apiRequest('/teams/my-team');
          if (teamRes.success && teamRes.data) {
            setTeamData(teamRes.data);
            if (teamRes.data.project) {
              const taskRes = await apiRequest(`/tasks/project/${teamRes.data.project.projectId}`);
              if (taskRes.success && taskRes.data) {
                setTasksData(taskRes.data);
              }
            }
          }
        } else if (user.role === 'Faculty') {
          const facultyRes = await apiRequest('/faculty/teams');
          if (facultyRes.success) {
            setFacultyTeams(facultyRes.data || []);
          }
        } else if (user.role === 'Admin') {
          const repRes = await apiRequest('/admin/reports/generate', {
            method: 'POST',
            body: JSON.stringify({ reportType: 'Live Admin Metrics' })
          });
          if (repRes.success && repRes.data) {
            setAdminStats(repRes.data.summaryData?.metrics || null);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  // Determine stepper stage (Activity Diagram: Team, Members, Topic, Tasks, Review)
  let currentStep = 1;
  if (teamData) {
    currentStep = 2; // Team formed -> Members management available
    if (teamData.projectTopic || (teamData.project && teamData.project.title && teamData.project.title !== `${teamData.teamName} Project`)) {
      currentStep = 3; // Topic selected/confirmed
    }
    if (tasksData.tasks && tasksData.tasks.length > 0) {
      currentStep = 4; // Tasks assigned & tracking
    }
    if (teamData.project && ['Submitted', 'Submitted for Review', 'Needs Changes', 'Approved', 'Completed'].includes(teamData.project.status)) {
      currentStep = 5; // Faculty Review
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-3">
            <span>Academic Year 2026–2027</span>
            <span>•</span>
            <span className="capitalize">{user.role} Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name}!
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            {user.role === 'Student'
              ? teamData
                ? `You are active in team "${teamData.teamName}". Track your milestone deadlines and faculty reviews.`
                : 'No teams yet. Create your first team or search available teams to join.'
              : user.role === 'Faculty'
              ? facultyTeams.length > 0
                ? `You are supervising ${facultyTeams.length} academic project teams. Review deliverables and submit rating feedback.`
                : 'No project teams have been assigned yet. Teams created by students will appear here for your supervision.'
              : 'System Administrator overview: monitor users, audit projects, and export compliance reports.'}
          </p>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Stepper for Students */}
      {user.role === 'Student' && (
        <ProgressStepper
          currentStep={currentStep}
          teamExists={!!teamData}
          isLeader={teamData?.isCurrentUserLeader}
        />
      )}

      {/* Role-Specific Dashboard Views */}
      {user.role === 'Student' && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Team Status</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                {teamData ? teamData.teamName : 'No Team'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {teamData
                  ? `${teamData.members?.length || 1} / 4 Members (${teamData.isCurrentUserLeader ? 'Leader' : 'Member'})`
                  : 'Create or join a team'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Project Status</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-1">
                {teamData?.project ? (
                  <StatusBadge status={teamData.project.status} />
                ) : (
                  <span className="text-xs text-slate-400">Not initiated</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 truncate">
                {teamData?.project?.title || 'Topic pending selection'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Task Velocity</span>
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {tasksData.progress.completionRate}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {tasksData.progress.completed} of {tasksData.progress.total} tasks completed
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Supervisor</span>
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {teamData?.project?.facultyName || 'Pending Assignment'}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">
                {teamData?.project?.facultyDesignation || 'Academic Review'}
              </p>
            </div>
          </div>

          {/* Loop Alert: Needs Changes -> Update Tasks */}
          {teamData?.project?.status === 'Needs Changes' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                    Faculty Decision: Needs Changes (Activity Diagram Loop)
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Your faculty mentor has reviewed your submission and requested adjustments. Go to <strong>Update Tasks</strong> to modify or reassign deliverables, then resubmit for review.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Link
                  to="/tasks"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Update Tasks &rarr;
                </Link>
                <Link
                  to="/review"
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-xs hover:bg-amber-50 transition-colors"
                >
                  View Feedback &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Post-Approval Three Parallel Actions */}
          {teamData?.project?.status === 'Approved' && (
            <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Milestone Approved! Post-Approval Parallel Actions (Activity Diagram)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-1">
                    <Bell className="w-4 h-4 text-emerald-600" /> 1. Send Notifications
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-2">
                    Milestone certification notices broadcasted to team and guide.
                  </p>
                  <Link to="/notifications" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    View Notifications &rarr;
                  </Link>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-1">
                    <Database className="w-4 h-4 text-emerald-600" /> 2. Store Data
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-2">
                    Project records, status, and faculty rating saved permanently in DB.
                  </p>
                  <span className="inline-block text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                    Persisted in SQLite
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-1">
                    <User className="w-4 h-4 text-emerald-600" /> 3. Update Profile
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-2">
                    Update academic credentials, contact info, or profile photo.
                  </p>
                  <Link to="/profile" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    Update Profile &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Four Parallel Activities (Activity Diagram Specification) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-700 gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Application Workflow • Four Parallel Branches
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Dashboard Options (Fork)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Four parallel branches available simultaneously from your dashboard:
                </p>
              </div>
              <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full font-semibold w-fit">
                Parallel Execution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Manage Team (Create / Join team) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between group hover:border-indigo-400 transition-all">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Manage Team
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Create a new project team or search and join existing teams.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <Link
                    to={teamData ? '/team' : '/teams/search'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    {teamData ? 'Manage Team' : 'Create / Join Team'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 2. Manage Members (Add / Remove) - Team leader only */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between group hover:border-indigo-400 transition-all">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Manage Members
                    </h4>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                      Leader Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {teamData?.isCurrentUserLeader
                      ? 'Add candidate students or remove members from your roster.'
                      : 'Roster management is reserved for the Team Leader.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <Link
                    to="/team"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    {teamData?.isCurrentUserLeader ? 'Add / Remove Members' : 'View Roster'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 3. View Project Topics (Select topic) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between group hover:border-indigo-400 transition-all">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    View Project Topics
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Select curated departmental topics or propose a custom topic.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <Link
                    to="/project/topic"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    Select Topic <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 4. Manage Tasks (Assign / Update) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between group hover:border-indigo-400 transition-all">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Manage Tasks
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Assign sprint deliverables, set deadlines, and update status.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <Link
                    to="/tasks"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    Assign / Update <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Join Bar: Continue to Faculty Review */}
            <div className="mt-5 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Next Stage (Join Bar in Application Flow)
                </span>
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-100 mt-0.5">
                  Faculty Review (entry / Submit project)
                </h4>
                <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                  Team leader submits project details & tasks for faculty review, approval, or revision guidance.
                </p>
              </div>
              <Link
                to="/review"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 whitespace-nowrap transition-all"
              >
                Continue to Faculty Review <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Interactive Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Donut Chart Widget */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Task Distribution
                  </h3>
                  <Link to="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    Manage <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="py-2 flex justify-center">
                  <DonutChart
                    pending={tasksData.progress.pending}
                    inProgress={tasksData.progress.inProgress}
                    completed={tasksData.progress.completed}
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
                <Link
                  to="/tasks"
                  className="w-full inline-block py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Open Kanban Board &rarr;
                </Link>
              </div>
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" /> Upcoming Deadlines
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Timeline</span>
                </div>

                <div className="space-y-3">
                  {tasksData.tasks.filter(t => t.status !== 'Completed').slice(0, 3).length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No pending deadlines. Create sprint tasks in your team!
                    </div>
                  ) : (
                    tasksData.tasks
                      .filter(t => t.status !== 'Completed')
                      .slice(0, 3)
                      .map((task) => (
                        <div
                          key={task.taskId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {task.title}
                            </span>
                            <StatusBadge status={task.status} />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                            <span>Due: {task.dueDate || 'Flexible'}</span>
                            <span>{task.assignedToName || 'Unassigned'}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <Link
                  to="/project/topic"
                  className="w-full inline-block py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 text-center transition-colors"
                >
                  View Project Milestone &rarr;
                </Link>
              </div>
            </div>

            {/* Recent Notifications Widget */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Recent Activity
                  </h3>
                  <Link to="/notifications" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    View all
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {notifications.slice(0, 3).length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No recent notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.notificationId}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 text-xs"
                      >
                        <p className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <Link
                  to="/review"
                  className="w-full inline-block py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold text-indigo-600 dark:text-indigo-400 text-center transition-colors"
                >
                  Check Faculty Review &rarr;
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Role-Specific View: Faculty */}
      {user.role === 'Faculty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Supervised Teams</span>
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">
                {facultyTeams.length}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Pending Reviews</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-2">
                {facultyTeams.filter(t => t.projectStatus === 'Submitted for Review').length}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Approved Projects</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                {facultyTeams.filter(t => t.projectStatus === 'Approved').length}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Teams Under Your Supervision
              </h3>
              {facultyTeams.length > 0 && (
                <Link
                  to="/faculty"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Full Teams & Grading Console &rarr;
                </Link>
              )}
            </div>

            {facultyTeams.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No teams yet
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Once registered students form project teams and submit their project topics, they will appear here for your supervision and milestone reviews.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {facultyTeams.map((team) => {
                  const completion = team.taskCount > 0 ? Math.round((team.completedTaskCount / team.taskCount) * 100) : 0;
                  return (
                    <div
                      key={team.teamId}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {team.teamName}
                          </h4>
                          <StatusBadge status={team.projectStatus || 'Proposing'} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Topic: <span className="font-medium text-slate-700 dark:text-slate-300">{team.projectTopic || 'Custom topic'}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Leader: {team.leaderName} ({team.leaderEmail}) • {team.memberCount} members
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="w-36">
                          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                            <span>Progress</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{completion}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${completion}%` }}></div>
                          </div>
                        </div>

                        <Link
                          to={`/faculty`}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors whitespace-nowrap shadow-sm shadow-indigo-500/20"
                        >
                          Review Team
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role-Specific View: Admin */}
      {user.role === 'Admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Users</span>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {adminStats ? adminStats.totalUsers : 3}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Students</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {adminStats ? adminStats.totalStudents : 0}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Faculty</span>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {adminStats ? adminStats.totalFaculty : 2}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Teams</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                {adminStats ? adminStats.totalTeams : 0}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Projects</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {adminStats ? adminStats.totalProjects : 0}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500" /> Administrative User Controls
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Activate or deactivate user accounts, reset credentials, and filter by student or faculty departments.
              </p>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-colors"
              >
                Open User Management Console <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Compliance Reports & CSV Export
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Generate real-time system performance audits and download spreadsheets for academic accreditation.
              </p>
              <Link
                to="/admin/reports"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Reports & Analytics Generator <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
