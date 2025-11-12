-- Create shop_categories table
CREATE TABLE IF NOT EXISTS shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shop_products table
CREATE TABLE IF NOT EXISTS shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  stock INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shop_banners table (for slider images)
CREATE TABLE IF NOT EXISTS shop_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  title TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cart table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES shop_products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_categories (public read)
CREATE POLICY shop_categories_select_all ON shop_categories
  FOR SELECT USING (true);

-- RLS Policies for shop_products (public read)
CREATE POLICY shop_products_select_all ON shop_products
  FOR SELECT USING (true);

-- RLS Policies for shop_banners (public read active banners)
CREATE POLICY shop_banners_select_active ON shop_banners
  FOR SELECT USING (active = true);

-- RLS Policies for cart_items (users can manage their own cart)
CREATE POLICY cart_items_select_own ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cart_items_insert_own ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cart_items_update_own ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY cart_items_delete_own ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_featured ON shop_products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_shop_products_new ON shop_products(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_banners_order ON shop_banners(order_index) WHERE active = true;

-- Insert sample categories
INSERT INTO shop_categories (name, description, icon) VALUES
  ('Comida', 'Alimentos para mascotas', '🍖'),
  ('Juguetes', 'Juguetes y entretenimiento', '🎾'),
  ('Accesorios', 'Collares, correas y más', '🦴'),
  ('Higiene', 'Productos de limpieza', '🧼'),
  ('Salud', 'Vitaminas y suplementos', '💊'),
  ('Camas', 'Camas y descanso', '🛏️');

-- Insert sample products
INSERT INTO shop_products (name, description, price, category_id, stock, featured, is_new, image_url) 
SELECT 
  'Pienso Premium para Perros', 
  'Alimento completo y equilibrado para perros adultos',
  45.99,
  id,
  100,
  true,
  false,
  '/placeholder.svg?height=300&width=300'
FROM shop_categories WHERE name = 'Comida' LIMIT 1;

INSERT INTO shop_products (name, description, price, category_id, stock, featured, is_new, image_url)
SELECT 
  'Pelota Interactiva', 
  'Pelota con dispensador de premios',
  19.99,
  id,
  50,
  true,
  true,
  '/placeholder.svg?height=300&width=300'
FROM shop_categories WHERE name = 'Juguetes' LIMIT 1;

INSERT INTO shop_products (name, description, price, category_id, stock, featured, is_new, image_url)
SELECT 
  'Collar Ajustable', 
  'Collar resistente y ajustable',
  12.99,
  id,
  75,
  false,
  false,
  '/placeholder.svg?height=300&width=300'
FROM shop_categories WHERE name = 'Accesorios' LIMIT 1;

INSERT INTO shop_products (name, description, price, category_id, stock, featured, is_new, image_url)
SELECT 
  'Champú Hipoalergénico', 
  'Champú suave para pieles sensibles',
  14.99,
  id,
  60,
  false,
  true,
  '/placeholder.svg?height=300&width=300'
FROM shop_categories WHERE name = 'Higiene' LIMIT 1;

INSERT INTO shop_products (name, description, price, category_id, stock, featured, is_new, image_url)
SELECT 
  'Cama Acolchada Grande', 
  'Cama ortopédica con memory foam',
  89.99,
  id,
  30,
  true,
  false,
  '/placeholder.svg?height=300&width=300'
FROM shop_categories WHERE name = 'Camas' LIMIT 1;

-- Insert sample banners
INSERT INTO shop_banners (image_url, link_url, title, order_index) VALUES
  ('/placeholder.svg?height=200&width=800', '/tienda?category=destacados', 'Ofertas Especiales', 1),
  ('/placeholder.svg?height=200&width=800', '/tienda?category=comida', 'Nueva Línea de Alimentos', 2),
  ('/placeholder.svg?height=200&width=800', '/tienda?category=juguetes', 'Juguetes en Promoción', 3);
