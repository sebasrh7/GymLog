import { SQLiteDatabase } from 'react-native-sqlite-storage';

const EJERCICIOS_INICIALES = [
  { nombre: 'Press banca', grupo: 'pecho' },
  { nombre: 'Press inclinado', grupo: 'pecho' },
  { nombre: 'Aperturas con mancuernas', grupo: 'pecho' },
  { nombre: 'Fondos en paralelas', grupo: 'pecho' },
  { nombre: 'Sentadilla', grupo: 'pierna' },
  { nombre: 'Prensa de pierna', grupo: 'pierna' },
  { nombre: 'Extensiones de cuádriceps', grupo: 'pierna' },
  { nombre: 'Curl femoral', grupo: 'pierna' },
  { nombre: 'Peso muerto', grupo: 'espalda' },
  { nombre: 'Remo con barra', grupo: 'espalda' },
  { nombre: 'Dominadas', grupo: 'espalda' },
  { nombre: 'Jalón al pecho', grupo: 'espalda' },
  { nombre: 'Remo en polea baja', grupo: 'espalda' },
  { nombre: 'Curl bíceps con barra', grupo: 'bíceps' },
  { nombre: 'Curl martillo', grupo: 'bíceps' },
  { nombre: 'Curl concentrado', grupo: 'bíceps' },
  { nombre: 'Tríceps en polea', grupo: 'tríceps' },
  { nombre: 'Press francés', grupo: 'tríceps' },
  { nombre: 'Fondos de tríceps', grupo: 'tríceps' },
  { nombre: 'Elevaciones laterales', grupo: 'hombro' },
  { nombre: 'Press militar', grupo: 'hombro' },
  { nombre: 'Pájaros', grupo: 'hombro' },
  { nombre: 'Encogimientos de hombros', grupo: 'hombro' },
  { nombre: 'Plancha', grupo: 'core' },
  { nombre: 'Crunch abdominal', grupo: 'core' },
  { nombre: 'Elevaciones de piernas', grupo: 'core' },
];

export const seedEjercicios = async (db: SQLiteDatabase): Promise<void> => {
  const [result] = await db.executeSql('SELECT COUNT(*) as count FROM ejercicios');
  const count = result.rows.item(0).count;

  if (count > 0) return;

  for (const e of EJERCICIOS_INICIALES) {
    await db.executeSql(
      'INSERT INTO ejercicios (nombre, grupo_muscular) VALUES (?, ?)',
      [e.nombre, e.grupo],
    );
  }
};
