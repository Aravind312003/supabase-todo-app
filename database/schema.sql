-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security (RLS)
-- For this simple app, we'll allow public access if the project doesn't have Auth yet
-- Note: In a production app, you'd restrict this to authenticated users
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now
CREATE POLICY "Allow public access" ON todos
  FOR ALL USING (true) WITH CHECK (true);
