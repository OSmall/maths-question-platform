import * as migration_20251130_130914 from './20251130_130914';

export const migrations = [
  {
    up: migration_20251130_130914.up,
    down: migration_20251130_130914.down,
    name: '20251130_130914'
  },
];
