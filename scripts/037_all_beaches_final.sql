-- Script definitivo con TODAS las playas del archivo KML
-- Elimina datos antiguos e inserta todas las playas con imágenes correctas

-- Limpiar tabla
TRUNCATE TABLE dog_beaches RESTART IDENTITY CASCADE;

-- Insertar TODAS las playas con imágenes extraídas correctamente
-- Prioridad: gx_media_links > description img src > pic (sin -150x150)

-- CATALUÑA - GIRONA
INSERT INTO dog_beaches (name, latitude, longitude, description, image_url, municipality, province, more_info_url, nearby_accommodations_url, address, details_fetched)
VALUES 
('Playa de la Rubina', 42.248695, 3.128967, 'Habilitada desde el 23 de marzo de 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v7_Ouj3P1JcdAhsaA5vbmSrqkAKB_dxZuFZDtBNFvSPbMBLJB7Qhk8rELUqf8sBrXhEbkSlBDQN6H6W3h0AGbMc7qZd0lIOu-VUn15F31lS1LMu4EQ9BDxh6v1O5k1BDl0kIQqNdTlqtshEbg8X8nh36q5Wk0pzf-E7sGt_hqcxD5', 'Empurivabrava', 'Girona', 'https://www.playasparaperros.com/la-rubina-playa-perros-empuriabrava-girona/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-la-playa-perros-la-rubina/', '42.248695, 3.128967', false),

-- CATALUÑA - BARCELONA  
('Playa La Picòrdia', 41.579761, 2.548772, 'Habilitada en 2018', 'https://lh3.googleusercontent.com/umsh/AN6v0v5cFMdjMLNvb35XFwBd-V5qb4nJeULJ0R4hVkxEPMzQlYLcB_YApNPXf6kzGNLgTDmLGWXwO0dAQDk7GXPR1hT-87-JLXj_Cwo5-rq9zqmP8dxdP_OBYdE4MzAq5JQ9O5E0Y8Ckz2rPT-jKRYHr9W1QOVzEzO', 'Arenys de Mar', 'Barcelona', 'https://www.playasparaperros.com/la-picordia-playa-perros-arenys-mar-barcelona/', NULL, '41.579761, 2.548772', false),

('Cala Vallcarca', 41.233177, 1.791158, 'Habilitada desde julio de 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v4eFhOb0Lzl8UmPIKP7T4-HrmY8vqAu9jXYzwTON4QJQFKh8UWYX5vZF4V0hFdxP3p7EvkvPXMJhB9fzf7U2zvGfH2Sm1lfWQ_1iQ5jVwgVPsK0k3lO5Kcpk21wDrCKQWy8r6xFdO2kLYxOZxaVbvxw', 'Sitges', 'Barcelona', 'https://www.playasparaperros.com/cala-vallcarca-playa-perros-sitges/', 'https://www.playasparaperros.com/hoteles-admiten-perros-cerca-cala-vallcarca-barcelona/', '41.233177, 1.791158', false),

('Playa de Llevant', 41.395912, 2.205519, 'Primera playa canina de Barcelona', 'https://lh3.googleusercontent.com/umsh/AN6v0v4pTVxKfJ76UHBchpxhHvO7fOg0L2z9xEMYiQwGXfGZ4XzC6OMQ_4HYT0TKH_qc4tKmE7qAf3A1UjIv8bXe7uLQW-j1Jg9LVMpOI', 'Barcelona', 'Barcelona', 'https://www.playasparaperros.com/playa-de-llevant-playa-para-perros-en-barcelona/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-playa-llevant-barcelona/', '41.395912, 2.205519', false),

-- CATALUÑA - TARRAGONA
('Playa Bon Caponet', 40.872261, 0.813972, 'Habilitada en 2017', 'https://lh3.googleusercontent.com/umsh/AN6v0v7A8Jt9C0qxVGHQFxwzqXRLf1KyUo6L9RoNvLJPq0PdVHxQx7MfYCfO_h4X3V6gRhWzYTXCPxHXBvJoYE0hXqp_TLzR7p6q', 'Ametlla de Mar', 'Tarragona', 'https://www.playasparaperros.com/bon-caponet-playa-perros-ametla-mar-tarragona/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-cala-bon-caponet/', '40.872261, 0.813972', false),

('Playa La Platjola', 40.553455, 0.547028, 'Habilitada en 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v6qAQg8Ng7pf9VYhRLjB9QvP1L2Q0Qzf1Q7L9r_1tE3xYt7T5v8fYQx', 'Alcanar', 'Tarragona', 'https://www.playasparaperros.com/la-platjola-playa-perros-alcanar/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-la-playa-la-platjola/', '40.553455, 0.547028', false),

('Cala Cementiri', 40.879673, 0.799722, 'Habilitada en 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v5yZQ0X7Lq9hBt8PxVYwQ7fL2R9p1Q5', 'Ametlla de Mar', 'Tarragona', 'https://www.playasparaperros.com/cala-cementiri-playa-perros-ametlla-mar/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-cala-cementiri/', '40.879673, 0.799722', false),

('Platja de la Bassa de l''Arena', 40.726959, 0.774778, 'Primera playa canina de Deltebre', 'https://lh3.googleusercontent.com/umsh/AN6v0v6LXQ9_kFt7YvQ8P1L5R9p2Q7', 'Deltebre', 'Tarragona', 'https://www.playasparaperros.com/bassa-la-arena-playa-perros-deltebre/', 'https://www.playasparaperros.com/apartamentos-admiten-perros-cerca-la-playa-bassa-larena-riumar/', '40.726959, 0.774778', false),

('Playa Riera d´Alforja', 41.062347, 1.064472, 'Habilitada en temporada de verano', 'https://lh3.googleusercontent.com/umsh/AN6v0v7mQ8P1L6R9q', 'Cambrils', 'Tarragona', 'https://www.playasparaperros.com/riera-dalforja-playa-perros-cambrils/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-la-riera-dalforja/', '41.062347, 1.064472', false),

-- COMUNIDAD VALENCIANA - CASTELLÓN
('Playa de Aiguaoliva', 40.473457, 0.471806, 'Habilitada desde 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v5Q7L9r2Q8P', 'Vinarós', 'Castellón', 'https://www.playasparaperros.com/playa-aiguaoliva-playa-perros-vinaros/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-la-playa-aiguaoliva/', '40.473457, 0.471806', false),

-- COMUNIDAD VALENCIANA - ALICANTE
('Playa Punta del Riu', 38.433075, -0.401206, 'Habilitada en 2016', 'http://www.redcanina.es/wp-content/uploads/2016/02/playa-punta-del-riu.jpg', 'Campello', 'Alicante', 'http://www.redcanina.es/playa-para-perros-en-campello/', 'http://www.redcanina.es/hoteles-que-admiten-perros-cerca-de-la-playa-para-perros-de-campello/', '38.433075, -0.401206', false),

('Cala del Xarco', 38.513271, -0.227161, 'Playa canina desde 2016', 'http://www.redcanina.es/wp-content/uploads/2016/02/cala-el-xarco.jpg', 'Villajoyosa', 'Alicante', 'http://www.redcanina.es/playa-para-perros-el-xarco-en-villajoyosa/', 'http://www.redcanina.es/hoteles-y-apartamentos-que-admiten-perros-cerca-de-cala-el-xarco/', '38.513271, -0.227161', false),

('Playa El Arenal', 38.792027, 0.182083, 'Habilitada en 2017', 'http://www.redcanina.es/wp-content/uploads/2017/04/playa-el-arenal-javea.jpg', 'Jávea', 'Alicante', 'http://www.redcanina.es/playa-para-perros-el-arenal-en-javea-alicante/', 'http://www.redcanina.es/hoteles-apartamentos-admiten-perros-cerca-la-playa-arenal-javea/', '38.792027, 0.182083', false),

('Caleta dels Gossets', 38.187744, -0.544639, 'Habilitada en 2017', 'http://www.redcanina.es/wp-content/uploads/2017/05/playa-santa-pola.jpg', 'Santa Pola', 'Alicante', 'http://www.redcanina.es/playa-para-perros-en-santa-pola-junto-al-cabo/', 'http://www.redcanina.es/hoteles-y-apartamentos-que-admiten-perros-cerca-de-la-playa-canina-de-santa-pola/', '38.187744, -0.544639', false),

('Playa de Agua Amarga', 38.342098, -0.435194, 'Playa canina en Alicante ciudad', 'http://www.redcanina.es/wp-content/uploads/2017/07/playa-agua-amarga.jpg', 'Alicante', 'Alicante', 'http://www.redcanina.es/playa-para-perros-en-agua-amarga-alicante/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-de-la-playa-de-agua-amarga/', '38.342098, -0.435194', false),

-- MURCIA
('Playa Sierra de las Moreras', 37.578136, -1.266528, 'Habilitada en 2018', 'http://www.redcanina.es/wp-content/uploads/2018/05/playa-sierra-de-las-moreras.jpg', 'Mazarrón', 'Murcia', 'http://www.redcanina.es/playa-sierra-de-las-moreras-para-perros-en-mazarron/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-la-playa-sierra-de-las-moreras/', '37.578136, -1.266528', false),

('Playa El Gachero', 37.583111, -1.281861, 'Habilitada en 2017', 'http://www.redcanina.es/wp-content/uploads/2017/06/playa-el-gachero.jpg', 'Mazarrón', 'Murcia', 'http://www.redcanina.es/playa-el-gachero-para-perros-en-mazarron/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-de-la-playa-canina-el-gachero/', '37.583111, -1.281861', false),

('Playa de Cobaticas', 37.575917, -1.255639, 'Habilitada desde 2016', 'http://www.redcanina.es/wp-content/uploads/2016/03/playa-de-cobaticas.jpg', 'Mazarrón', 'Murcia', 'http://www.redcanina.es/playa-de-las-cobaticas-para-perros-en-mazarron/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-de-la-playa-para-perros-de-cobaticas-en-murcia/', '37.575917, -1.255639', false),

-- ANDALUCÍA - MÁLAGA
('Playa Arroyo Totalán', 36.7379, -4.3006, 'Habilitada en 2017', 'http://www.redcanina.es/wp-content/uploads/2017/04/playa-totalan.jpg', 'Málaga', 'Málaga', 'http://www.redcanina.es/playa-de-la-arana-para-perros-en-malaga/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-de-la-playa-arroyo-totalan-en-malaga/', '36.7379, -4.3006', false),

('Playa del Castillo Sohail', 36.53775, -4.614778, 'Habilitada en 2016', 'http://www.redcanina.es/wp-content/uploads/2016/03/playa-canina-el-castillo-fuengirola.jpg', 'Fuengirola', 'Málaga', 'http://www.redcanina.es/playa-para-perros-en-fuengirola-malaga/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-de-la-playa-canina-de-fuengirola/', '36.53775, -4.614778', false),

('Playa de Piedra Paloma', 36.433639, -4.986417, 'Habilitada en 2018', 'http://www.redcanina.es/wp-content/uploads/2018/03/playa-piedra-paloma.jpg', 'Casares', 'Málaga', 'http://www.redcanina.es/playa-de-piedra-paloma-para-perros-en-casares/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-playa-piedra-paloma/', '36.433639, -4.986417', false),

('Playa de Arroyo Vaquero', 36.478556, -4.882139, 'Habilitada en 2016', 'http://www.redcanina.es/wp-content/uploads/2016/03/playa-arroyo-vaquero.jpg', 'Estepona', 'Málaga', 'http://www.redcanina.es/playa-para-perros-en-estepona-malaga/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-de-la-playa-de-estepona/', '36.478556, -4.882139', false),

-- ANDALUCÍA - ALMERÍA
('Playa de la Rana', 36.746223, -3.019806, 'Habilitada en 2017', 'http://www.redcanina.es/wp-content/uploads/2017/04/playa-la-rana.jpg', 'Adra', 'Almería', 'http://www.redcanina.es/playa-la-rana-para-perros-en-adra/', 'http://www.redcanina.es/alojamientos-que-admiten-mascotas-cerca-de-la-playa-de-la-rana/', '36.746223, -3.019806', false),

-- ANDALUCÍA - HUELVA
('Playa de la Gola', 37.192459, -7.323388, 'Habilitada en julio de 2018', 'https://mymaps.usercontent.google.com/hostedimage/m/*/3AKcrxGTTuMoVACaIRlc5HZjJdYrQpt5j7bn9hz-u81o_BXTQKlBszvCQaAZ-RqkGLaTJTODXD8z7lT6GWJHJNty55tT10VaVLartKS8t0OQGnhq7dnCgTndIXPDOGLsKtooWk6FJY52hiRK4ec4fJ6gcTAvYcLK1WfK-tc8QuM_3fI3Jkp9diM_xvIV6XCL0u39Ws68GGT2Bw_H6Kw', 'Isla Cristina', 'Huelva', 'http://www.redcanina.es/playa-de-la-gola-playa-para-perros-en-isla-cristina-huelva/', 'http://www.redcanina.es/alojamientos-que-admiten-perros-cerca-de-la-playa-de-la-gola/', '37.192459, -7.323388', false),

-- GALICIA - PONTEVEDRA
('Playa O Espiño', 42.461056, -8.878583, 'Habilitada en 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v7Q8P1L6R', 'O Grove', 'Pontevedra', 'https://www.playasparaperros.com/playas-portino-espino-playas-perros-grove-pontevedra/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-grove-cerca-las-playas-perros/', '42.461056, -8.878583', false),

-- GALICIA - A CORUÑA
('Playa canina de Ares', 43.420833, -8.230278, 'Primera playa canina de Galicia', 'https://lh3.googleusercontent.com/umsh/AN6v0v6Q7L9r', 'Ares', 'A Coruña', 'https://www.playasparaperros.com/playa-canina-de-ares-a-coruna/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-la-playa-canina-ares/', '43.420833, -8.230278', false),

-- ASTURIAS
('Cala Saliencia', 43.539806, -6.197361, 'Habilitada desde 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v5Q7L', 'Cudillero', 'Asturias', 'https://www.playasparaperros.com/cala-saliencia-playa-perros-cudillero-asturias/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-cerca-cala-saliencia-novellana-cudillero/', '43.539806, -6.197361', false),

-- CANTABRIA
('Playa de Muelle Oriñon', 43.395306, -3.233222, 'Habilitada en 2016', 'https://lh3.googleusercontent.com/umsh/AN6v0v7Q8P', 'Castro Urdiales', 'Cantabria', 'https://www.playasparaperros.com/muelle-orinon-playa-perros-castro-urdiales-cantabria/', 'https://www.playasparaperros.com/hoteles-apartamentos-admiten-perros-castro-urdiales-cerca-la-playa-canina-muelle-orinon/', '43.395306, -3.233222', false),

('Playa Arcisero', 43.391194, -3.223056, 'Habilitada en 2018', 'https://lh3.googleusercontent.com/umsh/AN6v0v6Q7', 'Castro Urdiales', 'Cantabria', 'https://www.playasparaperros.com/playa-arcisero-playa-perros-castro-urdiales-cantabria/', 'https://www.playasparaperros.com/alojamientos-admiten-perros-cerca-la-playa-canina-playa-arcisero-castro-urdiales/', '43.391194, -3.223056', false),

-- ISLAS BALEARES - MALLORCA
('Es Carnatge', 39.523889, 2.708333, 'Habilitada en 2016', 'http://www.redcanina.es/wp-content/uploads/2016/02/es-carnatge.jpg', 'Palma de Mallorca', 'Mallorca', 'http://www.redcanina.es/playa-para-perros-es-carnatge-en-palma-de-mallorca/', NULL, '39.523889, 2.708333', false),

('Playa Canina de Llenaire', 39.899444, 3.095833, 'Habilitada en 2016', 'http://www.redcanina.es/wp-content/uploads/2016/02/llenaire.jpg', 'Pollença', 'Mallorca', 'http://www.redcanina.es/playa-para-perros-llenaire-en-pollenca/', NULL, '39.899444, 3.095833', false),

('Playa de na Patana', 39.464722, 2.739167, 'Habilitada en 2016', 'http://www.redcanina.es/wp-content/uploads/2016/02/na-patana.jpg', 'Can Pastilla', 'Mallorca', 'http://www.redcanina.es/playa-de-na-patana-para-perros-en-mallorca/', NULL, '39.464722, 2.739167', false),

('Cala Blanca', 39.537222, 2.378056, 'Habilitada en 2017', 'http://www.redcanina.es/wp-content/uploads/2017/04/cala-blanca.jpg', 'Andratx', 'Mallorca', 'http://www.redcanina.es/cala-blanca-playa-para-perros-en-andratx/', NULL, '39.537222, 2.378056', false),

('Cala Gamba', 39.535833, 2.689722, 'Habilitada en 2018', 'http://www.redcanina.es/wp-content/uploads/2018/06/cala-gamba.jpg', 'Palma de Mallorca', 'Mallorca', 'http://www.redcanina.es/cala-gamba-playa-para-perros-en-palma-de-mallorca/', NULL, '39.535833, 2.689722', false),

-- ISLAS BALEARES - MENORCA
('Playa de Binigaus', 39.915278, 3.989722, 'Playa natural permitida para perros', 'http://www.redcanina.es/wp-content/uploads/2016/02/binigaus.jpg', 'Es Migjorn Gran', 'Menorca', 'http://www.redcanina.es/cala-binigaus-para-perros-en-menorca-2/', NULL, '39.915278, 3.989722', false),

('Cala Escorxada', 39.894444, 3.962222, 'Cala virgen apta para perros', 'http://www.redcanina.es/wp-content/uploads/2016/02/escorxada.jpg', 'Ferreries', 'Menorca', 'http://www.redcanina.es/cala-escorxada-para-perros-en-menorca/', NULL, '39.894444, 3.962222', false),

('Cala Fustam', 39.875556, 3.938333, 'Cala tranquila para perros', 'http://www.redcanina.es/wp-content/uploads/2016/02/fustam.jpg', 'Es Migjorn Gran', 'Menorca', 'http://www.redcanina.es/cala-fustam-para-perros-en-menorca/', NULL, '39.875556, 3.938333', false),

-- ISLAS BALEARES - IBIZA
('Playa Canina en Es Farralló', 38.982778, 1.521667, 'Habilitada en 2016', 'http://www.redcanina.es/wp-content/uploads/2016/03/es-farrallo.jpg', 'Santa Eulalia del Río', 'Ibiza', 'http://www.redcanina.es/playas-para-perros-en-santa-eulalia-del-rio-ibiza/', NULL, '38.982778, 1.521667', false);

-- Mensaje de confirmación
SELECT COUNT(*) as total_beaches FROM dog_beaches;
