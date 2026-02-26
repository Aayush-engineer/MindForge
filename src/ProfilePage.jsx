import { useState } from 'react';
import {
  ChevronLeft, User, Key, Shield, LogOut,
  Eye, EyeOff, AlertCircle, CheckCircle, Layers, Brain
} from 'lucide-react';
import { useAuth } from './context/AuthContext';

const API_BASE = 'https://loomiq.onrender.com/api';

const ROLE_BADGE = {
  admin:     'bg-red-100 text-red-700 border border-red-200',
  developer: 'bg-blue-100 text-blue-700 border border-blue-200',
  operator:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
  viewer:    'bg-gray-100 text-gray-600 border border-gray-200',
};

const ACTION_BADGE = {
  create:  'bg-green-100 text-green-700',
  read:    'bg-blue-100 text-blue-700',
  update:  'bg-yellow-100 text-yellow-700',
  delete:  'bg-red-100 text-red-700',
  execute: 'bg-purple-100 text-purple-700',
  manage:  'bg-purple-100 text-purple-700',
  export:  'bg-gray-100 text-gray-600',
};

export default function ProfilePage({ onBack }) {
  const { user, authFetch, logout } = useAuth();
  const [tab, setTab]       = useState('overview');
  const [pwForm, setPwForm] = useState({ old: '', next: '', confirm: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  if (!user) return null;

  const initials =
    (`${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`).toUpperCase() ||
    user.username?.[0]?.toUpperCase() || '?';

  const roles       = user.roles       || [];
  const permissions = user.permissions || [];

  // Group permissions by resource
  const byResource = permissions.reduce((acc, p) => {
    const res = p.resource || p.id?.split(':')[0] || 'other';
    (acc[res] = acc[res] || []).push(p);
    return acc;
  }, {});

  const handlePwChange = async () => {
    setPwError(''); setPwSuccess('');
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords don't match"); return; }
    if (pwForm.next.length < 8)         { setPwError('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/legacy-auth/me/change-password`, {
        method: 'POST',
        body: JSON.stringify({ oldPassword: pwForm.old, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setPwSuccess('Password updated successfully!');
      setPwForm({ old: '', next: '', confirm: '' });
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwLoading(false);
    }
  };

  const TABS = [
    { id: 'overview',    icon: <User size={15} />,   label: 'Overview'    },
    { id: 'permissions', icon: <Key size={15} />,    label: 'Permissions' },
    { id: 'security',    icon: <Shield size={15} />, label: 'Security'    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Header — matches dashboard header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back */}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="h-5 w-px bg-gray-200" />
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">My Profile</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <aside className="w-64 shrink-0 flex flex-col gap-4">

          {/* Avatar card */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {initials}
            </div>
            <h2 className="text-base font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">@{user.username}</p>
            {user.email && <p className="text-xs text-gray-400 mt-1">{user.email}</p>}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {roles.map((r) => (
                <span key={r.id || r} className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_BADGE[r.id] || 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                  {r.name || r}
                </span>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-xl shadow-lg p-2 border border-gray-100">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Meta */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>
            {user.lastLogin && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Last Login</span>
                <span className="text-gray-700">{new Date(user.lastLogin).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Member Since</span>
              <span className="text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 min-w-0">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-5">
                  <User className="w-4 h-4 text-blue-600" /> Account Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'First Name', value: user.firstName || '—' },
                    { label: 'Last Name',  value: user.lastName  || '—' },
                    { label: 'Username',   value: `@${user.username}` },
                    { label: 'Email',      value: user.email     || '—' },
                    { label: 'User ID',    value: user.id, mono: true },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</div>
                      <div className={`text-sm text-gray-900 break-all ${item.mono ? 'font-mono text-xs' : ''}`}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-5">
                  <Layers className="w-4 h-4 text-blue-600" /> Assigned Roles
                </h3>
                {roles.length === 0 ? (
                  <p className="text-sm text-gray-400">No roles assigned.</p>
                ) : (
                  <div className="space-y-2.5">
                    {roles.map((role) => (
                      <div key={role.id || role} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{role.name || role}</div>
                          {role.description && <div className="text-xs text-gray-500 mt-0.5">{role.description}</div>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${role.isSystem ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {role.isSystem ? 'System' : 'Custom'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PERMISSIONS */}
          {tab === 'permissions' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-blue-600" /> Your Permissions
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                {permissions.length} permission{permissions.length !== 1 ? 's' : ''} granted through your roles
              </p>
              {permissions.length === 0 ? (
                <p className="text-sm text-gray-400">No permissions found.</p>
              ) : (
                Object.entries(byResource).map(([resource, perms]) => (
                  <div key={resource} className="mb-5">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-2 mb-2.5 border-b border-gray-100">
                      {resource}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((p) => (
                        <span
                          key={p.id}
                          title={p.description}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ACTION_BADGE[p.action] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {p.action}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SECURITY */}
          {tab === 'security' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-blue-600" /> Change Password
              </h3>
              <p className="text-sm text-gray-400 mb-6">Minimum 8 characters required.</p>

              <div className="space-y-4 max-w-sm">
                {/* Current password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOld ? 'text' : 'password'}
                      value={pwForm.old}
                      onChange={(e) => setPwForm((p) => ({ ...p, old: e.target.value }))}
                      placeholder="Current password"
                      className="w-full pr-10 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button type="button" onClick={() => setShowOld((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pwForm.next}
                      onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                      placeholder="Min. 8 characters"
                      className="w-full pr-10 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" /> {pwSuccess}
                  </div>
                )}

                <button
                  onClick={handlePwChange}
                  disabled={pwLoading || !pwForm.old || !pwForm.next || !pwForm.confirm}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {pwLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Update Password'
                  }
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}