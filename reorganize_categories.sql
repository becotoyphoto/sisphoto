-- Reorganizar categorias na nova ordem
UPDATE categories SET display_order = 1 WHERE slug = 'futebol';
UPDATE categories SET display_order = 2 WHERE slug = 'crossfit';
UPDATE categories SET display_order = 3 WHERE slug = 'ciclismo';
UPDATE categories SET display_order = 4 WHERE slug = 'beach-tennis';
UPDATE categories SET display_order = 5 WHERE slug = 'futsal';
UPDATE categories SET display_order = 6 WHERE slug = 'corrida';
UPDATE categories SET display_order = 7 WHERE slug = 'natacao';
UPDATE categories SET display_order = 8 WHERE slug = 'volei';
UPDATE categories SET display_order = 9 WHERE slug = 'futevolei';
UPDATE categories SET display_order = 10 WHERE slug = 'eventos';
UPDATE categories SET display_order = 11 WHERE slug = 'basquete';
UPDATE categories SET display_order = 12 WHERE slug = 'artes-marciais';
UPDATE categories SET display_order = 13 WHERE slug = 'surf';
UPDATE categories SET display_order = 14 WHERE slug = 'motociclismo';
UPDATE categories SET display_order = 15 WHERE slug = 'formaturas';
UPDATE categories SET display_order = 16 WHERE slug = 'jiu-jitsu';
UPDATE categories SET display_order = 17 WHERE slug = 'grau';
UPDATE categories SET display_order = 18 WHERE slug = 'padel';
UPDATE categories SET display_order = 19 WHERE slug = 'teatro';
UPDATE categories SET display_order = 20 WHERE slug = 'tenis';
UPDATE categories SET display_order = 21 WHERE slug = 'canoa-havanaina';
UPDATE categories SET display_order = 22 WHERE slug = 'festas';
UPDATE categories SET display_order = 23 WHERE slug = 'automotiva';
UPDATE categories SET display_order = 24 WHERE slug = 'mountain-bike';
UPDATE categories SET display_order = 25 WHERE slug = 'treinos';
UPDATE categories SET display_order = 26 WHERE slug = 'ginastica';
UPDATE categories SET display_order = 27 WHERE slug = 'hipismo';
UPDATE categories SET display_order = 28 WHERE slug = 'kite-surf';
UPDATE categories SET display_order = 29 WHERE slug = 'trilhas';
UPDATE categories SET display_order = 30 WHERE slug = 'altinha';

-- Inserir categorias faltantes
INSERT INTO categories (name, slug, display_order, image_url) 
VALUES ('Teatro e Musicais', 'teatro', 19, 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (slug) DO UPDATE SET display_order = 19;

INSERT INTO categories (name, slug, display_order, image_url) 
VALUES ('Canoa Havanaina', 'canoa-havanaina', 21, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (slug) DO UPDATE SET display_order = 21;

INSERT INTO categories (name, slug, display_order, image_url) 
VALUES ('Hipismo', 'hipismo', 27, 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (slug) DO UPDATE SET display_order = 27;

INSERT INTO categories (name, slug, display_order, image_url) 
VALUES ('Kite Surf', 'kite-surf', 28, 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (slug) DO UPDATE SET display_order = 28;

INSERT INTO categories (name, slug, display_order, image_url) 
VALUES ('Trilhas', 'trilhas', 29, 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (slug) DO UPDATE SET display_order = 29;

INSERT INTO categories (name, slug, display_order, image_url) 
VALUES ('Altinha', 'altinha', 30, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (slug) DO UPDATE SET display_order = 30;

-- Verificar resultado
SELECT name, slug, display_order FROM categories ORDER BY display_order NULLS LAST;
