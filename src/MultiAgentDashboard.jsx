import React, { useState, useEffect } from 'react';
import { Send, Activity, CheckCircle, XCircle, Clock, Zap, Brain, Code, Users, ChevronDown, ChevronUp, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import TaskProgressTerminal from './components/TaskProgressTerminal';

const API_BASE = 'https://loomiq.onrender.com/api';

export default function MultiAgentDashboard({ onProfile }) {
  const { user, logout, authFetch, token } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('loomiq_theme') === 'dark');

  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [newTask, setNewTask] = useState({ prompt: '', type: 'implementation', priority: 'medium', useCollaboration: false });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [lastCreatedTask, setLastCreatedTask] = useState(null);
  const [streamingTaskId, setStreamingTaskId] = useState(null);
  const streamingTaskIdRef = React.useRef(null);
  const resultRef = React.useRef(null);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('loomiq_theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    fetchAgents(); fetchStats(); fetchTasks();
    const interval = setInterval(() => { fetchStats(); fetchTasks(); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => { try { const res = await authFetch(`${API_BASE}/agents`); const data = await res.json(); setAgents(data.agents || []); } catch (err) {} };
  const fetchStats  = async () => { try { const res = await authFetch(`${API_BASE}/stats`);  const data = await res.json(); setStats(data.stats || null);  } catch (err) {} };
  const fetchTasks  = async () => { try { const res = await authFetch(`${API_BASE}/tasks`);  const data = await res.json(); setTasks(data.tasks || []);   } catch (err) {} };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => { const s = new Set(prev); if (s.has(taskId)) s.delete(taskId); else s.add(taskId); return s; });
  };

  const createTask = async () => {
    if (!newTask.prompt.trim()) return;
    setLoading(true);
    setLastCreatedTask(null);
    setStreamingTaskId(null);
    streamingTaskIdRef.current = null;
    try {
      const res = await authFetch(`${API_BASE}/tasks`, { method: 'POST', body: JSON.stringify(newTask) });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => [data.task, ...prev]);
        streamingTaskIdRef.current = data.task.id;
        setStreamingTaskId(data.task.id);
        setLoading(false);
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      setLoading(false);
    }
  };

  const handleStreamComplete = async () => {
    const taskId = streamingTaskIdRef.current;
    setStreamingTaskId(null);
    streamingTaskIdRef.current = null;
    if (!taskId) return;
    try {
      const res  = await authFetch(`${API_BASE}/tasks/${taskId}`);
      const data = await res.json();
      if (data.task) {
        setLastCreatedTask(data.task);
        setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t));
        fetchStats();
      }
    } catch (err) {}
  };

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const t = {
    page:        dark ? 'bg-gray-950 text-gray-100' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900',
    header:      dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    card:        dark ? 'bg-gray-900 border-gray-800 shadow-gray-950' : 'bg-white border-gray-100',
    cardHeader:  dark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100',
    formHeader:  dark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-gray-100',
    input:       dark ? 'bg-gray-800 border-gray-700 text-gray-100 focus:bg-gray-750 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white placeholder-gray-400',
    select:      dark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-800',
    label:       dark ? 'text-gray-400' : 'text-gray-500',
    title:       dark ? 'text-gray-100' : 'text-gray-900',
    subtitle:    dark ? 'text-gray-400' : 'text-gray-500',
    tab:         dark ? 'bg-gray-800' : 'bg-gray-100',
    tabActive:   dark ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600',
    tabInactive: dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900',
    collab:      dark ? 'bg-blue-950 border-blue-800 hover:bg-blue-900' : 'bg-blue-50 border-blue-100 hover:bg-blue-100',
    collabTitle: dark ? 'text-blue-300' : 'text-blue-800',
    collabSub:   dark ? 'text-blue-400' : 'text-blue-600',
    idle:        dark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100',
    resultBox:   dark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
    resultHead:  dark ? 'bg-gray-700 border-gray-600' : 'bg-green-100/50 border-green-200',
    resultBody:  dark ? 'bg-gray-850 text-gray-200' : 'bg-white text-gray-700',
    taskCard:    dark ? 'bg-gray-900 hover:bg-gray-850' : 'bg-white hover:shadow-xl',
    divider:     dark ? 'border-gray-800' : 'border-gray-200',
    agentCard:   dark ? 'bg-gray-900' : 'bg-white',
    metaText:    dark ? 'text-gray-400' : 'text-gray-500',
    duration:    dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-50 text-blue-700',
  };

  const getStatusColor = (s) => ({
    completed:   dark ? 'text-green-400 bg-green-950'  : 'text-green-600 bg-green-50',
    failed:      dark ? 'text-red-400 bg-red-950'      : 'text-red-600 bg-red-50',
    in_progress: dark ? 'text-blue-400 bg-blue-950'    : 'text-blue-600 bg-blue-50',
    pending:     dark ? 'text-yellow-400 bg-yellow-950': 'text-yellow-600 bg-yellow-50',
  }[s] || (dark ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-50'));

  const getStatusIcon = (s) => ({ completed: <CheckCircle className="w-4 h-4" />, failed: <XCircle className="w-4 h-4" />, in_progress: <Activity className="w-4 h-4 animate-spin" />, pending: <Clock className="w-4 h-4" /> }[s] || <Clock className="w-4 h-4" />);
  const getPriorityColor = (p) => ({ critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' }[p] || 'bg-gray-500');

  const formatOutput = (output) => {
    if (!output) return 'No output available';
    if (typeof output === 'string') return output;
    if (output.results?.combinedOutput?.content) {
      const combined = output.results.combinedOutput;
      return (<div className="space-y-3"><div className="font-semibold text-sm">🤝 Collaboration Results ({output.results.metadata?.agentCount || 0} agents)</div><div className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${dark ? 'bg-gray-800' : 'bg-white border border-green-100'}`}>{combined.content}</div></div>);
    }
    if (Array.isArray(output.results)) {
      return (<div className="space-y-3"><div className="font-semibold text-sm">🤝 Collaboration Steps ({output.results.length}):</div>{output.results.map((step, idx) => { const content = step.output?.content || step.content || JSON.stringify(step, null, 2); return (<div key={idx} className={`border-l-4 border-blue-500 pl-3 py-2 rounded text-sm ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}><div className="font-medium text-blue-400 mb-1">Step {idx + 1}: {step.agentId || `Agent ${idx + 1}`}</div><div className="whitespace-pre-wrap">{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</div></div>); })}</div>);
    }
    if (output.content) return typeof output.content === 'string' ? output.content : JSON.stringify(output.content, null, 2);
    if (output.metadata || output.finishReason) {
      const txt = output.content || output.text || output.result || 'No text content';
      return (<div><div className="text-sm whitespace-pre-wrap">{typeof txt === 'string' ? txt : JSON.stringify(txt, null, 2)}</div>{output.metadata && <div className={`text-xs mt-2 pt-2 border-t ${dark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>📊 {output.metadata.model || 'Unknown'} | {output.metadata.tokensUsed || 0} tokens</div>}</div>);
    }
    try { return <pre className="text-xs overflow-x-auto">{JSON.stringify(output, null, 2)}</pre>; }
    catch (e) { return 'Unable to display output'; }
  };

  const initials = (`${(user?.firstName||'')[0]||''}${(user?.lastName||'')[0]||''}`).toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className={`min-h-screen ${t.page}`}>

      {/* ── Header ── */}
      <header className={`border-b shadow-sm sticky top-0 z-50 ${t.header}`}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"><Brain className="w-7 h-7 text-white" /></div>
              <div><h1 className={`text-xl font-bold ${t.title}`}>LoomIQ</h1><p className={`text-xs ${t.subtitle}`}>AI-Powered Task Collaboration</p></div>
            </div>
            {stats && (
              <div className="hidden md:flex space-x-5">
                <div className="text-center"><div className="text-xl font-bold text-blue-500">{stats.total}</div><div className={`text-xs ${t.subtitle}`}>Total</div></div>
                <div className="text-center"><div className="text-xl font-bold text-green-500">{stats.completed}</div><div className={`text-xs ${t.subtitle}`}>Done</div></div>
                <div className="text-center"><div className="text-xl font-bold text-orange-500">{stats.running}</div><div className={`text-xs ${t.subtitle}`}>Running</div></div>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* Dark/light toggle */}
              <button
                onClick={toggleDark}
                className={`p-2 rounded-lg border transition-colors ${dark ? 'border-gray-700 text-yellow-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={onProfile} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
                <div className="text-left hidden sm:block"><div className={`text-sm font-semibold leading-tight ${t.title}`}>{user?.firstName || user?.username}</div><div className={`text-xs leading-tight ${t.subtitle}`}>{user?.roles?.[0]?.name || 'Viewer'}</div></div>
                <Settings className={`w-3.5 h-3.5 ${t.subtitle}`} />
              </button>
              <button onClick={logout} className={`p-2 rounded-lg border transition-colors ${dark ? 'border-red-900 text-red-400 hover:bg-red-950' : 'border-red-100 text-red-500 hover:bg-red-50'}`}><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Agent bar ── */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2"><Users className="w-4 h-4" /><span className="text-sm font-medium">{agents.length} Active Agents</span></div>
            <div className="flex space-x-3">{agents.map(agent => (<div key={agent.id} className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div><span className="text-xs font-medium">{agent.name.split(' ')[0]}</span></div>))}</div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Tabs */}
        <div className={`flex space-x-1 mb-5 p-1 rounded-lg ${t.tab}`}>
          {['create', 'tasks', 'agents'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 px-4 rounded-md font-medium transition-all text-sm ${activeTab === tab ? t.tabActive + ' shadow-sm' : t.tabInactive}`}>
              {tab === 'create' && <Send className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'tasks'  && <Activity className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === 'agents' && <Users className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'tasks'  && ` (${tasks.length})`}
              {tab === 'agents' && ` (${agents.length})`}
            </button>
          ))}
        </div>

        {/* ── CREATE TAB ── */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* LEFT: Form — fixed height, scrollable internally so button always visible */}
            <div className={`rounded-xl shadow-lg border overflow-hidden flex flex-col ${t.card}`} style={{height: 'calc(100vh - 220px)', minHeight: '460px'}}>
              <div className={`px-5 py-3.5 border-b flex-shrink-0 ${t.formHeader}`}>
                <h2 className={`text-base font-bold ${t.title}`}>New Task</h2>
                <p className={`text-xs mt-0.5 ${t.subtitle}`}>Describe what you need — AI agents will handle it</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${t.label}`}>Task Description</label>
                  <textarea
                    value={newTask.prompt}
                    onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none ${t.input}`}
                    rows="4"
                    placeholder="e.g. Write a Python function to sort a list of dicts..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${t.label}`}>Type</label>
                    <select value={newTask.type} onChange={(e) => setNewTask({ ...newTask, type: e.target.value })} className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${t.select}`}>
                      <option value="implementation">Implementation</option>
                      <option value="design">Design</option>
                      <option value="test">Test / Review</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${t.label}`}>Priority</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${t.select}`}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${t.collab}`}>
                  <input type="checkbox" checked={newTask.useCollaboration} onChange={(e) => setNewTask({ ...newTask, useCollaboration: e.target.checked })} className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded" />
                  <div>
                    <div className={`text-sm font-semibold ${t.collabTitle}`}>🤝 Multi-agent collaboration</div>
                    <div className={`text-xs mt-0.5 ${t.collabSub}`}>Two AI agents work together for better results</div>
                  </div>
                </label>
              </div>
              {/* Button pinned to bottom — always visible */}
              <div className={`p-4 border-t flex-shrink-0 ${t.divider}`}>
                <button
                  onClick={createTask}
                  disabled={loading || !!streamingTaskId || !newTask.prompt.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
                >
                  {loading
                    ? <><Activity className="w-4 h-4 animate-spin" /><span>Creating…</span></>
                    : streamingTaskId
                    ? <><Activity className="w-4 h-4 animate-spin" /><span>Running…</span></>
                    : <><Send className="w-4 h-4" /><span>Create Task</span></>
                  }
                </button>
              </div>
            </div>

            {/* RIGHT: Live output panel — same fixed height */}
            <div className={`rounded-xl shadow-lg border overflow-hidden flex flex-col ${t.card}`} style={{height: 'calc(100vh - 220px)', minHeight: '460px'}}>
              <div className={`px-5 py-3.5 border-b flex-shrink-0 flex items-center justify-between ${t.cardHeader}`}>
                <div>
                  <h2 className={`text-base font-bold ${t.title}`}>Output</h2>
                  <p className={`text-xs mt-0.5 ${t.subtitle}`}>Live progress and results appear here</p>
                </div>
                {lastCreatedTask && (
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(lastCreatedTask.status)}`}>
                      {getStatusIcon(lastCreatedTask.status)}<span>{lastCreatedTask.status}</span>
                    </div>
                    {lastCreatedTask.actualDuration && (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${t.duration}`}>
                        <Zap className="w-3 h-3" />{lastCreatedTask.actualDuration}ms
                      </div>
                    )}
                    <button onClick={() => { setLastCreatedTask(null); setNewTask({ prompt: '', type: 'implementation', priority: 'medium', useCollaboration: false }); }} className={`text-xs px-2 py-1 rounded transition-colors ${dark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>Clear</button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {/* Idle */}
                {!streamingTaskId && !lastCreatedTask && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border ${t.idle}`}>
                      <Brain className={`w-7 h-7 ${dark ? 'text-blue-400' : 'text-blue-300'}`} />
                    </div>
                    <p className={`text-sm font-medium ${t.subtitle}`}>Waiting for a task</p>
                    <p className={`text-xs mt-1 ${dark ? 'text-gray-600' : 'text-gray-300'}`}>Progress and results will appear here</p>
                  </div>
                )}

                {/* Live terminal */}
                {streamingTaskId && (
                  <TaskProgressTerminal taskId={streamingTaskId} token={token} onComplete={handleStreamComplete} />
                )}

                {/* Result */}
                {lastCreatedTask && !streamingTaskId && (
                  <div ref={resultRef} className="flex flex-col gap-3">
                    {lastCreatedTask.assignedAgent && (
                      <div className={`flex items-center gap-2 text-xs ${t.metaText}`}>
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        Handled by <span className={`font-semibold ${t.title}`}>{agents.find(a => a.id === lastCreatedTask.assignedAgent)?.name || lastCreatedTask.assignedAgent}</span>
                      </div>
                    )}
                    {lastCreatedTask.output && (
                      <div className={`rounded-lg border overflow-hidden ${t.resultBox}`}>
                        <div className={`flex items-center gap-2 px-4 py-2 border-b ${t.resultHead}`}>
                          <CheckCircle className="w-4 h-4 text-green-500" /><span className={`text-sm font-semibold ${dark ? 'text-green-300' : 'text-green-800'}`}>Result</span>
                        </div>
                        <div className={`p-4 text-sm whitespace-pre-wrap leading-relaxed ${t.resultBody}`}>{formatOutput(lastCreatedTask.output)}</div>
                      </div>
                    )}
                    {lastCreatedTask.error && (
                      <div className={`rounded-lg border overflow-hidden ${dark ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'}`}>
                        <div className={`flex items-center gap-2 px-4 py-2 border-b ${dark ? 'border-red-900' : 'border-red-200'}`}><XCircle className="w-4 h-4 text-red-400" /><span className={`text-sm font-semibold ${dark ? 'text-red-300' : 'text-red-700'}`}>Error</span></div>
                        <div className={`p-4 text-sm whitespace-pre-wrap ${dark ? 'text-red-300' : 'text-red-700'}`}>{lastCreatedTask.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-lg font-bold ${t.title}`}>All Tasks</h2>
              <button onClick={fetchTasks} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /><span>Refresh</span></button>
            </div>
            {tasks.length === 0 ? (
              <div className={`rounded-xl shadow-lg p-12 text-center border ${t.card}`}><Code className={`w-14 h-14 mx-auto mb-4 ${t.subtitle}`} /><p className={t.subtitle}>No tasks yet. Create your first task!</p></div>
            ) : (
              tasks.map((task) => {
                const isExpanded = expandedTasks.has(task.id);
                return (
                  <div key={task.id} className={`rounded-xl shadow-lg p-5 transition-shadow border ${t.taskCard}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}>{getStatusIcon(task.status)}<span>{task.status}</span></div>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                          <span className={`text-xs ${t.metaText}`}>{task.type}</span>
                          {task.assignedAgent && <span className={`text-xs font-medium px-2 py-0.5 rounded ${dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>{agents.find(a => a.id === task.assignedAgent)?.name || task.assignedAgent}</span>}
                        </div>
                        <h3 className={`text-base font-semibold mb-1 ${t.title}`}>{task.title}</h3>
                        <p className={`text-sm mb-2 ${t.metaText}`}>{task.description}</p>
                        {task.output && !isExpanded && (<button onClick={() => toggleTaskExpansion(task.id)} className={`mt-2 w-full rounded-lg p-3 transition-all flex items-center justify-between border ${dark ? 'bg-green-950 border-green-900 hover:bg-green-900' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100'}`}><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className={`text-sm font-semibold ${dark ? 'text-green-300' : 'text-green-800'}`}>View Result</span><ChevronDown className="w-4 h-4 text-green-500" /></div><span className="text-xs text-green-500">Click to expand</span></button>)}
                        {task.output && isExpanded && (<div className={`rounded-lg p-4 mt-2 border ${dark ? 'bg-green-950 border-green-900' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className={`text-sm font-semibold ${dark ? 'text-green-300' : 'text-green-800'}`}>Result</span></div><button onClick={() => toggleTaskExpansion(task.id)} className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${dark ? 'text-green-400 hover:bg-green-900' : 'text-green-600 hover:bg-green-100'}`}><span>Hide</span><ChevronUp className="w-3.5 h-3.5" /></button></div><div className={`text-sm whitespace-pre-wrap rounded-lg p-3 max-h-72 overflow-y-auto ${dark ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-700 border border-green-100'}`}>{formatOutput(task.output)}</div></div>)}
                        {task.error && (<div className={`rounded-lg p-3 mt-2 border ${dark ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'}`}><div className="flex items-center gap-2 mb-1"><XCircle className="w-4 h-4 text-red-400" /><span className={`text-sm font-semibold ${dark ? 'text-red-300' : 'text-red-800'}`}>Error</span></div><p className={`text-sm whitespace-pre-wrap ${dark ? 'text-red-300' : 'text-red-700'}`}>{task.error}</p></div>)}
                      </div>
                      <div className={`text-right text-xs ml-4 shrink-0 ${t.metaText}`}>
                        {task.actualDuration && (<div className={`flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded ${t.duration}`}><Zap className="w-3 h-3" /><span className="font-medium">{task.actualDuration}ms</span></div>)}
                        <div>{new Date(task.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── AGENTS TAB ── */}
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {agents.map((agent) => (
              <div key={agent.id} className={`rounded-xl shadow-lg p-5 border transition-shadow ${t.agentCard} ${dark ? 'border-gray-800' : 'border-gray-100 hover:shadow-xl'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"><Brain className="w-5 h-5 text-white" /></div>
                    <div><h3 className={`text-base font-bold ${t.title}`}>{agent.name}</h3><p className={`text-xs ${t.subtitle}`}>{agent.provider}</p></div>
                  </div>
                  <div className="flex items-center space-x-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-xs text-green-500 font-medium">{agent.status.state}</span></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className={t.metaText}>Tasks Completed</span><span className={`font-medium ${t.title}`}>{agent.status.totalTasksCompleted}</span></div>
                  <div className="flex justify-between text-sm"><span className={t.metaText}>Success Rate</span><span className="font-medium text-green-500">{Math.round(agent.status.successRate)}%</span></div>
                  <div className="flex justify-between text-sm"><span className={t.metaText}>Avg Response Time</span><span className="font-medium text-blue-500">{Math.round(agent.status.averageResponseTime)}ms</span></div>
                </div>
                <div>
                  <h4 className={`text-xs font-semibold mb-2 ${t.label}`}>Capabilities</h4>
                  <div className="flex flex-wrap gap-2">{agent.capabilities.slice(0, 4).map((cap, idx) => (<span key={idx} className={`px-2 py-0.5 text-xs rounded-full font-medium ${dark ? 'bg-blue-950 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>{cap.name}</span>))}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}




// import React, { useState, useEffect } from 'react';
// import { Send, Activity, CheckCircle, XCircle, Clock, Zap, Brain, Code, Users, Moon, Sun } from 'lucide-react';

// const API_BASE = 'http://localhost:3000/api';

// export default function MultiAgentDashboard() {
//   const [agents, setAgents] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [darkMode, setDarkMode] = useState(false);
//   const [newTask, setNewTask] = useState({
//     prompt: '',
//     type: 'implementation',
//     priority: 'medium',
//     useCollaboration: false
//   });
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('create');

//   useEffect(() => {
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme === 'dark') setDarkMode(true);
    
//     fetchAgents();
//     fetchStats();
//     fetchTasks();
//     const interval = setInterval(() => {
//       fetchStats();
//       fetchTasks();
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   const toggleDarkMode = () => {
//     setDarkMode(!darkMode);
//     localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
//   };

//   const fetchAgents = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/agents`);
//       const data = await res.json();
//       setAgents(data.agents || []);
//     } catch (err) {
//       console.error('Failed to fetch agents:', err);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/stats`);
//       const data = await res.json();
//       setStats(data.stats || null);
//     } catch (err) {
//       console.error('Failed to fetch stats:', err);
//     }
//   };

//   const fetchTasks = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/tasks`);
//       const data = await res.json();
//       setTasks(data.tasks || []);
//     } catch (err) {
//       console.error('Failed to fetch tasks:', err);
//     }
//   };

//   const createTask = async () => {
//     if (!newTask.prompt.trim()) return;
    
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/tasks`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(newTask)
//       });
      
//       const data = await res.json();
      
//       if (data.success) {
//         setTasks([data.task, ...tasks]);
//         setNewTask({ prompt: '', type: 'implementation', priority: 'medium', useCollaboration: false });
//         setActiveTab('tasks');
//         fetchStats();
//       }
//     } catch (err) {
//       console.error('Failed to create task:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusColor = (status) => {
//     if (darkMode) {
//       const colors = {
//         completed: 'text-green-400 bg-green-900/30',
//         failed: 'text-red-400 bg-red-900/30',
//         in_progress: 'text-blue-400 bg-blue-900/30',
//         pending: 'text-yellow-400 bg-yellow-900/30'
//       };
//       return colors[status] || 'text-gray-400 bg-gray-800/30';
//     }
//     const colors = {
//       completed: 'text-green-600 bg-green-50',
//       failed: 'text-red-600 bg-red-50',
//       in_progress: 'text-blue-600 bg-blue-50',
//       pending: 'text-yellow-600 bg-yellow-50'
//     };
//     return colors[status] || 'text-gray-600 bg-gray-50';
//   };

//   const getStatusIcon = (status) => {
//     const icons = {
//       completed: <CheckCircle className="w-4 h-4" />,
//       failed: <XCircle className="w-4 h-4" />,
//       in_progress: <Activity className="w-4 h-4 animate-spin" />,
//       pending: <Clock className="w-4 h-4" />
//     };
//     return icons[status] || <Clock className="w-4 h-4" />;
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       critical: 'bg-red-500',
//       high: 'bg-orange-500',
//       medium: 'bg-yellow-500',
//       low: 'bg-green-500'
//     };
//     return colors[priority] || 'bg-gray-500';
//   };

//   return (
//     <div className={`min-h-screen transition-colors duration-300 ${
//       darkMode 
//         ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
//         : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
//     }`}>
//       <header className={`border-b shadow-sm transition-colors duration-300 ${
//         darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
//       }`}>
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
//                 <Brain className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                   Multi-Agent Orchestrator
//                 </h1>
//                 <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                   AI-Powered Task Collaboration System
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-6">
//               {stats && (
//                 <div className="flex space-x-6">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-blue-500">{stats.total}</div>
//                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
//                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Done</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-orange-500">{stats.running}</div>
//                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active</div>
//                   </div>
//                 </div>
//               )}
//               <button
//                 onClick={toggleDarkMode}
//                 className={`p-2 rounded-lg transition-colors ${
//                   darkMode 
//                     ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
//                     : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
//                 }`}
//                 title={darkMode ? 'Light Mode' : 'Dark Mode'}
//               >
//                 {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-2">
//               <Users className="w-5 h-5" />
//               <span className="font-medium">{agents.length} Active Agents</span>
//             </div>
//             <div className="flex space-x-4">
//               {agents.map(agent => (
//                 <div key={agent.id} className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
//                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                   <span className="text-sm font-medium">{agent.name.split(' ')[0]}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <div className={`flex space-x-1 mb-6 p-1 rounded-lg transition-colors ${
//           darkMode ? 'bg-gray-800' : 'bg-gray-100'
//         }`}>
//           {['create', 'tasks', 'agents'].map(tab => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
//                 activeTab === tab
//                   ? darkMode
//                     ? 'bg-gray-700 text-blue-400 shadow-sm'
//                     : 'bg-white text-blue-600 shadow-sm'
//                   : darkMode
//                     ? 'text-gray-400 hover:text-gray-200'
//                     : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               {tab === 'create' && <Send className="w-4 h-4 inline mr-2" />}
//               {tab === 'tasks' && <Activity className="w-4 h-4 inline mr-2" />}
//               {tab === 'agents' && <Users className="w-4 h-4 inline mr-2" />}
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//               {tab === 'tasks' && ` (${tasks.length})`}
//               {tab === 'agents' && ` (${agents.length})`}
//             </button>
//           ))}
//         </div>

//         {activeTab === 'create' && (
//           <div className={`rounded-xl shadow-lg p-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
//             <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Task</h2>
//             <div className="space-y-6">
//               <div>
//                 <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                   Task Description
//                 </label>
//                 <textarea
//                   value={newTask.prompt}
//                   onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
//                   className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 ${
//                     darkMode 
//                       ? 'bg-gray-700 border-gray-600 text-white' 
//                       : 'border border-gray-300'
//                   }`}
//                   rows="4"
//                   placeholder="Describe your task..."
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
//                   <select
//                     value={newTask.type}
//                     onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
//                     className={`w-full px-4 py-3 rounded-lg ${
//                       darkMode ? 'bg-gray-700 text-white' : 'border border-gray-300'
//                     }`}
//                   >
//                     <option value="implementation">Implementation</option>
//                     <option value="design">Design</option>
//                     <option value="test">Test/Review</option>
//                     <option value="planning">Planning</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
//                   <select
//                     value={newTask.priority}
//                     onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
//                     className={`w-full px-4 py-3 rounded-lg ${
//                       darkMode ? 'bg-gray-700 text-white' : 'border border-gray-300'
//                     }`}
//                   >
//                     <option value="low">Low</option>
//                     <option value="medium">Medium</option>
//                     <option value="high">High</option>
//                     <option value="critical">Critical</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="collab"
//                   checked={newTask.useCollaboration}
//                   onChange={(e) => setNewTask({ ...newTask, useCollaboration: e.target.checked })}
//                   className="w-4 h-4"
//                 />
//                 <label htmlFor="collab" className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                   🤝 Multi-agent collaboration
//                 </label>
//               </div>

//               <button
//                 onClick={createTask}
//                 disabled={loading || !newTask.prompt.trim()}
//                 className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
//               >
//                 {loading ? (
//                   <>
//                     <Activity className="w-5 h-5 animate-spin" />
//                     <span>Processing...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Send className="w-5 h-5" />
//                     <span>Create Task</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         )}

//         {activeTab === 'tasks' && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Tasks</h2>
//               <button
//                 onClick={fetchTasks}
//                 className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Refresh
//               </button>
//             </div>
            
//             {tasks.length === 0 ? (
//               <div className={`rounded-xl shadow-lg p-12 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
//                 <Code className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
//                 <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No tasks yet. Create your first task!</p>
//               </div>
//             ) : (
//               tasks.map((task) => (
//                 <div key={task.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${
//                   darkMode ? 'bg-gray-800' : 'bg-white'
//                 }`}>
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <div className="flex items-center space-x-3 mb-2">
//                         <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(task.status)}`}>
//                           {getStatusIcon(task.status)}
//                           <span>{task.status}</span>
//                         </div>
//                         <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
//                         <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{task.type}</span>
//                       </div>
//                       <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                         {task.title}
//                       </h3>
//                       <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
//                         {task.description}
//                       </p>
                      
//                       {task.output && (
//                         <div className={`rounded-lg p-4 mt-3 ${
//                           darkMode ? 'bg-green-900/20' : 'bg-green-50'
//                         }`}>
//                           <div className="flex items-center space-x-2 mb-2">
//                             <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
//                             <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Result</span>
//                           </div>
//                           <p className={`text-sm line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
//                             {typeof task.output === 'string' ? task.output : task.output.content}
//                           </p>
//                         </div>
//                       )}
                      
//                       {task.error && (
//                         <div className={`rounded-lg p-4 mt-3 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
//                           <div className="flex items-center space-x-2 mb-2">
//                             <XCircle className={`w-4 h-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
//                             <span className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Error</span>
//                           </div>
//                           <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{task.error}</p>
//                         </div>
//                       )}
//                     </div>
                    
//                     <div className={`text-right text-xs ml-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
//                       {task.actualDuration && (
//                         <div className="flex items-center space-x-1 mb-1">
//                           <Zap className="w-3 h-3" />
//                           <span>{task.actualDuration}ms</span>
//                         </div>
//                       )}
//                       <div>{new Date(task.createdAt).toLocaleString()}</div>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}

//         {activeTab === 'agents' && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {agents.map((agent) => (
//               <div key={agent.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${
//                 darkMode ? 'bg-gray-800' : 'bg-white'
//               }`}>
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
//                       <Brain className="w-6 h-6 text-white" />
//                     </div>
//                     <div>
//                       <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agent.name}</h3>
//                       <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{agent.provider}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                     <span className="text-xs text-green-500 font-medium">{agent.status.state}</span>
//                   </div>
//                 </div>
                
//                 <div className="space-y-2 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tasks Completed</span>
//                     <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                       {agent.status.totalTasksCompleted}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Success Rate</span>
//                     <span className="font-medium text-green-500">{Math.round(agent.status.successRate)}%</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg Response</span>
//                     <span className="font-medium text-blue-500">{Math.round(agent.status.averageResponseTime)}ms</span>
//                   </div>
//                 </div>
                
//                 <div>
//                   <h4 className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
//                     Capabilities
//                   </h4>
//                   <div className="flex flex-wrap gap-2">
//                     {agent.capabilities.slice(0, 4).map((cap, idx) => (
//                       <span key={idx} className={`px-2 py-1 text-xs rounded-full font-medium ${
//                         darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
//                       }`}>
//                         {cap.name}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
