import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Activity, Zap, Users, ChevronRight } from 'lucide-react';

const API_BASE = 'https://loomiq.onrender.com/api';

// ── Event styling map ────────────────────────────────────────────────────────
const EVENT_STYLES = {
  'connected':             { icon: '🔌', color: 'text-gray-400',   label: 'Connected'      },
  'task:assigned':         { icon: '🤖', color: 'text-blue-400',   label: 'Assigned'       },
  'collaboration:started': { icon: '🤝', color: 'text-purple-400', label: 'Collaborating'  },
  'step:started':          { icon: '▶',  color: 'text-yellow-400', label: 'Step'           },
  'step:completed':        { icon: '✓',  color: 'text-green-400',  label: 'Step done'      },
  'step:failed':           { icon: '✗',  color: 'text-red-400',    label: 'Step failed'    },
  'task:completed':        { icon: '🎉', color: 'text-green-400',  label: 'Done'           },
  'task:failed':           { icon: '💥', color: 'text-red-400',    label: 'Failed'         },
  'task:error':            { icon: '⚠',  color: 'text-red-400',    label: 'Error'          },
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaskProgressTerminal({ taskId, token, onComplete }) {
  const [lines, setLines]       = useState([]);       // log lines
  const [status, setStatus]     = useState('connecting'); // connecting | running | done | failed
  const [elapsed, setElapsed]   = useState(0);
  const bottomRef               = useRef(null);
  const startTimeRef            = useRef(Date.now());
  const timerRef                = useRef(null);
  const esRef                   = useRef(null);        // EventSource ref

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── SSE connection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!taskId) return;

    // EventSource doesn't support custom headers natively.
    // We pass the token as a query param — add support for this on the backend.
    const url = `${API_BASE}/tasks/${taskId}/stream?token=${encodeURIComponent(token)}`;
    const es   = new EventSource(url);
    esRef.current = es;

    const addLine = (event, data) => {
      const style = EVENT_STYLES[event] || { icon: '•', color: 'text-gray-400' };
      // Strip leading icon that backend already adds to message text
      const message = (data.message || '').replace(/^[\u25B6\u2713\u2717\u26A0\uFE0F\u{1F50C}\u{1F916}\u{1F91D}\u{1F389}\u{1F4A5}]\s*/u, '').trim();
      setLines(prev => [...prev, {
        id:        `${Date.now()}-${Math.random()}`,
        event,
        message,
        timestamp: data.timestamp || new Date(),
        duration:  data.duration,
        style,
      }]);
    };

    // ── Register per-event listeners ──
    const events = [
      'connected', 'task:assigned', 'collaboration:started',
      'step:started', 'step:completed', 'step:failed',
      'task:completed', 'task:failed', 'task:error'
    ];

    events.forEach(evt => {
      es.addEventListener(evt, (e) => {
        const data = JSON.parse(e.data);
        addLine(evt, data);

        if (evt === 'task:assigned' || evt === 'collaboration:started') {
          setStatus('running');
        }
        if (evt === 'task:completed') {
          setStatus('done');
          clearInterval(timerRef.current);
          es.close();
          // Small delay so user can see the "done" state before result appears
          setTimeout(() => onComplete?.(), 800);
        }
        if (evt === 'task:failed' || evt === 'task:error') {
          setStatus('failed');
          clearInterval(timerRef.current);
          es.close();
          setTimeout(() => onComplete?.(), 1500);
        }
      });
    });

    es.onerror = () => {
      addLine('task:error', { message: 'Stream connection lost', timestamp: new Date() });
      setStatus('failed');
      clearInterval(timerRef.current);
      es.close();
    };

    return () => {
      es.close();
      clearInterval(timerRef.current);
    };
  }, [taskId, token]);

  // ── Auto-scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // ── Status indicator ───────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (status === 'connecting') return (
      <span className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Connecting…
      </span>
    );
    if (status === 'running') return (
      <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">
        <Activity className="w-3 h-3 animate-spin" /> Running — {elapsed}s
      </span>
    );
    if (status === 'done') return (
      <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
        <CheckCircle className="w-3 h-3" /> Completed in {elapsed}s
      </span>
    );
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-semibold">
        <XCircle className="w-3 h-3" /> Failed after {elapsed}s
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-lg">
      {/* Terminal header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-gray-400 font-mono">task/{taskId?.slice(0, 8)}…</span>
        </div>
        <StatusBadge />
      </div>

      {/* Log lines */}
      <div className="bg-gray-950 px-4 py-3 h-64 overflow-y-auto font-mono text-xs leading-relaxed">
        {lines.length === 0 && (
          <div className="text-gray-600 flex items-center gap-2 mt-2">
            <Activity className="w-3 h-3 animate-spin" />
            Waiting for events…
          </div>
        )}

        {lines.map((line) => (
          <div
            key={line.id}
            className="flex items-start gap-2 py-0.5 animate-fade-in"
          >
            {/* Timestamp */}
            <span className="text-gray-600 shrink-0 w-20">{formatTime(line.timestamp)}</span>

            {/* Icon */}
            <span className={`shrink-0 w-4 text-center ${line.style.color}`}>
              {line.style.icon}
            </span>

            {/* Message */}
            <span className={line.style.color}>{line.message}</span>

            {/* Duration badge for completed steps */}
            {line.duration && (
              <span className="ml-auto shrink-0 flex items-center gap-0.5 text-gray-500">
                <Zap className="w-2.5 h-2.5" />{line.duration}ms
              </span>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Progress bar — fills while running */}
      {status === 'running' && (
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
            style={{ width: `${Math.min((elapsed / 60) * 100, 95)}%`, transition: 'width 1s linear' }}
          />
        </div>
      )}
      {status === 'done' && (
        <div className="h-0.5 bg-green-500" />
      )}
      {status === 'failed' && (
        <div className="h-0.5 bg-red-500" />
      )}
    </div>
  );
}