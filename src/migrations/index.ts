import * as migration_20251130_130914 from './20251130_130914';
import * as migration_20251201_142254 from './20251201_142254';
import * as migration_20251201_145708 from './20251201_145708';
import * as migration_20251207_093404 from './20251207_093404';

export const migrations = [
  {
    up: migration_20251130_130914.up,
    down: migration_20251130_130914.down,
    name: '20251130_130914',
  },
  {
    up: migration_20251201_142254.up,
    down: migration_20251201_142254.down,
    name: '20251201_142254',
  },
  {
    up: migration_20251201_145708.up,
    down: migration_20251201_145708.down,
    name: '20251201_145708',
  },
  {
    up: migration_20251207_093404.up,
    down: migration_20251207_093404.down,
    name: '20251207_093404'
  },
];
