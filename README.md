# 💪 GymLog — App de Entrenamiento Offline

App React Native + TypeScript para registrar entrenamientos en el gimnasio.
Funciona **100% offline** con SQLite como base de datos local.

---

## Requisitos previos

- Node.js >= 18
- React Native CLI (no Expo)
- Android Studio (para Android) o Xcode (para iOS)
- JDK 17 (Android)

---

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. iOS — instalar pods

```bash
cd ios && pod install && cd ..
```

### 3. Ejecutar

```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

---

## Funcionalidades

- ✅ Crear rutinas personalizadas
- ✅ Biblioteca de 26 ejercicios precargados (agrupados por músculo)
- ✅ Configurar series, reps, peso y descanso por ejercicio
- ✅ Pantalla de entrenamiento con botones +/- para ajustar peso/reps
- ✅ Temporizador de descanso automático con opción de saltarlo
- ✅ Historial de entrenamientos
- ✅ Backup y restauración en JSON
- ✅ 100% offline — SQLite local

---

## Estructura del proyecto

```
src/
├── database/       # SQLite: init, migraciones, seed inicial
├── models/         # Tipos TypeScript
├── services/       # Lógica de acceso a datos
├── hooks/          # Custom hooks (useRutinas, useTimer, useSesion...)
├── screens/        # Pantallas de la app
├── components/     # Componentes reutilizables
├── navigation/     # Stack navigator
└── utils/          # Tema, colores, formatters
```

---

## Base de datos (SQLite)

Tablas:
- `ejercicios` — biblioteca de ejercicios
- `rutinas` — rutinas del usuario
- `rutina_ejercicios` — ejercicios asignados a cada rutina con su configuración
- `sesiones` — cada vez que el usuario entrena
- `series_realizadas` — registro de cada serie completada

---

## Backup

```typescript
import { backupService } from './src/services/backupService';

// Exportar
const rutaArchivo = await backupService.exportar();

// Importar
await backupService.importar('/ruta/al/backup.json');
```

---

## Paquetes instalados

| Paquete | Uso |
|---|---|
| `react-native-sqlite-storage` | Base de datos local |
| `@react-navigation/native` + `stack` | Navegación |
| `react-native-screens` | Optimización navegación |
| `react-native-gesture-handler` | Gestos |
| `react-native-reanimated` | Animaciones |
| `react-native-fs` | Sistema de archivos (backup) |

---

## Notas

- El archivo `src/hooks/index.ts` exporta todos los hooks desde un solo lugar.
- El archivo `src/models/index.ts` exporta todos los tipos desde un solo lugar.
- La base de datos se inicializa automáticamente al primera vez que se abre la app.
- Los 26 ejercicios del seed solo se insertan si la tabla está vacía.
