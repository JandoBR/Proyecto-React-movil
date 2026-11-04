const ACCENTS: Record<string, string> = {
  á: 'a', à: 'a', ä: 'a', â: 'a', ã: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o', õ: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n', ç: 'c',
};

function normalize(value: string): string {
  const lowered = value.toLowerCase();
  let replaced = '';
  for (const char of lowered) replaced += ACCENTS[char] ?? char;
  return replaced
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(normalized: string): Set<string> {
  return new Set(normalized.split(' ').filter((token) => token.length >= 3));
}

function matches(a: string, b: string): boolean {
  if (a === b) return true;
  const left = tokens(a);
  for (const token of tokens(b)) if (left.has(token)) return true;
  return false;
}

function overlapRatio(userTags: Set<string>, projectTags: Set<string>): number {
  if (projectTags.size === 0) return 0;
  let matched = 0;
  for (const project of projectTags) {
    let found = false;
    for (const user of userTags) {
      if (matches(user, project)) {
        found = true;
        break;
      }
    }
    if (found) matched += 1;
  }
  return matched / projectTags.size;
}

function normalizeAll(values: string[]): Set<string> {
  return new Set(values.map(normalize).filter(Boolean));
}

export function computeMatch({
  userSkills,
  userInterests,
  projectRoles,
  projectCategories,
}: {
  userSkills: string[];
  userInterests: string[];
  projectRoles: string[];
  projectCategories: string[];
}): number {
  const skills = normalizeAll(userSkills);
  const interests = normalizeAll(userInterests);
  const roles = normalizeAll(projectRoles);
  const categories = normalizeAll(projectCategories);

  const categoryScore = overlapRatio(interests, categories);
  const roleScore = overlapRatio(skills, roles);
  const hasCategories = categories.size > 0;
  const hasRoles = roles.size > 0;

  let score: number;
  if (hasCategories && hasRoles) score = 0.5 * categoryScore + 0.5 * roleScore;
  else if (hasCategories) score = categoryScore;
  else if (hasRoles) score = roleScore;
  else return 0;

  return Math.max(0, Math.min(100, Math.round(score * 100)));
}
