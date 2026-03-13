import RNFS from 'react-native-fs';

const RUTA = `${RNFS.DocumentDirectoryPath}/sesion_activa.json`;

export interface SesionActivaState {
  sesionId: number;
  rutinaId: number;
  ejercicioIndex: number;
  serieActual: number;
  seriesCompletadas: string[]; // claves "index-serie"
  peso: string;
  reps: string;
  timestamp: number;
}

export const sesionActivaService = {
  guardar: async (state: SesionActivaState): Promise<void> => {
    try {
      await RNFS.writeFile(RUTA, JSON.stringify(state), 'utf8');
    } catch (error) {
      console.error('Error guardando sesión activa:', error);
    }
  },

  cargar: async (): Promise<SesionActivaState | null> => {
    try {
      const exists = await RNFS.exists(RUTA);
      if (!exists) return null;
      const json = await RNFS.readFile(RUTA, 'utf8');
      const state: SesionActivaState = JSON.parse(json);
      // Expirar sesiones de más de 4 horas
      if (Date.now() - state.timestamp > 4 * 60 * 60 * 1000) {
        await sesionActivaService.limpiar();
        return null;
      }
      return state;
    } catch {
      return null;
    }
  },

  limpiar: async (): Promise<void> => {
    try {
      const exists = await RNFS.exists(RUTA);
      if (exists) await RNFS.unlink(RUTA);
    } catch {
      // No pasa nada
    }
  },
};
