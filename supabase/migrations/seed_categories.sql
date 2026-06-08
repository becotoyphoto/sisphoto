-- Inserir categorias de exemplo (se não existirem)
INSERT INTO categories (name, slug, image_url)
SELECT 'Futebol', 'futebol', '/images/categorias/futebol.jpg'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'futebol');

INSERT INTO categories (name, slug, image_url)
SELECT 'Crossfit', 'crossfit', '/images/categorias/crossfit.jpg'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'crossfit');

INSERT INTO categories (name, slug, image_url)
SELECT 'Beach Tennis', 'beach-tennis', '/images/categorias/beach-tennis.jpg'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'beach-tennis');

INSERT INTO categories (name, slug, image_url)
SELECT 'Corrida', 'corrida', '/images/categorias/corrida.jpg'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'corrida');

INSERT INTO categories (name, slug, image_url)
SELECT 'Formatura', 'formatura', '/images/categorias/formatura.jpg'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'formatura');

INSERT INTO categories (name, slug, image_url)
SELECT 'Eventos', 'eventos', '/images/categorias/eventos.jpg'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'eventos');
