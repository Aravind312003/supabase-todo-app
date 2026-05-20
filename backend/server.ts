import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase with more robust error handling
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE || 
  process.env.SUPABASE_ANON_KEY || 
  ''
).trim();

// Detect if we are using placeholder values or if values are missing
const isPlaceHolder = (val: string) => {
  if (!val) return true;
  const v = val.toLowerCase();
  return v.includes('your-') || v === 'my_supabase_url' || v.includes('placeholder') || v.includes('your_anon_key');
};

// Check if key is a valid JWT (all Supabase API keys are JWTs starting with eyJ)
const isValidJwt = (key: string) => key.startsWith('eyJ') && key.split('.').length === 3;

let supabase: any = null;
let isDemoMode = false;
let configError: string | null = null;

// Mock data for demo mode
let mockTodos = [
  { id: '1', title: 'Connect Supabase to save real data', completed: false, created_at: new Date().toISOString() },
  { id: '2', title: 'Add your first task above', completed: true, created_at: new Date().toISOString() },
];

const mask = (s: string) => s.length > 8 ? `${s.substring(0, 4)}...${s.substring(s.length - 4)}` : '****';

console.log('--- Supabase Config Check ---');
console.log('URL defined:', !!supabaseUrl, supabaseUrl ? `(${mask(supabaseUrl)})` : '');
console.log('Key defined:', !!supabaseKey, supabaseKey ? `(${mask(supabaseKey)})` : '');

if (isPlaceHolder(supabaseUrl) || isPlaceHolder(supabaseKey)) {
  console.warn('Supabase credentials missing or placeholders detected.');
  isDemoMode = true;
  configError = "Configuration in Secrets panel required.";
} else if (!isValidJwt(supabaseKey)) {
  console.error('CRITICAL: Supabase Key does not appear to be a valid JWT. It must start with "eyJ".');
  isDemoMode = true;
  configError = `Invalid key format: Starts with "${supabaseKey.substring(0, 5)}...". Expected a long "anon" or "service_role" JWT starting with "eyJ".`;
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    isDemoMode = true;
    configError = "Client initialization failed.";
  }
}

app.use(express.json());

// API Routes
app.get("/api/config-status", (req, res) => {
  res.json({
    supabaseConfigured: !isDemoMode && !!supabase,
    isDemoMode,
    urlSet: !isPlaceHolder(supabaseUrl),
    keySet: !isPlaceHolder(supabaseKey),
    url: isDemoMode ? 'Demo Server' : supabaseUrl,
    reason: configError,
    keyPrefix: supabaseKey ? supabaseKey.substring(0, 3) : null,
    keyLength: supabaseKey ? supabaseKey.length : 0,
    error: isDemoMode ? `Running in Demo Mode: ${configError || 'Configuration required'}.` : null
  });
});

app.get("/api/todos", async (req, res) => {
  if (isDemoMode) {
    return res.json(mockTodos);
  }

  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If we get an auth error, we might have an invalid API key
      if (error.code === 'PGRST301' || error.message?.includes('API key') || error.status === 401) {
        console.error('Dynamic fallback: Invalid Supabase API key detected during request.');
        return res.status(401).json({ 
          error: 'Invalid Supabase API key. Please check your Secrets in the panel.',
          isInvalidKey: true 
        });
      }
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    console.error('Supabase fetch error:', error);
    res.status(500).json({ error: error.message || 'Unknown database error' });
  }
});

app.post("/api/todos", async (req, res) => {
  const { title } = req.body;

  if (isDemoMode) {
    const newTodo = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
      created_at: new Date().toISOString()
    };
    mockTodos = [newTodo, ...mockTodos];
    return res.status(201).json(newTodo);
  }

  try {
    const { data, error } = await supabase
      .from('todos')
      .insert([{ title, completed: false }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isDemoMode) {
    mockTodos = mockTodos.map(t => t.id === id ? { ...t, ...updates } : t);
    return res.json(mockTodos.find(t => t.id === id));
  }

  try {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;

  if (isDemoMode) {
    mockTodos = mockTodos.filter(t => t.id !== id);
    return res.status(204).send();
  }

  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware setup
async function setupVite() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
      root: path.join(process.cwd(), 'frontend'),
      configFile: path.join(process.cwd(), 'frontend/vite.config.ts')
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().catch(err => {
  console.error("Failed to start Vite middleware:", err);
});
