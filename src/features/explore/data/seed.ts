import { Project } from '../domain/models';

export const SEED_PROJECTS: Project[] = [
  {
    id: 'p1',
    authorId: '',
    title: 'EcoCampus Sorter',
    description:
      'Una estación de clasificación con IA enfocada en plástico y residuos de comercio para maximizar los flujos de reciclaje directo.',
    vision:
      'El EcoCampus Smart Sorter busca colocar nodos de clasificación con visión por computadora en los principales puntos de comida del campus. Identificará visualmente residuos compostables, reciclables y de relleno para guiar a los usuarios al instante, reduciendo las tasas de contaminación de residuos en el campus.',
    authorName: 'Kira Vance',
    authorCareer: 'Ciencias Ambientales',
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=47',
    categories: ['Impacto Social', 'Medio Ambiente', 'Tech'],
    matchPercentage: 87,
    imageUrl: 'https://picsum.photos/seed/ecocampus/800/400',
    vacancies: 3,
    roles: [
      { name: 'Visión por Computadora', hasSkill: true },
      { name: 'Diseño UI/UX', hasSkill: true },
      { name: 'Ciencias Ambientales', hasSkill: false },
      { name: 'Modelo de Negocio', hasSkill: false },
    ],
    members: [
      {
        name: 'Kira',
        avatarUrl: 'https://i.pravatar.cc/150?img=47',
        discipline: 'Arte',
      },
      {
        name: 'Tyler',
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
        discipline: 'Sist. Embebidos',
      },
    ],
    requestedToJoin: false,
  },
  {
    id: 'p2',
    authorId: '',
    title: 'MetaAlert Smart Watch',
    description:
      'Monitoreo biométrico de bajo coste para detectar emergencias, diseñado específicamente para centros de atención a adultos mayores.',
    vision:
      'MetaAlert es un reloj inteligente de bajo coste que monitorea signos vitales y detecta caídas o emergencias médicas en adultos mayores. El objetivo es alertar de inmediato a cuidadores y centros de atención, reduciendo los tiempos de respuesta ante incidentes críticos.',
    authorName: 'Marcos Chen',
    authorCareer: 'Ingeniería Biomédica',
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=15',
    categories: ['Investigación Académica', 'Salud', 'Tecnología'],
    matchPercentage: 84,
    imageUrl: 'https://picsum.photos/seed/metaalert/800/400',
    vacancies: 2,
    roles: [
      { name: 'Ingeniería Biomédica', hasSkill: true },
      { name: 'IoT', hasSkill: false },
      { name: 'Gestión', hasSkill: false },
    ],
    members: [
      {
        name: 'Marcos',
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
        discipline: 'Biomédica',
      },
    ],
    requestedToJoin: false,
  },
];

export function seedProjects(): Project[] {
  return SEED_PROJECTS.map((project) => ({
    ...project,
    categories: [...project.categories],
    roles: project.roles.map((role) => ({ ...role })),
    members: project.members.map((member) => ({ ...member })),
  }));
}
