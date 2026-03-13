import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (segundosIniciales: number) => {
  const [segundos, setSegundos] = useState(segundosIniciales);
  const [activo, setActivo] = useState(false);
  const duracionRef = useRef(segundosIniciales);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detener = useCallback(() => {
    setActivo(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const iniciar = useCallback((duracion?: number) => {
    const d = duracion ?? duracionRef.current;
    duracionRef.current = d;
    setSegundos(d);
    setActivo(true);
  }, []);

  const resetear = useCallback((duracion?: number) => {
    detener();
    const d = duracion ?? duracionRef.current;
    setSegundos(d);
  }, [detener]);

  useEffect(() => {
    if (!activo) return;
    intervalRef.current = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) { setActivo(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activo]);

  const porcentaje = duracionRef.current > 0 ? segundos / duracionRef.current : 0;
  return { segundos, activo, porcentaje, iniciar, detener, resetear };
};
