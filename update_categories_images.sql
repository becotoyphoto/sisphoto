-- Atualizar TODAS as URLs de imagem das categorias no banco de dados
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=400' WHERE slug = 'futebol';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400' WHERE slug = 'crossfit';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1461088945293-0c17689e48ac?auto=format&fit=crop&q=80&w=400' WHERE slug = 'ciclismo';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400' WHERE slug = 'beach-tennis';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400' WHERE slug = 'futsal';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=400' WHERE slug = 'corrida';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1571769179820-c9ba4337d3e5?auto=format&fit=crop&q=80&w=400' WHERE slug = 'natacao';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=400' WHERE slug = 'volei';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400' WHERE slug = 'futevolei';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400' WHERE slug = 'eventos';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400' WHERE slug = 'basquete';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400' WHERE slug = 'artes-marciais';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400' WHERE slug = 'surf';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400' WHERE slug = 'motociclismo';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1529364065248-1aa50076495d?auto=format&fit=crop&q=80&w=400' WHERE slug = 'formaturas';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400' WHERE slug = 'jiu-jitsu';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400' WHERE slug = 'grau';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=400' WHERE slug = 'padel';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=400' WHERE slug = 'tenis';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400' WHERE slug = 'festas';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=400' WHERE slug = 'automotiva';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?auto=format&fit=crop&q=80&w=400' WHERE slug = 'mountain-bike';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400' WHERE slug = 'treinos';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&q=80&w=400' WHERE slug = 'ginastica';

-- Verificar se todas foram atualizadas
SELECT name, slug, image_url FROM categories ORDER BY name;
