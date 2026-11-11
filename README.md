# Nexus

Aplicación móvil para conectar estudiantes con proyectos interdisciplinarios:
explora proyectos, postúlate a un rol, arma tu equipo y organiza el trabajo en
un espacio con tareas, calendario y progreso.

Esta es la versión React Native / Expo del proyecto Flutter
[Proyecto1-Movil](https://github.com/FranzeskoRCH/Proyecto1-Movil). Conserva las
pantallas, los flujos y el modelo de datos del original.

[Video](link video)

**Equipo:** Jose Ballestas (@JandoBR), Daniel Gomez (@mariskit), Nicolas Muvdi
(@Muvdi1805), Francesco Rosa (@FranzeskoRCH) · Grupo 6.

## Stack

- [Expo SDK 57](https://docs.expo.dev/) · React Native 0.86 · React 19
- React Navigation 7 (stack + bottom tabs)
- [React Native Paper](https://callstack.github.io/react-native-paper/) (Material 3)
- `expo-secure-store` para la sesión, `expo-linear-gradient` y
  `@react-native-community/datetimepicker`
- [`roble-client`](https://www.npmjs.com/package/roble-client), el SDK oficial
  de Roble para JavaScript/React Native
- Jest y React Native Testing Library

## Requisitos

- **Node.js 24 LTS** (mínimo 22.13 o 24.3). Con nvm o fnm basta `nvm use`.
- En NixOS no instale nada a mano: el `flake.nix` trae Node 24, el JDK 17 y el
  SDK de Android.

## Empezar

```bash
npm install
npm start
```

Abre la app en [Expo Go](https://expo.dev/go) escaneando el QR, o pulsa `a` /
`i` para el emulador o simulador.

Para llegar al servidor desde fuera de la red local con el equipo y el teléfono
en la misma tailnet:

```bash
npm run start:tailscale
```

Metro ya escucha en `0.0.0.0`; el script además anuncia la IP de Tailscale
(`tailscale ip -4`), de modo que el QR apunta a esa interfaz.

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo (Expo Go) |
| `npm run start:tailscale` | Igual, anunciando la IP de Tailscale |
| `npm run android` / `ios` / `web` | Compila y abre en la plataforma |
| `npm run lint` | ESLint con la configuración de Expo |
| `npx tsc --noEmit` | Verificación de tipos |
| `npm test` | Jest en modo watch |
| `npm run test:ci` | Jest una sola vez |

## Estructura

```
App.tsx                      # Providers, splash y navegación raíz
src/
  core/
    roble/                   # Adaptador sobre roble-client (sesión y datos)
    theme/                   # Colores y tema de Paper
    date-labels.ts           # Fechas en español
    project-share.ts         # Enlaces y mensajes para compartir
    di/                      # Contenedor de dependencias
  features/
    auth/                    # Login, registro y sesión
    home/                    # Inicio y proyectos del colaborador
    explore/                 # Lista, detalle y solicitud de ingreso
    create/                  # Publicar un proyecto
    project/                 # Mis proyectos y gestión del equipo
    profile/                 # Perfil propio y público
    workspace/               # Tareas, calendario y registro
  navigation/                # Stack raíz y pestañas
  ui/                        # Componentes, diálogos, snackbars y campos
```

Cada feature separa `domain` (modelos), `data` (repositorio contra Roble) y
`screens`. El contenedor de dependencias (`src/core/di/appContainer.ts`) es el
único lugar que conoce las implementaciones concretas.

## Datos y Roble

La app usa el proyecto `movildev_bf7ee89e6e` de Roble a través del SDK oficial
`roble-client`, el mismo que usa la versión Flutter. La URL y el contrato están
en `src/core/roble/constants.ts`; la sesión se persiste en
`expo-secure-store`.

Tablas usadas: `project`, `project_category`, `project_role`, `project_member`,
`application`, `collaborator`, `collaborator_skill`, `collaborator_interest`,
`project_task` y `project_event`.

Consultas guardadas que la app intenta usar (si no existen, cae a lecturas por
tabla):

- `proyectos_completos` para la lista de exploración.
- `proyecto_completo` para el detalle.
- `proyectos_paginados` y `buscar_proyectos` para el respaldo paginado.
- `postulaciones_de_proyecto` y `responder_postulacion` para gestionar
  postulaciones.

Si la lectura de proyectos falla por completo, la exploración muestra dos
proyectos de ejemplo para que la interfaz siga siendo navegable.

La sesión se guarda cifrada en el llavero/Keystore con `expo-secure-store` (en
web se usa AsyncStorage) y se restaura al arrancar.

## Shell de Nix

```bash
nix develop
```

El shell configura `ANDROID_HOME`, `JAVA_HOME` y añade `adb` al `PATH`. Para
lint, pruebas y web sin SDK de Android: `nix develop .#js`.

## Pruebas

```bash
npm run test:ci
npx tsc --noEmit
npm run lint
```

La suite cubre utilidades de fechas y enlaces, el cálculo de afinidad, el
adaptador del SDK de Roble (auth, CRUD, consultas y errores) y un smoke test del
arranque de la app.
