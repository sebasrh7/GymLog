import RNFS from 'react-native-fs';
import { TipoSerie } from '../models';

const RUTA = `${RNFS.DocumentDirectoryPath}/sesion_activa.json`;

export interface SesionActivaEjercicio {
  ejercicioId: number;
  ejercicioNombre: string;
  grupoMuscular: string;
  series: Array<{
    peso: string;
    reps: string;
    completada: boolean;
    nota?: string;
  }>;
  descanso: number;
  tipoSerie: TipoSerie;
  grupoSerie?: number | null;
  collapsed: boolean;
}

export interface SesionActivaState {
  sesionId: number;
  rutinaId: number | null;
  ejerciciosActivos: SesionActivaEjercicio[];
  timestamp: number;
}

export const sesionActivaService = {
  guardar: async (state: SesionActivaState): Promise<void> => {
    try {
      await RNFS.writeFile(RUTA, JSON.stringify(state), 'utf8');
    } catch (error) {
      __DEV__ && console.error('Error guardando sesión activa:', error);
    }
  },

  cargar: async (): Promise<SesionActivaState | null> => {
    try {
      const exists = await RNFS.exists(RUTA);
      if (!exists) return null;
      const json = await RNFS.readFile(RUTA, 'utf8');
      const state = JSON.parse(json);
      // Backward compat: discard old linear format
      if (!state.ejerciciosActivos) {
        await sesionActivaService.limpiar();
        return null;
      }
      // Expirar sesiones de más de 4 horas
      if (Date.now() - state.timestamp > 4 * 60 * 60 * 1000) {
        await sesionActivaService.limpiar();
        return null;
      }
      return state as SesionActivaState;
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
