CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount TEXT NOT NULL,
  tip_amount TEXT DEFAULT '0',
  total_amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  reference TEXT,
  metadata JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
); 