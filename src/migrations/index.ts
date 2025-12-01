import * as migration_20251130_130914 from './20251130_130914';
import * as migration_20251201_142254 from './20251201_142254';

export const migrations = [
  {
    up: migration_20251130_130914.up,
    down: migration_20251130_130914.down,
    name: '20251130_130914',
  },
  {
    up: migration_20251201_142254.up,
    down: migration_20251201_142254.down,
    name: '20251201_142254'
  },
];
