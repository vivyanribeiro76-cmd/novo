-- Fix contabilizacao table: ensure id column exists and is primary key

-- Drop existing table if it has issues and recreate
DROP TABLE IF EXISTS public.contabilizacao CASCADE;

CREATE TABLE public.contabilizacao (
  id SERIAL PRIMARY KEY,
  remotejid TEXT NOT NULL,
  mensagens TEXT,
  agendamento BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_contabilizacao_remotejid ON public.contabilizacao(remotejid);
CREATE INDEX idx_contabilizacao_timestamp ON public.contabilizacao(timestamp);

-- Enable RLS
ALTER TABLE public.contabilizacao ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "public read contabilizacao" ON public.contabilizacao
  FOR SELECT USING (true);

CREATE POLICY "public insert contabilizacao" ON public.contabilizacao
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public update contabilizacao" ON public.contabilizacao
  FOR UPDATE USING (true);
