# rn-uninorte-expo-template

Template base para el curso de React Native con Expo (Uninorte).

## Stack

- [Expo SDK 57](https://docs.expo.dev/) · React Native 0.86 · React 19.2
- Navegación con [React Navigation 7](https://reactnavigation.org/) (`NavigationContainer`, sin Expo Router)
- UI con [React Native Paper](https://callstack.github.io/react-native-paper/) (Material 3, tema claro/oscuro)
- Persistencia local con AsyncStorage
- Pruebas con Jest (`jest-expo`) y React Native Testing Library

## Requisitos

- **Node.js 24 LTS** (recomendado). Mínimo soportado: 22.13 o 24.3. Con nvm o fnm basta `nvm use` (lee `.nvmrc`).
- En NixOS no instale nada a mano: el `flake.nix` de este repositorio trae Node 24, el JDK 17 y el SDK de Android (ver [Shell de Nix](#shell-de-nix-nixos)).

## Crear un proyecto desde el template

```bash
npx create-expo-app@latest nombre-proyecto --template https://github.com/augustosalazar/rn-uninorte-expo-template
```

Esto descarga el template, renombra el proyecto (`name` y `slug`), instala las dependencias e inicializa un repositorio git.

Después de crearlo, cambie en `app.json` estos valores por unos propios:

- `scheme` (por defecto `myapp`): en minúsculas y sin espacios, por ejemplo `nombreproyecto`. Es el prefijo de los deep links (`nombreproyecto://...`); si dos apps instaladas comparten el mismo scheme, los enlaces pueden abrir la app equivocada.
- `android.package` e `ios.bundleIdentifier` (por defecto `com.example.myapp`): el identificador único de la app, por ejemplo `com.sunombre.nombreproyecto`. Dos apps con el mismo identificador se reemplazan entre sí en el dispositivo, y las tiendas rechazan `com.example`.

## Empezar

```bash
cd nombre-proyecto
npm start
```

Abre la app en [Expo Go](https://expo.dev/go) (escanee el QR o presione `a` / `i` para el emulador o simulador). `npx expo start` hace lo mismo.

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo (Expo Go) |
| `npm run android` / `ios` / `web` | Inicia y abre en la plataforma indicada |
| `npm run lint` | ESLint con la configuración de Expo |
| `npm test` | Jest en modo watch |
| `npm run test:ci` | Jest una sola vez (CI) |

## Estructura

El proyecto sigue una arquitectura limpia por funcionalidad (feature), con inyección de dependencias.

```
App.tsx                      # Providers (DI, features, Paper) + NavigationContainer
index.tsx                    # Punto de entrada (registerRootComponent)
src/
  core/
    di/
      container.ts           # Contenedor de dependencias (singletons por token)
      tokens.ts              # Un token por dependencia
      appContainer.ts        # Raíz de composición: qué implementación usa cada interfaz
      DIProvider.tsx         # Expone el contenedor con useDI()
    iLocalPreferences.ts     # Almacenamiento local (interfaz + implementación AsyncStorage)
  navigation/
    RootNavigator.tsx        # Stack raíz + tabs
    types.ts                 # Tipos de rutas y parámetros (navegación tipada)
  features/
    home/                    # Funcionalidad simple: solo una pantalla
    notes/                   # Funcionalidad de ejemplo con todas las capas
      domain/
        entities/            # Modelos (Note)
        repositories/        # Interfaces de repositorio (qué se puede hacer)
      data/
        datasources/         # Acceso a datos (interfaz + implementación local)
        repositories/        # Implementación del repositorio
      presentation/
        context/             # Estado de la funcionalidad (NotesProvider, useNotes)
        screens/             # Pantallas
  theme/                     # Colores claro/oscuro y temas de Paper
__tests__/                   # Pruebas (unitarias, de pantalla y de flujo)
```

### Reglas de dependencia

- `presentation` → `domain`: las pantallas usan el contexto, y el contexto usa la **interfaz** del repositorio, obtenida con `useDI()`.
- `data` → `domain`: las implementaciones cumplen las interfaces del dominio.
- `domain` no importa nada de `data`, `presentation`, React ni librerías externas.
- Solo `core/di/appContainer.ts` conoce las clases concretas. Para cambiar el almacenamiento (por ejemplo a un backend remoto) se crea otro data source y se cambia ahí; las pantallas no cambian.

### Agregar una funcionalidad

1. Copie `src/features/notes/` con el nuevo nombre y defina la entidad y la interfaz del repositorio en `domain/`.
2. Implemente el data source y el repositorio en `data/`.
3. Agregue sus tokens en `tokens.ts` y regístrelos en `appContainer.ts`.
4. Cree el provider y las pantallas en `presentation/`; agregue el provider en `App.tsx` y las rutas en `navigation/types.ts` y `RootNavigator.tsx`.
5. Para probar pantallas sin almacenamiento real, pase un contenedor con dobles de prueba: `<DIProvider container={...}>` (ver `__tests__/features/notes/NoteListScreen.test.tsx`).

La funcionalidad `notes` es solo un ejemplo: puede borrarla (carpeta, tokens, registro en `appContainer.ts`, provider, rutas y pruebas) cuando ya no la necesite.

## Compilar la app nativa

Expo Go basta para el día a día. Para ver el ícono y el splash propios, o para usar librerías nativas fuera del SDK de Expo, compile e instale la app en un emulador o dispositivo:

```bash
npx expo run:android   # o npx expo run:ios
```

Esto requiere Android Studio (o Xcode en macOS) y los identificadores `android.package` / `ios.bundleIdentifier` de `app.json`. Si más adelante necesita las herramientas de un development build (menú de desarrollo, cambiar de servidor), instale `expo-dev-client` con `npx expo install expo-dev-client`.

## Shell de Nix (NixOS)

En NixOS el toolchain sale del `flake.nix`, así que no hace falta Android Studio ni instalar el SDK a mano:

```bash
nix develop            # Node 24, JDK 17, SDK de Android, adb
npm start              # Metro / Expo Go
npx expo run:android   # compila, instala y arranca en el teléfono conectado
```

El shell exporta `ANDROID_HOME`, `ANDROID_SDK_ROOT` y `JAVA_HOME`, y pone `adb` (de platform-tools) en el `PATH`. El teléfono se ve con `adb devices`; si no aparece, revise el cable y acepte "Depuración USB" en el teléfono.

Sin el SDK (solo lint, Jest, web) está el shell pequeño:

```bash
nix develop .#js --command npm run test:ci
```

### Qué versiones fija `flake.nix`

Las que pide React Native 0.86 / Expo SDK 57: `compileSdk` 36, build-tools 36.0.0, NDK 27.1.12297006 y CMake 3.22.1. El SDK vive en el almacén de Nix, que es de solo lectura, así que nada se puede descargar "por su cuenta" al compilar. Cuando una compilación nombre una versión que falta:

```
Failed to find Build Tools revision 37.0.0
```

agréguela a `buildToolsVersions` (o `platformVersions` / `ndkVersions` / `cmakeVersions`) en `flake.nix` y vuelva a entrar al shell. Para actualizar el toolchain completo: `nix flake update`.

### El plugin `with-nix-android`

`plugins/with-nix-android.js` es un config plugin que, solo cuando corre dentro del shell de Nix, agrega dos líneas a `android/gradle.properties` al generar el proyecto nativo:

- `android.builder.sdkDownload=false`: si falta un componente del SDK, el error lo nombra en vez de fallar con un permiso denegado.
- `android.aapt2FromMavenOverride=...`: usa el `aapt2` del SDK de Nix; el que Gradle descarga de Maven no arranca en NixOS (busca `/lib64/ld-linux-x86-64.so.2`).

Fuera de Nix (`ANDROID_HOME` fuera de `/nix/store`, por ejemplo en EAS Build) el plugin no hace nada. La carpeta `android/` está en `.gitignore` y se regenera con `npx expo prebuild --platform android`.

## Ícono y splash screen

Las imágenes en `assets/images/` son **placeholders** ("RN" sobre el color primario del tema). Reemplácelas conservando nombre y tamaño; no hace falta tocar `app.json`.

| Archivo | Tamaño | Uso |
|---|---|---|
| `icon.png` | 1024×1024, opaco, sin esquinas redondeadas | Ícono iOS y por defecto |
| `android-icon-foreground.png` | 512×512, fondo transparente, logo dentro del 66 % central | Ícono adaptativo Android (capa frontal) |
| `android-icon-background.png` | 512×512 | Ícono adaptativo Android (fondo) |
| `android-icon-monochrome.png` | 432×432, blanco sobre transparente | Ícono temático Android 13+ |
| `splash-icon.png` | 1024×1024, fondo transparente | Logo del splash (se muestra a 200 px de ancho) |
| `favicon.png` | 48×48 | Web |

Los colores de fondo del splash (claro/oscuro) y del ícono adaptativo se definen en `app.json`. El splash permanece visible mientras `App.tsx` termina de cargar (función `prepare`); agregue ahí lo que la primera pantalla necesite.

Los cambios de ícono y splash solo se ven en un build nativo nuevo (`npx expo run:android` / `run:ios`), no en Expo Go.

## Actualizar Expo

```bash
npx expo install expo@^<versión> --fix
npx expo-doctor
```

Después de actualizar, revise la versión de Node que exige React Native (`engines.node` en `node_modules/react-native/package.json`) y ajuste `engines` en `package.json`, `.nvmrc` y la sección de requisitos.
