import { useState, useCallback } from 'react';
import { SerieRealizada } from '../models';
import { sesionService } from '../services/sesionService';

export const useSesion = () => {
  const [sesionId, setSesionId] = useState<number | null>(null);
  const [series, setSeries] = useState<SerieRealizada[]>([]);

  const iniciarSesion = useCallback(async (rutinaId?: number) => {
    const id = await sesionService.crear(rutinaId);
    setSesionId(id);
    setSeries([]);
    return id;
  }, []);

  const completarSerie = useCallback(
    async (ejercicioId: number, serieNumero: number, peso: number, reps: number) => {
      if (!sesionId) return;
      const serie: SerieRealizada = {
        sesion_id: sesionId,
        ejercicio_id: ejercicioId,
        serie_numero: serieNumero,
        peso, reps, completado: true,
      };
      await sesionService.guardarSerie(serie);
      setSeries(prev => [...prev, serie]);
    },
    [sesionId],
  );

  return { sesionId, series, iniciarSesion, completarSerie };
};
