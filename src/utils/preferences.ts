import RNFS from 'react-native-fs';

const REST_PATH = `${RNFS.DocumentDirectoryPath}/rest_pref.txt`;
const NAME_PATH = `${RNFS.DocumentDirectoryPath}/profile_name.txt`;
const UNIT_PATH = `${RNFS.DocumentDirectoryPath}/weight_unit.txt`;

const DEFAULT_REST_SECONDS = 90;
const DEFAULT_NAME = 'Atleta';

export const preferences = {
  async getDescanso(): Promise<number> {
    try {
      const val = await RNFS.readFile(REST_PATH, 'utf8');
      const n = parseInt(val, 10);
      return isNaN(n) ? DEFAULT_REST_SECONDS : n;
    } catch {
      return DEFAULT_REST_SECONDS;
    }
  },

  async setDescanso(seconds: number): Promise<void> {
    await RNFS.writeFile(REST_PATH, String(seconds), 'utf8');
  },

  async getNombre(): Promise<string> {
    try {
      const val = await RNFS.readFile(NAME_PATH, 'utf8');
      return val.trim() || DEFAULT_NAME;
    } catch {
      return DEFAULT_NAME;
    }
  },

  async setNombre(name: string): Promise<void> {
    await RNFS.writeFile(NAME_PATH, name.trim(), 'utf8');
  },

  async getUnidad(): Promise<'kg' | 'lb'> {
    try {
      const val = await RNFS.readFile(UNIT_PATH, 'utf8');
      return val.trim() === 'lb' ? 'lb' : 'kg';
    } catch {
      return 'kg';
    }
  },

  async setUnidad(unit: 'kg' | 'lb'): Promise<void> {
    await RNFS.writeFile(UNIT_PATH, unit, 'utf8');
  },
};
