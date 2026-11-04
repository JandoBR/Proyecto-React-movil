import { Share } from 'react-native';

export const PROJECT_LINK_BASE = 'https://nexus-app.uninorte.edu.co/proyecto';

export function projectShareLink(projectId: string): string {
  return `${PROJECT_LINK_BASE}/${projectId}`;
}

export function buildProjectShareMessage({
  projectId,
  title,
  description = '',
}: {
  projectId: string;
  title: string;
  description?: string;
}): string {
  const lines = ['¡Mira este proyecto en Nexus! 🚀', '', `"${title}"`];
  if (description.trim()) {
    lines.push('', description.trim());
  }
  lines.push('', projectShareLink(projectId));
  return lines.join('\n');
}

export async function shareProject({
  projectId,
  title,
  description = '',
}: {
  projectId: string;
  title: string;
  description?: string;
}): Promise<void> {
  await Share.share({
    title: `Proyecto en Nexus: ${title}`,
    message: buildProjectShareMessage({ projectId, title, description }),
  });
}
