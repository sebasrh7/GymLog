import { SQLiteDatabase } from 'react-native-sqlite-storage';

type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS ejercicios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          grupo_muscular TEXT NOT NULL
        );
      `);

      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS rutinas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          dia_semana TEXT
        );
      `);

      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS rutina_ejercicios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rutina_id INTEGER NOT NULL,
          ejercicio_id INTEGER NOT NULL,
          orden INTEGER NOT NULL DEFAULT 0,
          series INTEGER NOT NULL DEFAULT 3,
          repeticiones INTEGER NOT NULL DEFAULT 10,
          peso_objetivo REAL NOT NULL DEFAULT 0,
          descanso INTEGER NOT NULL DEFAULT 90,
          FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE,
          FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id)
        );
      `);

      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS sesiones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha TEXT NOT NULL,
          rutina_id INTEGER,
          FOREIGN KEY (rutina_id) REFERENCES rutinas(id)
        );
      `);

      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS series_realizadas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sesion_id INTEGER NOT NULL,
          ejercicio_id INTEGER NOT NULL,
          serie_numero INTEGER NOT NULL,
          peso REAL NOT NULL DEFAULT 0,
          reps INTEGER NOT NULL DEFAULT 0,
          completado INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE,
          FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id)
        );
      `);
    },
  },
  {
    version: 2,
    up: async (db) => {
      // Columna para ejercicios personalizados
      await db.executeSql(`
        ALTER TABLE ejercicios ADD COLUMN personalizado INTEGER NOT NULL DEFAULT 0;
      `);

      // Índices para rendimiento
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_series_sesion ON series_realizadas(sesion_id);
      `);
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_series_ejercicio ON series_realizadas(ejercicio_id);
      `);
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones(fecha);
      `);
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_sesiones_rutina ON sesiones(rutina_id);
      `);
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_rutina_ejercicios_rutina ON rutina_ejercicios(rutina_id);
      `);
    },
  },
  {
    version: 3,
    up: async (db) => {
      await db.executeSql('ALTER TABLE sesiones ADD COLUMN duracion_seg INTEGER DEFAULT 0;');
      await db.executeSql('ALTER TABLE series_realizadas ADD COLUMN nota TEXT;');
    },
  },
  {
    version: 4,
    up: async (db) => {
      await db.executeSql("ALTER TABLE rutina_ejercicios ADD COLUMN tipo_serie TEXT NOT NULL DEFAULT 'normal';");
      await db.executeSql('ALTER TABLE rutina_ejercicios ADD COLUMN grupo_serie INTEGER;');
    },
  },
  {
    version: 5,
    up: async (db) => {
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS medidas_corporales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha TEXT NOT NULL,
          peso REAL,
          grasa_corporal REAL,
          pecho REAL,
          cintura REAL,
          cadera REAL,
          brazo REAL,
          muslo REAL,
          nota TEXT
        );
      `);
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_medidas_fecha ON medidas_corporales(fecha);
      `);
    },
  },
];

export const runMigrations = async (db: SQLiteDatabase): Promise<void> => {
  // Tabla de control de versiones
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER NOT NULL DEFAULT 0
    );
  `);

  const [result] = await db.executeSql('SELECT version FROM db_version LIMIT 1');
  let currentVersion = 0;
  if (result.rows.length === 0) {
    await db.executeSql('INSERT INTO db_version (version) VALUES (0)');
  } else {
    currentVersion = result.rows.item(0).version;
  }

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await migration.up(db);
      await db.executeSql('UPDATE db_version SET version = ?', [migration.version]);
    }
  }
};
