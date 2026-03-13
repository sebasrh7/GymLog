export const formatFecha = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatHora = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

export const formatSegundos = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}:${String(sec).padStart(2, '0')}`;
  return `${sec}s`;
};

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);
