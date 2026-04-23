export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatMonthYear = (date: string | Date): string =>
  new Date(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export const formatShortDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const formatMonthDay = (date: string | Date): string =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
