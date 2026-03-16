import React, { createContext, useContext, useState, useEffect } from 'react';
import { preferences } from './preferences';

export type WeightUnit = 'kg' | 'lb';

interface UnidadContextType {
  unidad: WeightUnit;
  setUnidad: (u: WeightUnit) => void;
}

const UnidadContext = createContext<UnidadContextType>({
  unidad: 'kg',
  setUnidad: () => {},
});

export const UnidadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unidad, setUnidadState] = useState<WeightUnit>('kg');

  useEffect(() => {
    preferences.getUnidad().then(setUnidadState).catch(() => {});
  }, []);

  const setUnidad = (u: WeightUnit) => {
    setUnidadState(u);
    preferences.setUnidad(u).catch(() => {});
  };

  return (
    <UnidadContext.Provider value={{ unidad, setUnidad }}>
      {children}
    </UnidadContext.Provider>
  );
};

export const useUnidad = () => useContext(UnidadContext);
