"use client";

import { useState, useEffect, useCallback } from 'react';
import { Layout, ListTodo, ClipboardCheck, Clock, Search, RefreshCw } from 'lucide-react';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import { Todo } from '../types';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [configDetails, setConfigDetails] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const init = async () => {
      await checkConfig();
      await fetchTodos();
    };
    init();
    
    const interval = setInterval(() => {
      checkConfig();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchWithTimeout = async (url: string, options: any = {}) => {
    const { timeout = 10000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        ...options, 
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const checkConfig = async () => {
    try {
      const res = await fetchWithTimeout('/api/config-status?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setIsDemoMode(data.isDemoMode);
        setConfigDetails(data);
      } else {
        setIsDemoMode(true);
      }
    } catch (err) {
      setIsDemoMode(true);
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithTimeout('/api/todos?t=' + Date.now());
      
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let msg = data.error || data.details || `Server error (${res.status})`;
        
        if (res.status === 404 && data.sql) {
            msg = "Table 'todos' missing! Please create it in your Supabase SQL Editor.";
        } else if (res.status === 401) {
            setIsDemoMode(true);
            const detailMsg = data.details || data.detail || data.error || "Invalid API Key";
            msg = "Authentication failed: " + detailMsg;
        }
        
        throw new Error(msg);
      }
      
      if (Array.isArray(data)) {
        setTodos(data);
      }
    } catch (err: any) {
      // Only log severe unexpected errors, otherwise just show in UI
      if (!err.message?.includes('Authentication failed') && !err.message?.includes('Table')) {
        console.error('[CORE] Fetch error:', err);
      }
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (title: string) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to add todo');
      const newTodo = await res.json();
      setTodos([newTodo, ...todos]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      const updatedTodo = await res.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const editTodo = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to edit todo');
      const updatedTodo = await res.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete todo');
      setTodos(todos.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const completedCount = Array.isArray(todos) ? todos.filter(t => t.completed).length : 0;

  if (!isMounted) return <div className="min-h-screen bg-gray-100" />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8" id="app-root">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <Layout className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <span className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-500" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ListTodo size={20} className="text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total</span>
            </div>
            <span className="text-3xl font-light">{todos.length}</span>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <ClipboardCheck size={20} className="text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Done</span>
            </div>
            <span className="text-3xl font-light">{completedCount}</span>
          </div>
        </section>

        <main>
          <div className="mb-8">
            <TodoForm onAdd={addTodo} loading={loading} />
          </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Your Tasks</h2>
                {loading && <span className="text-[10px] text-blue-500 animate-pulse">Syncing...</span>}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 mb-4">
                  {error}
                </div>
              )}

              <TodoList
                todos={todos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
              />
            </div>
        </main>

        <footer className="mt-20 pt-8 border-t border-gray-100 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-[10px] font-bold uppercase tracking-wider">
                <div className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                <span className={isDemoMode ? 'text-amber-600' : 'text-green-600'}>
                  {isDemoMode ? 'Running in Demo Mode' : 'Connected to Supabase'}
                </span>
              </div>
              <button 
                onClick={() => { checkConfig(); fetchTodos(); }}
                className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline px-2 py-1"
              >
                Refresh Connection
              </button>
            </div>

            {isDemoMode && configDetails && (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 max-w-md shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                    <Search size={18} />
                  </div>
                  <p className="text-sm font-bold text-amber-900 uppercase tracking-tight">Supabase Connection Guide</p>
                </div>
                
                <div className="space-y-4">
                  {configDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-amber-800 uppercase">Project URL</p>
                        <div className={`px-2 py-1 rounded border text-[10px] font-mono truncate ${configDetails.urlSet ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {configDetails.urlSet ? '✓ Configured' : '✗ Missing'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-amber-800 uppercase">Key Status</p>
                        <div className={`px-2 py-1 rounded border text-[10px] font-mono truncate ${configDetails.keySet ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {configDetails.keySet ? `✓ ${configDetails.keyType}` : '✗ Missing/Invalid'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white/50 p-3 rounded-xl border border-amber-100 space-y-2">
                    <p className="text-[11px] font-semibold text-amber-900">How to fix this:</p>
                    <ol className="text-[10px] text-amber-800 space-y-2 list-decimal ml-4 leading-relaxed">
                      <li>Open your <strong>Supabase Dashboard</strong></li>
                      <li>Go to <strong>Project Settings</strong> (gear icon) → <strong>API</strong></li>
                      <li>Copy the <strong>Project URL</strong></li>
                      <li>Copy the <strong>anon (public)</strong> or <strong>service_role</strong> key. 
                        <br/><span className="text-[9px] text-amber-600 italic">Note: It MUST start with <strong>eyJ...</strong></span>
                      </li>
                      <li>Update them in the <strong>Secrets</strong> panel in AI Studio.</li>
                    </ol>
                  </div>

                  <div className="text-[10px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100 flex items-start gap-2">
                    <div className="mt-0.5">⚠️</div>
                    <p>It looks like you might have entered your <strong>Database Password</strong> or <strong>Project ID</strong> by mistake. These won't work as API keys.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Built with Next.js & Supabase
          </p>
        </footer>
      </div>
    </div>
  );
}
