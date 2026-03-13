export type TipoSerie = 'normal' | 'superserie' | 'dropset' | 'rest_pause';

export const TIPO_SERIE_LABELS: Record<TipoSerie, string> = {
  normal: 'Normal',
  superserie: 'Superserie',
  dropset: 'Drop Set',
  rest_pause: 'Rest-Pause',
};

export interface RutinaEjercicio {
  id: number;
  rutina_id: number;
  ejercicio_id: number;
  ejercicio_nombre: string;
  grupo_muscular: string;
  orden: number;
  series: number;
  repeticiones: number;
  peso_objetivo: number;
  descanso: number;
  tipo_serie: TipoSerie;
  grupo_serie?: number | null;
}

export interface Rutina {
  id: number;
  nombre: string;
  dia_semana?: string;
  ejercicios?: RutinaEjercicio[];
}
