import React, { useState, useEffect } from 'react';
import { Send, Activity, CheckCircle, XCircle, Clock, Zap, Brain, Code, Users, ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';

const API_BASE =  'https://loomiq-production.up.railway.app/api';

// 'loomiq-production.up.railway.app/api' ||

export default function MultiAgentDashboard() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [newTask, setNewTask] = useState({
    prompt: '',
    type: 'implementation',
    priority: 'medium',
    useCollaboration: false
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [lastCreatedTask, setLastCreatedTask] = useState(null);
  const resultRef = React.useRef(null);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    fetchAgents();
    fetchStats();
    fetchTasks();
    const interval = setInterval(() => {
      fetchStats();
      fetchTasks();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to result when it appears
    if (lastCreatedTask && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' // Changed from 'start' to 'center' for better visibility
        });
        // Also scroll down a bit more to ensure result is visible
        window.scrollBy({ top: 100, behavior: 'smooth' });
      }, 200); // Increased delay to 200ms
    }
  }, [lastCreatedTask]);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const createTask = async () => {
    if (!newTask.prompt.trim()) return;
    
    setLoading(true);
    setLastCreatedTask(null); // Clear previous result
    
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setTasks([data.task, ...tasks]);
        setLastCreatedTask(data.task); // Store for display
        // Don't clear the form immediately, let user see result
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-50',
      failed: 'text-red-600 bg-red-50',
      in_progress: 'text-blue-600 bg-blue-50',
      pending: 'text-yellow-600 bg-yellow-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      in_progress: <Activity className="w-4 h-4 animate-spin" />,
      pending: <Clock className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const formatOutput = (output) => {
    if (!output) return 'No output available';
    
    console.log('Formatting output:', output); // Debug log
    
    // If output is a string, return it
    if (typeof output === 'string') {
      return output;
    }
    
    // Handle collaboration result with nested results
    if (output.results) {
      // Check if it has combinedOutput
      if (output.results.combinedOutput && output.results.combinedOutput.content) {
        const combined = output.results.combinedOutput;
        return (
          <div className="space-y-4">
            <div className={`font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              🤝 Collaboration Results ({output.results.metadata?.agentCount || 0} agents worked together)
            </div>
            
            {/* Show combined output */}
            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-green-100'}`}>
              <div className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {combined.content}
              </div>
            </div>
            
            {/* Show metadata */}
            {output.results.metadata && (
              <div className={`text-xs pt-2 border-t ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-400 border-gray-200'}`}>
                ⚡ Total Duration: {output.results.metadata.totalDuration}ms | 
                👥 Agents: {output.results.metadata.agentCount} | 
                📊 Model: {combined.metadata?.model || 'Unknown'}
              </div>
            )}
          </div>
        );
      }
      
      // If results is an array of step objects
      if (Array.isArray(output.results)) {
        return (
          <div className="space-y-4">
            <div className={`font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              🤝 Collaboration Steps ({output.results.length} steps):
            </div>
            {output.results.map((step, idx) => {
              // Extract content from step.output.content
              const content = step.output?.content || step.content || JSON.stringify(step, null, 2);
              const agentName = step.agentId || `Agent ${idx + 1}`;
              const duration = step.duration || 0;
              
              return (
                <div key={idx} className={`border-l-4 border-blue-500 pl-4 py-3 rounded ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      Step {idx + 1}: {agentName}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      ⚡ {duration}ms
                    </div>
                  </div>
                  <div className={`text-sm mt-2 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                  </div>
                  {step.output?.metadata && (
                    <div className={`text-xs mt-2 pt-2 border-t ${darkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200'}`}>
                      📊 {step.output.metadata.model} | 
                      🔢 {step.output.metadata.tokensUsed} tokens
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
    }
    
    // If output has content property (single agent result)
    if (output.content) {
      if (typeof output.content === 'string') {
        return output.content;
      }
      return JSON.stringify(output.content, null, 2);
    }
    
    // If output is collaboration results (old format)
    if (output.collaborationResults && Array.isArray(output.collaborationResults)) {
      return (
        <div className="space-y-4">
          <div className={`font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            🤝 Collaboration Results ({output.collaborationResults.length} agents):
          </div>
          {output.collaborationResults.map((result, idx) => (
            <div key={idx} className={`border-l-4 border-blue-500 pl-4 py-2 ${darkMode ? 'bg-gray-900' : ''}`}>
              <div className={`font-medium mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Agent {idx + 1}: {result.agentName || 'Unknown'}
              </div>
              <div className={`text-sm mt-1 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {typeof result.result === 'string' 
                  ? result.result 
                  : result.result?.content 
                  || result.output?.content
                  || result.output
                  || JSON.stringify(result, null, 2)}
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                ⚡ {result.duration || 0}ms
              </div>
            </div>
          ))}
          {output.synthesizedOutput && (
            <div className={`border-t-2 pt-3 mt-3 ${darkMode ? 'border-gray-700' : 'border-green-200'}`}>
              <div className={`font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                ✨ Final Synthesized Result:
              </div>
              <div className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {output.synthesizedOutput}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // If it's a result object with metadata
    if (output.metadata || output.finishReason) {
      const textContent = output.content || output.text || output.result || 'No text content';
      return (
        <div>
          <div className={`text-sm mb-2 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {typeof textContent === 'string' ? textContent : JSON.stringify(textContent, null, 2)}
          </div>
          {output.metadata && (
            <div className={`text-xs mt-2 pt-2 border-t ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-400 border-gray-200'}`}>
              📊 Model: {output.metadata.model || 'Unknown'} | 
              Tokens: {output.metadata.tokensUsed || 0} | 
              Finish: {output.finishReason || 'complete'}
            </div>
          )}
        </div>
      );
    }
    
    // Fallback: safely stringify any object
    try {
      return <pre className={`text-xs overflow-x-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{JSON.stringify(output, null, 2)}</pre>;
    } catch (e) {
      return 'Unable to display output (invalid format)';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MindForge</h1>
                <p className="text-sm text-gray-500">AI-Powered Task Collaboration System</p>
              </div>
            </div>
            {stats && (
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-gray-500">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.running}</div>
                  <div className="text-xs text-gray-500">Running</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">{agents.length} Active Agents</span>
            </div>
            <div className="flex space-x-4">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{agent.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {['create', 'tasks', 'agents'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'create' && <Send className="w-4 h-4 inline mr-2" />}
              {tab === 'tasks' && <Activity className="w-4 h-4 inline mr-2" />}
              {tab === 'agents' && <Users className="w-4 h-4 inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'tasks' && ` (${tasks.length})`}
              {tab === 'agents' && ` (${agents.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'create' && (
          <div className="space-y-6">
            <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Task</h2>
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Task Description</label>
                  <textarea
                    value={newTask.prompt}
                    onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="4"
                    placeholder="Describe your task... (e.g., Write a Python function to calculate fibonacci numbers)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Task Type</label>
                    <select
                      value={newTask.type}
                      onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="implementation">Implementation</option>
                      <option value="design">Design</option>
                      <option value="test">Test/Review</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className={`flex items-center space-x-2 p-4 rounded-lg border ${
                  darkMode 
                    ? 'bg-blue-900/20 border-blue-800' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <input
                    type="checkbox"
                    id="collab"
                    checked={newTask.useCollaboration}
                    onChange={(e) => setNewTask({ ...newTask, useCollaboration: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="collab" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🤝 Enable multi-agent collaboration (2 AI agents work together!)
                  </label>
                </div>

                <button
                  onClick={createTask}
                  disabled={loading || !newTask.prompt.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Activity className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Create Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result appears here - with dark mode support */}
            {lastCreatedTask && (
              <div ref={resultRef} className={`rounded-xl shadow-lg p-6 animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(lastCreatedTask.status)}`}>
                      {getStatusIcon(lastCreatedTask.status)}
                      <span>{lastCreatedTask.status}</span>
                    </div>
                    {lastCreatedTask.assignedAgent && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                        {agents.find(a => a.id === lastCreatedTask.assignedAgent)?.name || lastCreatedTask.assignedAgent}
                      </span>
                    )}
                    {lastCreatedTask.actualDuration && (
                      <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded">
                        <Zap className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">{lastCreatedTask.actualDuration}ms</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setLastCreatedTask(null);
                      setNewTask({ prompt: '', type: 'implementation', priority: 'medium', useCollaboration: false });
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  >
                    <span>New Task</span>
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{lastCreatedTask.title}</h3>
                
                {lastCreatedTask.output && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mt-3 border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-base font-semibold text-green-800">Result</span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-4 border border-green-100 max-h-96 overflow-y-auto">
                      {formatOutput(lastCreatedTask.output)}
                    </div>
                  </div>
                )}
                
                {lastCreatedTask.error && (
                  <div className="bg-red-50 rounded-lg p-4 mt-3 border border-red-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-800">Error</span>
                    </div>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">{lastCreatedTask.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">All Tasks</h2>
              <button
                onClick={fetchTasks}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
            
            {tasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tasks yet. Create your first task!</p>
              </div>
            ) : (
              tasks.map((task) => {
                const isExpanded = expandedTasks.has(task.id);
                return (
                  <div key={task.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            <span>{task.status}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                          <span className="text-xs text-gray-500">{task.type}</span>
                          {task.assignedAgent && (
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                              {agents.find(a => a.id === task.assignedAgent)?.name || task.assignedAgent}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        
                        {/* Show result button or result content */}
                        {task.output && !isExpanded && (
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="mt-3 w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:from-green-100 hover:to-emerald-100 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-800">View Result</span>
                              <ChevronDown className="w-4 h-4 text-green-600 group-hover:translate-y-0.5 transition-transform" />
                            </div>
                            <span className="text-xs text-green-600">Click to expand</span>
                          </button>
                        )}
                        
                        {task.output && isExpanded && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mt-3 border border-green-200 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-base font-semibold text-green-800">Result</span>
                              </div>
                              <button
                                onClick={() => toggleTaskExpansion(task.id)}
                                className="text-sm text-green-600 hover:text-green-800 flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-green-100 transition-colors"
                              >
                                <span>Hide</span>
                                <ChevronUp className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-4 border border-green-100 max-h-96 overflow-y-auto">
                              {formatOutput(task.output)}
                            </div>
                          </div>
                        )}
                        
                        {task.error && (
                          <div className="bg-red-50 rounded-lg p-4 mt-3 border border-red-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-semibold text-red-800">Error</span>
                            </div>
                            <p className="text-sm text-red-700 whitespace-pre-wrap">{task.error}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right text-xs text-gray-500 ml-4">
                        {task.actualDuration && (
                          <div className="flex items-center space-x-1 mb-2 bg-blue-50 px-2 py-1 rounded">
                            <Zap className="w-3 h-3 text-blue-600" />
                            <span className="font-medium text-blue-700">{task.actualDuration}ms</span>
                          </div>
                        )}
                        <div className="text-gray-400">{new Date(task.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">{agent.status.state}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tasks Completed</span>
                    <span className="font-medium text-gray-900">{agent.status.totalTasksCompleted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-medium text-green-600">{Math.round(agent.status.successRate)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Response Time</span>
                    <span className="font-medium text-blue-600">{Math.round(agent.status.averageResponseTime)}ms</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.slice(0, 4).map((cap, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                        {cap.name}
                      </span>
                    ))}
                  </div>
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