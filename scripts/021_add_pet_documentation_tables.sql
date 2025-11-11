-- Tabla para información de microchip
CREATE TABLE IF NOT EXISTS pet_microchips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  chip_number TEXT NOT NULL,
  implant_date DATE,
  chip_location TEXT,
  registry_name TEXT,
  veterinary_clinic TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para cartilla/pasaporte veterinario
CREATE TABLE IF NOT EXISTS pet_passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  passport_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_vet TEXT,
  issuing_clinic TEXT,
  document_urls TEXT[], -- Array de URLs de documentos escaneados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para vacunas
CREATE TABLE IF NOT EXISTS pet_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT, -- 'Obligatoria', 'Opcional', 'Refuerzo'
  administration_date DATE NOT NULL,
  next_dose_date DATE,
  batch_number TEXT,
  veterinary_clinic TEXT,
  label_photo_url TEXT,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para seguros
CREATE TABLE IF NOT EXISTS pet_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  insurance_company TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_type TEXT,
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  claims_phone TEXT,
  customer_service_phone TEXT,
  customer_service_email TEXT,
  policy_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para siniestros del seguro
CREATE TABLE IF NOT EXISTS pet_insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_id UUID NOT NULL REFERENCES pet_insurances(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  description TEXT,
  cost NUMERIC(10, 2),
  status TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobado', 'Rechazado'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE pet_microchips ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_insurance_claims ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los usuarios solo pueden ver y modificar documentos de sus propias mascotas
CREATE POLICY "Users can view their own pet microchips"
  ON pet_microchips FOR SELECT
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own pet microchips"
  ON pet_microchips FOR INSERT
  WITH CHECK (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own pet microchips"
  ON pet_microchips FOR UPDATE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own pet microchips"
  ON pet_microchips FOR DELETE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

-- Políticas para cartillas
CREATE POLICY "Users can view their own pet passports"
  ON pet_passports FOR SELECT
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own pet passports"
  ON pet_passports FOR INSERT
  WITH CHECK (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own pet passports"
  ON pet_passports FOR UPDATE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own pet passports"
  ON pet_passports FOR DELETE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

-- Políticas para vacunas
CREATE POLICY "Users can view their own pet vaccinations"
  ON pet_vaccinations FOR SELECT
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own pet vaccinations"
  ON pet_vaccinations FOR INSERT
  WITH CHECK (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own pet vaccinations"
  ON pet_vaccinations FOR UPDATE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own pet vaccinations"
  ON pet_vaccinations FOR DELETE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

-- Políticas para seguros
CREATE POLICY "Users can view their own pet insurances"
  ON pet_insurances FOR SELECT
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own pet insurances"
  ON pet_insurances FOR INSERT
  WITH CHECK (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own pet insurances"
  ON pet_insurances FOR UPDATE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own pet insurances"
  ON pet_insurances FOR DELETE
  USING (pet_id IN (SELECT id FROM user_pets WHERE user_id = auth.uid()));

-- Políticas para siniestros
CREATE POLICY "Users can view their own pet insurance claims"
  ON pet_insurance_claims FOR SELECT
  USING (insurance_id IN (
    SELECT pi.id FROM pet_insurances pi
    JOIN user_pets up ON pi.pet_id = up.id
    WHERE up.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own pet insurance claims"
  ON pet_insurance_claims FOR INSERT
  WITH CHECK (insurance_id IN (
    SELECT pi.id FROM pet_insurances pi
    JOIN user_pets up ON pi.pet_id = up.id
    WHERE up.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own pet insurance claims"
  ON pet_insurance_claims FOR UPDATE
  USING (insurance_id IN (
    SELECT pi.id FROM pet_insurances pi
    JOIN user_pets up ON pi.pet_id = up.id
    WHERE up.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own pet insurance claims"
  ON pet_insurance_claims FOR DELETE
  USING (insurance_id IN (
    SELECT pi.id FROM pet_insurances pi
    JOIN user_pets up ON pi.pet_id = up.id
    WHERE up.user_id = auth.uid()
  ));
