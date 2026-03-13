import { useState, useEffect, useCallback } from 'react';
import { Rutina } from '../models';
import { rutinaService } from '../services/rutinaService';

export const useRutinas = () => {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rutinaService.getAll();
      setRutinas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { rutinas, loading, recargar: cargar };
};
