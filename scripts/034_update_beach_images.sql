-- Update beach images with corrected URLs extracted from KML description field
-- Images will be uploaded to Vercel Blob Storage

-- Playa de la Gola
UPDATE dog_beaches SET image_url = 'https://mymaps.usercontent.google.com/hostedimage/m/*/3AKcrxGTTuMoVACaIRlc5HZjJdYrQpt5j7bn9hz-u81o_BXTQKlBszvCQaAZ-RqkGLaTJTODXD8z7lT6GWJHJNty55tT10VaVLartKS8t0OQGnhq7dnCgTndIXPDOGLsKtooWk6FJY52hiRK4ec4fJ6gcTAvYcLK1WfK-tc8QuM_3fI3Jkp9diM_xvIV6XCL0u39Ws68GGT2Bw_H6Kw?authuser=0&fife=s16383' WHERE name = 'Playa de la Gola';

-- For now, we'll use the Google URLs directly
-- Later, run the process_beach_images.ts script to upload them to Blob Storage
