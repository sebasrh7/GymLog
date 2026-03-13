export interface SerieRealizada {
  id?: number;
  sesion_id: number;
  ejercicio_id: number;
  ejercicio_nombre?: string;
  serie_numero: number;
  peso: number;
  reps: number;
  completado: boolean;
  nota?: string;
}

export interface Sesion {
  id: number;
  fecha: string;
  rutina_id?: number;
  rutina_nombre?: string;
  duracion_seg?: number;
  total_series?: number;
  volumen_total?: number;
  series?: SerieRealizada[];
}
