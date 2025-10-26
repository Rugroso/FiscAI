-- Crear la tabla businesses
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica del negocio
  "businessName" TEXT,
  actividad TEXT,
  
  -- Métricas financieras
  monthly_income DECIMAL(12, 2),
  monthly_expenses DECIMAL(12, 2),
  net_profit DECIMAL(12, 2),
  profit_margin DECIMAL(3, 2),
  cash_flow DECIMAL(3, 2),
  debt_ratio DECIMAL(3, 2),
  
  -- Información operativa
  business_age_years INTEGER,
  employees INTEGER,
  digitalization_score DECIMAL(3, 2),
  
  -- Métodos y formalidad
  metodos_pago TEXT,
  has_rfc BOOLEAN DEFAULT false,
  has_efirma BOOLEAN DEFAULT false,
  emite_cfdi BOOLEAN DEFAULT false,
  declara_mensual BOOLEAN DEFAULT false,
  access_to_credit BOOLEAN DEFAULT false,
  formal BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_formal ON businesses(formal);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at_trigger
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_businesses_updated_at();

-- Habilitar RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own businesses"
ON businesses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own businesses"
ON businesses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
ON businesses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
ON businesses FOR DELETE
USING (auth.uid() = user_id);
