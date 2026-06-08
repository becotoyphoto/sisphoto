export function formatPrice(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `R$ ${num.toFixed(2)}`;
}

export function formatLocalDate(value: string): string {
  if (!value) {
    return '';
  }

  // Treat YYYY-MM-DD as a calendar date instead of UTC midnight to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  }

  return new Date(value).toLocaleDateString('pt-BR');
}
