const localCategoryImages: Record<string, string> = {
  futebol: '/images/categorias/futebol.webp',
  'beach-tennis': '/images/categorias/bechtenis.webp',
  ciclismo: '/images/categorias/ciclismo.webp',
  formaturas: '/images/categorias/formatura.webp',
  futsal: '/images/categorias/futsal.webp',
  futevolei: '/images/categorias/futvolei.webp',
  'jiu-jitsu': '/images/categorias/jui-jutsu.webp',
  natacao: '/images/categorias/natação.webp',
  automotiva: '/images/categorias/automotivo.webp',
  corrida: '/images/categorias/corrida.webp',
  grau: '/images/categorias/grau.webp',
  motociclismo: '/images/categorias/motocilismo.webp',
  padel: '/images/categorias/padel.png',
};

const fallbackCategoryImages: Record<string, string> = {
  eventos: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400',
  volei: '/images/categorias/futvolei.webp',
  basquete: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400',
  'artes-marciais': '/images/categorias/jui-jutsu.webp',
  surf: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400',
  crossfit: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  teatro: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=400',
  tenis: '/images/categorias/padel.png',
  'canoa-havanaina': 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=400',
  festas: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400',
  'mountain-bike': '/images/categorias/ciclismo.webp',
  treinos: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  ginastica: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&q=80&w=400',
  hipismo: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400',
  'kite-surf': 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400',
  trilhas: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400',
  altinha: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400',
};

const slugAliases: Record<string, string> = {
  'beachtennis': 'beach-tennis',
  'beach_tennis': 'beach-tennis',
  'beach-tenis': 'beach-tennis',
  'beach-tennis': 'beach-tennis',
  'fute-volei': 'futevolei',
  'futevolei': 'futevolei',
  'jiu-jitsu': 'jiu-jitsu',
  'jiu-jítsu': 'jiu-jitsu',
  'jiu-jitsu-no-gi': 'jiu-jitsu',
  'natacao': 'natacao',
  'natação': 'natacao',
  'canoa-havaiana': 'canoa-havanaina',
  'canoa-havanaina': 'canoa-havanaina',
  'mountain-bike': 'mountain-bike',
  'montain-bike': 'mountain-bike',
  'motociclismo': 'motociclismo',
  'motocilismo': 'motociclismo',
};

function normalizeSlug(slug: string) {
  const normalized = slug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '-');

  return slugAliases[normalized] || normalized;
}

export function getCategoryImageUrl(slug: string, imageUrl?: string | null) {
  if (imageUrl) {
    return imageUrl;
  }

  const normalizedSlug = normalizeSlug(slug);

  return (
    localCategoryImages[normalizedSlug] ||
    fallbackCategoryImages[normalizedSlug] ||
    fallbackCategoryImages.eventos
  );
}
