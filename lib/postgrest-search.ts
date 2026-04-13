export function sanitizePostgrestSearchTerm(search: string) {
  return search
    .trim()
    .replace(/[%(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildIlikeSearchClauses(fields: string[], search: string) {
  const sanitizedSearch = sanitizePostgrestSearchTerm(search);

  if (!sanitizedSearch) {
    return [];
  }

  return fields.map(field => `${field}.ilike.%${sanitizedSearch}%`);
}
