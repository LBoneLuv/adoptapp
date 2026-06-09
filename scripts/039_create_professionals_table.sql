-- ============================================================================
-- 039_create_professionals_table.sql
-- Unified directory of pet professionals: veterinarios, adiestradores,
-- paseadores y residencias. Mirrors the "shelters" pattern (social_links,
-- images, description, location) and adds services + horarios (schedule).
-- ============================================================================

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 'veterinario' | 'adiestrador' | 'paseador' | 'residencia'
  type TEXT NOT NULL CHECK (type IN ('veterinario', 'adiestrador', 'paseador', 'residencia')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  location TEXT NOT NULL,                 -- Ciudad / pueblo (mirrors shelters.location)
  address TEXT,                           -- Dirección completa (calle, nº)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  short_description TEXT,                  -- Frase corta para la tarjeta
  description TEXT,                        -- Descripción larga (admite HTML como animals)
  profile_image_url TEXT,
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  website TEXT,
  -- [{ "platform": "instagram", "url": "https://..." }]
  social_links JSONB DEFAULT '[]'::jsonb,
  -- [{ "name": "Consulta general", "description": "...", "price": "30€" }]
  services JSONB DEFAULT '[]'::jsonb,
  -- [{ "day": "Lunes", "open": "09:00", "close": "20:00" }] (close NULL = cerrado)
  schedule JSONB DEFAULT '[]'::jsonb,
  price_range TEXT,                        -- "€", "€€", "€€€" o texto libre
  rating NUMERIC(2, 1),                    -- 0.0 - 5.0
  reviews_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  emergency_24h BOOLEAN DEFAULT FALSE,     -- relevante para veterinarios / residencias
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- RLS: lectura pública de aprobados; el dueño gestiona los suyos.
-- ---------------------------------------------------------------------------
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS professionals_select_public ON professionals;
CREATE POLICY professionals_select_public ON professionals
  FOR SELECT USING (status = 'approved' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS professionals_insert_own ON professionals;
CREATE POLICY professionals_insert_own ON professionals
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS professionals_update_own ON professionals;
CREATE POLICY professionals_update_own ON professionals
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS professionals_delete_own ON professionals;
CREATE POLICY professionals_delete_own ON professionals
  FOR DELETE USING (auth.uid() = owner_id);

-- El super_admin (operador de la app) puede gestionar TODOS los profesionales.
DROP POLICY IF EXISTS professionals_super_admin_all ON professionals;
CREATE POLICY professionals_super_admin_all ON professionals
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_professionals_type ON professionals(type);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_location ON professionals(location);
CREATE INDEX IF NOT EXISTS idx_professionals_featured ON professionals(featured) WHERE featured = true;

-- ---------------------------------------------------------------------------
-- updated_at automático (reutiliza el patrón de triggers del proyecto)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_professionals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_professionals_updated_at ON professionals;
CREATE TRIGGER trg_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION set_professionals_updated_at();

-- ============================================================================
-- DATOS DE EJEMPLO (para que los directorios no aparezcan vacíos).
-- Borra este bloque cuando empieces a dar de alta profesionales reales.
-- ============================================================================

INSERT INTO professionals
  (type, name, location, address, phone, whatsapp, email, website, short_description, description,
   profile_image_url, cover_image_url, social_links, services, schedule, price_range, rating,
   reviews_count, verified, featured, emergency_24h, status)
VALUES
-- ---- VETERINARIOS --------------------------------------------------------
('veterinario', 'Clínica Veterinaria San Roque', 'Málaga', 'Calle Larios 12, 29005 Málaga',
 '+34 952 11 22 33', '+34 600 11 22 33', 'info@vetsanroque.es', 'https://vetsanroque.es',
 'Medicina general, cirugía y urgencias 24h',
 '<p>En la <strong>Clínica Veterinaria San Roque</strong> llevamos más de 20 años cuidando de la salud de tu mascota. Contamos con quirófano propio, laboratorio y servicio de urgencias 24 horas.</p><p>Equipo de 6 veterinarios especializados en medicina interna, traumatología y dermatología.</p>',
 '/placeholder.svg?height=200&width=200', '/images/veterinarios.jpg',
 '[{"platform":"instagram","url":"https://instagram.com/vetsanroque"},{"platform":"facebook","url":"https://facebook.com/vetsanroque"}]'::jsonb,
 '[{"name":"Consulta general","description":"Revisión y diagnóstico","price":"30€"},{"name":"Vacunación","description":"Calendario completo","price":"desde 25€"},{"name":"Cirugía","description":"Quirófano equipado","price":"presupuesto"},{"name":"Urgencias 24h","description":"Atención inmediata","price":"60€"}]'::jsonb,
 '[{"day":"Lunes","open":"09:00","close":"20:00"},{"day":"Martes","open":"09:00","close":"20:00"},{"day":"Miércoles","open":"09:00","close":"20:00"},{"day":"Jueves","open":"09:00","close":"20:00"},{"day":"Viernes","open":"09:00","close":"20:00"},{"day":"Sábado","open":"10:00","close":"14:00"},{"day":"Domingo","open":null,"close":null}]'::jsonb,
 '€€', 4.8, 124, true, true, true, 'approved'),

('veterinario', 'Hospital Veterinario Costa del Sol', 'Marbella', 'Av. Ricardo Soriano 45, 29601 Marbella',
 '+34 952 80 90 10', '+34 611 80 90 10', 'citas@hvcostadelsol.es', 'https://hvcostadelsol.es',
 'Hospital con UCI y especialistas',
 '<p>Hospital veterinario de referencia en la Costa del Sol. Disponemos de UCI, diagnóstico por imagen (TAC, ecografía, rayos X) y un equipo de especialistas para casos complejos.</p>',
 '/placeholder.svg?height=200&width=200', '/images/veterinarios.jpg',
 '[{"platform":"instagram","url":"https://instagram.com/hvcostadelsol"}]'::jsonb,
 '[{"name":"Consulta especialista","description":"Cardiología, oftalmología…","price":"45€"},{"name":"Diagnóstico por imagen","description":"Ecografía, TAC","price":"desde 80€"},{"name":"Hospitalización","description":"UCI 24h","price":"presupuesto"}]'::jsonb,
 '[{"day":"Lunes","open":"00:00","close":"23:59"},{"day":"Martes","open":"00:00","close":"23:59"},{"day":"Miércoles","open":"00:00","close":"23:59"},{"day":"Jueves","open":"00:00","close":"23:59"},{"day":"Viernes","open":"00:00","close":"23:59"},{"day":"Sábado","open":"00:00","close":"23:59"},{"day":"Domingo","open":"00:00","close":"23:59"}]'::jsonb,
 '€€€', 4.9, 89, true, false, true, 'approved'),

-- ---- ADIESTRADORES -------------------------------------------------------
('adiestrador', 'Educan - Laura Méndez', 'Sevilla', 'Parque del Alamillo, 41092 Sevilla',
 '+34 654 33 22 11', '+34 654 33 22 11', 'laura@educan-sevilla.es', 'https://educan-sevilla.es',
 'Educación canina en positivo y modificación de conducta',
 '<p>Adiestradora certificada especializada en <strong>refuerzo positivo</strong>. Trabajo problemas de conducta (ansiedad por separación, reactividad, miedos) y educación básica desde cachorro.</p><p>Sesiones a domicilio y en grupo.</p>',
 '/placeholder.svg?height=200&width=200', '/images/adiestradores.jpg',
 '[{"platform":"instagram","url":"https://instagram.com/educan.laura"},{"platform":"tiktok","url":"https://tiktok.com/@educan.laura"}]'::jsonb,
 '[{"name":"Sesión individual","description":"A domicilio, 1h","price":"40€"},{"name":"Pack 5 sesiones","description":"Educación básica","price":"180€"},{"name":"Clase grupal","description":"Socialización, 1h","price":"15€"},{"name":"Modificación de conducta","description":"Plan personalizado","price":"presupuesto"}]'::jsonb,
 '[{"day":"Lunes","open":"10:00","close":"19:00"},{"day":"Martes","open":"10:00","close":"19:00"},{"day":"Miércoles","open":"10:00","close":"19:00"},{"day":"Jueves","open":"10:00","close":"19:00"},{"day":"Viernes","open":"10:00","close":"19:00"},{"day":"Sábado","open":"10:00","close":"14:00"},{"day":"Domingo","open":null,"close":null}]'::jsonb,
 '€€', 5.0, 47, true, true, false, 'approved'),

('adiestrador', 'K9 Training Center', 'Madrid', 'Calle del Campo 8, 28045 Madrid',
 '+34 910 22 33 44', '+34 622 22 33 44', 'info@k9training.es', 'https://k9training.es',
 'Adiestramiento deportivo y de obediencia avanzada',
 '<p>Centro de adiestramiento con pista propia. Especialistas en obediencia avanzada, agility y deporte canino. También educación para perros de protección.</p>',
 '/placeholder.svg?height=200&width=200', '/images/adiestradores.jpg',
 '[{"platform":"facebook","url":"https://facebook.com/k9training"}]'::jsonb,
 '[{"name":"Obediencia básica","description":"Pack mensual","price":"120€"},{"name":"Agility","description":"Clase semanal","price":"20€"},{"name":"Internado","description":"Adiestramiento intensivo","price":"presupuesto"}]'::jsonb,
 '[{"day":"Lunes","open":"09:00","close":"21:00"},{"day":"Martes","open":"09:00","close":"21:00"},{"day":"Miércoles","open":"09:00","close":"21:00"},{"day":"Jueves","open":"09:00","close":"21:00"},{"day":"Viernes","open":"09:00","close":"21:00"},{"day":"Sábado","open":"09:00","close":"15:00"},{"day":"Domingo","open":null,"close":null}]'::jsonb,
 '€€', 4.6, 63, false, false, false, 'approved'),

-- ---- PASEADORES ----------------------------------------------------------
('paseador', 'Paseaperros Barcelona - Marc', 'Barcelona', 'Zona Eixample y Gràcia, Barcelona',
 '+34 633 44 55 66', '+34 633 44 55 66', 'marc@paseaperrosbcn.es', NULL,
 'Paseos individuales y en grupo reducido',
 '<p>Paseador profesional con seguro de responsabilidad civil. Paseos de 30 o 60 minutos, recogida y entrega a domicilio. Envío de fotos y ubicación en tiempo real durante el paseo.</p>',
 '/placeholder.svg?height=200&width=200', '/images/paseadores.jpg',
 '[{"platform":"instagram","url":"https://instagram.com/paseaperrosbcn"},{"platform":"tiktok","url":"https://tiktok.com/@paseaperrosbcn"}]'::jsonb,
 '[{"name":"Paseo individual 30 min","description":"Recogida incluida","price":"12€"},{"name":"Paseo individual 60 min","description":"Recogida incluida","price":"18€"},{"name":"Paseo en grupo","description":"Máx. 4 perros","price":"10€"},{"name":"Bono 10 paseos","description":"Descuento 15%","price":"150€"}]'::jsonb,
 '[{"day":"Lunes","open":"08:00","close":"20:00"},{"day":"Martes","open":"08:00","close":"20:00"},{"day":"Miércoles","open":"08:00","close":"20:00"},{"day":"Jueves","open":"08:00","close":"20:00"},{"day":"Viernes","open":"08:00","close":"20:00"},{"day":"Sábado","open":"09:00","close":"14:00"},{"day":"Domingo","open":null,"close":null}]'::jsonb,
 '€', 4.9, 38, true, true, false, 'approved'),

('paseador', 'Happy Paws Walkers', 'Valencia', 'Zona Ruzafa y centro, Valencia',
 '+34 644 55 66 77', '+34 644 55 66 77', 'hola@happypaws.es', 'https://happypaws.es',
 'Equipo de paseadores con cobertura en toda la ciudad',
 '<p>Equipo profesional de paseadores disponibles los 7 días. Servicio de guardería de día y paseos adaptados a perros senior o con movilidad reducida.</p>',
 '/placeholder.svg?height=200&width=200', '/images/paseadores.jpg',
 '[{"platform":"instagram","url":"https://instagram.com/happypaws.vlc"}]'::jsonb,
 '[{"name":"Paseo estándar","description":"45 min","price":"14€"},{"name":"Guardería de día","description":"Jornada completa","price":"22€"},{"name":"Paseo perro senior","description":"Ritmo adaptado","price":"15€"}]'::jsonb,
 '[{"day":"Lunes","open":"07:30","close":"21:00"},{"day":"Martes","open":"07:30","close":"21:00"},{"day":"Miércoles","open":"07:30","close":"21:00"},{"day":"Jueves","open":"07:30","close":"21:00"},{"day":"Viernes","open":"07:30","close":"21:00"},{"day":"Sábado","open":"09:00","close":"18:00"},{"day":"Domingo","open":"09:00","close":"14:00"}]'::jsonb,
 '€', 4.7, 52, false, false, false, 'approved'),

-- ---- RESIDENCIAS ---------------------------------------------------------
('residencia', 'Residencia Canina El Pinar', 'Toledo', 'Ctra. de Ávila km 8, 45004 Toledo',
 '+34 925 22 11 00', '+34 666 22 11 00', 'reservas@elpinar.es', 'https://residenciaelpinar.es',
 'Hotel canino con parcelas individuales y piscina',
 '<p>Residencia con <strong>5.000 m² de instalaciones</strong>, parcelas individuales climatizadas, zona de juego y piscina. Personal 24h y veterinario de guardia.</p><p>Plazas para perros, gatos y pequeños mamíferos.</p>',
 '/placeholder.svg?height=200&width=200', '/images/residencias.jpg',
 '[{"platform":"instagram","url":"https://instagram.com/residenciaelpinar"},{"platform":"facebook","url":"https://facebook.com/residenciaelpinar"}]'::jsonb,
 '[{"name":"Estancia perro","description":"Parcela individual + 3 paseos","price":"22€/día"},{"name":"Estancia gato","description":"Habitación felina","price":"15€/día"},{"name":"Recogida y entrega","description":"Transporte a domicilio","price":"desde 20€"},{"name":"Estancia larga","description":"+15 días, 20% dto.","price":"presupuesto"}]'::jsonb,
 '[{"day":"Lunes","open":"09:00","close":"19:00"},{"day":"Martes","open":"09:00","close":"19:00"},{"day":"Miércoles","open":"09:00","close":"19:00"},{"day":"Jueves","open":"09:00","close":"19:00"},{"day":"Viernes","open":"09:00","close":"19:00"},{"day":"Sábado","open":"10:00","close":"14:00"},{"day":"Domingo","open":"10:00","close":"13:00"}]'::jsonb,
 '€€', 4.8, 71, true, true, true, 'approved'),

('residencia', 'Pet Resort Costa', 'Alicante', 'Partida La Alcoraya 22, 03114 Alicante',
 '+34 965 33 44 55', '+34 677 33 44 55', 'info@petresortcosta.es', 'https://petresortcosta.es',
 'Alojamiento boutique con cámaras en directo',
 '<p>Pet resort boutique donde tu mascota se aloja en suites individuales con cámara accesible desde la app. Servicio de peluquería y spa canino opcional.</p>',
 '/placeholder.svg?height=200&width=200', '/images/residencias.jpg',
 '[{"platform":"instagram","url":"https://instagram.com/petresortcosta"}]'::jsonb,
 '[{"name":"Suite individual","description":"Cámara 24h incluida","price":"28€/día"},{"name":"Spa canino","description":"Baño + corte","price":"35€"},{"name":"Pack vacaciones","description":"7 noches","price":"175€"}]'::jsonb,
 '[{"day":"Lunes","open":"08:00","close":"20:00"},{"day":"Martes","open":"08:00","close":"20:00"},{"day":"Miércoles","open":"08:00","close":"20:00"},{"day":"Jueves","open":"08:00","close":"20:00"},{"day":"Viernes","open":"08:00","close":"20:00"},{"day":"Sábado","open":"09:00","close":"18:00"},{"day":"Domingo","open":"09:00","close":"14:00"}]'::jsonb,
 '€€€', 4.9, 44, true, false, false, 'approved');
