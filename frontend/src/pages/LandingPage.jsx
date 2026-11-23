import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  GraduationCap,
  CheckCircle,
  CheckSquare,
  Lightbulb,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Navigation header */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight leading-tight">
              College Project Portal
            </h1>
            <p className="text-xs text-slate-400">Team Formation & Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
          Unified Academic Project Management System
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight sm:leading-tight mb-6">
          Form Project Teams. Pick Topics. <br />
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Track Progress to Faculty Approval.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          A collaborative portal engineered for college students, team leaders, faculty mentors, and academic administrators following strict UML system specifications.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            Get Started as New Student <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all hover:-translate-y-0.5"
          >
            Existing User Login
          </Link>
        </div>

        {/* Quick Demo Logins Box */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm max-w-3xl mx-auto text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-700 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Seeded Faculty & Admin Credentials
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-configured staff accounts for grading and administration:
              </p>
            </div>
            <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium w-fit">
              Staff Provisioned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
            <button
              onClick={() => handleQuickLogin('admin@college.edu', 'Admin@123')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-600 text-left transition-all group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                Administrator
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Administration</div>
              <div className="text-[10px] text-slate-400 truncate">admin@college.edu</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-mono">Admin@123</div>
            </button>

            <button
              onClick={() => handleQuickLogin('faculty1@college.edu', 'Faculty@123')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-600 text-left transition-all group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                Dr. Robert Vance
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Professor (CSE)</div>
              <div className="text-[10px] text-slate-400 truncate">faculty1@college.edu</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-mono">Faculty@123</div>
            </button>

            <button
              onClick={() => handleQuickLogin('faculty2@college.edu', 'Faculty@456')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-600 text-left transition-all group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                Dr. Sarah Connor
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Assistant Prof (CSE)</div>
              <div className="text-[10px] text-slate-400 truncate">faculty2@college.edu</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-mono">Faculty@456</div>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs flex items-center justify-between">
            <span className="text-indigo-900 dark:text-indigo-200">
              🎓 <strong>Students self-register</strong> with their own credentials. There are zero pre-created students.
            </span>
            <Link
              to="/register"
              className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap text-[11px]"
            >
              Register as Student &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Workflow Cards */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
          End-to-End System Workflow
        </h3>
        <p className="text-xs text-center text-slate-400 mb-10">
          Strictly aligned with the UML State & Activity diagrams
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5">
              1. Team Formation & Members
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Students create teams or search and join existing ones. Team leaders manage roster with min 1 and max 4 member constraints.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5">
              2. Topic Selection & Task Tracking
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Select curated academic themes or propose custom ideas. Assign tasks with deadlines and track execution on a responsive Kanban board.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5">
              3. Faculty Review & Audit Reports
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mentors evaluate deliverables, assign 1–5 star ratings, and approve or trigger task revision cycles. Admins generate PDF/CSV audit reports.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        College Project Team Formation and Management System • Academic Portal
      </footer>
    </div>
  );
}
