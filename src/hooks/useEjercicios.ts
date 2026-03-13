import { useState, useEffect, useCallback } from 'react';
import { Ejercicio } from '../models';
import { ejercicioService } from '../services/ejercicioService';

export const useEjercicios = (grupo?: string) => {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [data, gs] = await Promise.all([
        grupo ? ejercicioService.getByGrupo(grupo) : ejercicioService.getAll(),
        ejercicioService.getGrupos(),
      ]);
      setEjercicios(data);
      setGrupos(gs);
    } finally {
      setLoading(false);
    }
  }, [grupo]);

  useEffect(() => { cargar(); }, [cargar]);

  return { ejercicios, grupos, loading, recargar: cargar };
};
