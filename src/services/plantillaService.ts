import { Alert } from 'react-native';
import { rutinaService } from './rutinaService';
import { ejercicioService } from './ejercicioService';

export interface PlantillaEjercicio {
  nombre: string;
  grupo_muscular: string;
  series: number;
  repeticiones: number;
  descanso: number;
}

export interface PlantillaDia {
  nombre: string;
  ejercicios: PlantillaEjercicio[];
}

export interface Plantilla {
  nombre: string;
  descripcion: string;
  dias: PlantillaDia[];
}

const PLANTILLAS: Plantilla[] = [
  {
    nombre: 'PPL (Push Pull Legs)',
    descripcion:
      'Rutina de 3 días dividida en empuje, tirón y piernas. Ideal para intermedios que buscan volumen y fuerza.',
    dias: [
      {
        nombre: 'Push',
        ejercicios: [
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Press militar', grupo_muscular: 'hombro', series: 4, repeticiones: 10, descanso: 90 },
          { nombre: 'Aperturas', grupo_muscular: 'pecho', series: 3, repeticiones: 12, descanso: 60 },
          { nombre: 'Fondos', grupo_muscular: 'tríceps', series: 3, repeticiones: 10, descanso: 90 },
          { nombre: 'Extensiones tríceps', grupo_muscular: 'tríceps', series: 3, repeticiones: 12, descanso: 60 },
        ],
      },
      {
        nombre: 'Pull',
        ejercicios: [
          { nombre: 'Dominadas', grupo_muscular: 'espalda', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, repeticiones: 10, descanso: 90 },
          { nombre: 'Jalón al pecho', grupo_muscular: 'espalda', series: 3, repeticiones: 12, descanso: 90 },
          { nombre: 'Curl bíceps', grupo_muscular: 'bíceps', series: 3, repeticiones: 10, descanso: 60 },
          { nombre: 'Curl martillo', grupo_muscular: 'bíceps', series: 3, repeticiones: 12, descanso: 60 },
        ],
      },
      {
        nombre: 'Legs',
        ejercicios: [
          { nombre: 'Sentadilla', grupo_muscular: 'pierna', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Prensa', grupo_muscular: 'pierna', series: 4, repeticiones: 10, descanso: 90 },
          { nombre: 'Extensiones cuádriceps', grupo_muscular: 'pierna', series: 3, repeticiones: 12, descanso: 60 },
          { nombre: 'Curl femoral', grupo_muscular: 'pierna', series: 3, repeticiones: 12, descanso: 60 },
          { nombre: 'Elevación de talones', grupo_muscular: 'pierna', series: 4, repeticiones: 12, descanso: 60 },
        ],
      },
    ],
  },
  {
    nombre: 'Upper/Lower',
    descripcion:
      'Rutina de 2 días alternando tren superior e inferior. Versátil para entrenar 4 días por semana.',
    dias: [
      {
        nombre: 'Upper',
        ejercicios: [
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, repeticiones: 10, descanso: 90 },
          { nombre: 'Press militar', grupo_muscular: 'hombro', series: 3, repeticiones: 10, descanso: 90 },
          { nombre: 'Jalón al pecho', grupo_muscular: 'espalda', series: 3, repeticiones: 12, descanso: 90 },
          { nombre: 'Curl bíceps', grupo_muscular: 'bíceps', series: 3, repeticiones: 12, descanso: 60 },
          { nombre: 'Extensiones tríceps', grupo_muscular: 'tríceps', series: 3, repeticiones: 12, descanso: 60 },
        ],
      },
      {
        nombre: 'Lower',
        ejercicios: [
          { nombre: 'Sentadilla', grupo_muscular: 'pierna', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Peso muerto', grupo_muscular: 'espalda', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Prensa', grupo_muscular: 'pierna', series: 3, repeticiones: 10, descanso: 90 },
          { nombre: 'Curl femoral', grupo_muscular: 'pierna', series: 3, repeticiones: 12, descanso: 60 },
          { nombre: 'Elevación de talones', grupo_muscular: 'pierna', series: 4, repeticiones: 12, descanso: 60 },
          { nombre: 'Plancha', grupo_muscular: 'core', series: 3, repeticiones: 10, descanso: 60 },
        ],
      },
    ],
  },
  {
    nombre: 'Full Body',
    descripcion:
      'Rutina de cuerpo completo en un solo día. Perfecta para principiantes o quienes entrenan 2-3 días por semana.',
    dias: [
      {
        nombre: 'Full Body',
        ejercicios: [
          { nombre: 'Sentadilla', grupo_muscular: 'pierna', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 4, repeticiones: 8, descanso: 120 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, repeticiones: 10, descanso: 90 },
          { nombre: 'Press militar', grupo_muscular: 'hombro', series: 3, repeticiones: 10, descanso: 90 },
          { nombre: 'Curl bíceps', grupo_muscular: 'bíceps', series: 3, repeticiones: 12, descanso: 60 },
          { nombre: 'Extensiones tríceps', grupo_muscular: 'tríceps', series: 3, repeticiones: 12, descanso: 60 },
          { nombre: 'Plancha', grupo_muscular: 'core', series: 3, repeticiones: 10, descanso: 60 },
        ],
      },
    ],
  },
];

export const getPlantillas = (): Plantilla[] => {
  return PLANTILLAS;
};

export const crearDesdeTemplate = async (plantilla: Plantilla): Promise<void> => {
  try {
    const todosEjercicios = await ejercicioService.getAll();

    for (const dia of plantilla.dias) {
      const rutinaId = await rutinaService.crear(
        plantilla.nombre + ' - ' + dia.nombre,
      );

      for (let orden = 0; orden < dia.ejercicios.length; orden++) {
        const ejTemplate = dia.ejercicios[orden];

        let ejercicio = todosEjercicios.find(
          e => e.nombre.toLowerCase() === ejTemplate.nombre.toLowerCase(),
        );

        if (!ejercicio) {
          const nuevoId = await ejercicioService.crear(
            ejTemplate.nombre,
            ejTemplate.grupo_muscular,
          );
          ejercicio = {
            id: nuevoId,
            nombre: ejTemplate.nombre,
            grupo_muscular: ejTemplate.grupo_muscular,
            personalizado: true,
          };
          todosEjercicios.push(ejercicio);
        }

        await rutinaService.agregarEjercicio(rutinaId, ejercicio!.id, {
          orden: orden + 1,
          series: ejTemplate.series,
          repeticiones: ejTemplate.repeticiones,
          peso_objetivo: 0,
          descanso: ejTemplate.descanso,
        });
      }
    }
  } catch (error) {
    console.error('Error al crear rutinas desde plantilla:', error);
    Alert.alert('Error', 'No se pudieron crear las rutinas desde la plantilla.');
    throw error;
  }
};
