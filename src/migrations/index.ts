import * as migration_20260520_125844_uuid_initial_schema from './20260520_125844_uuid_initial_schema';
import * as migration_20260602_080512 from './20260602_080512';

export const migrations = [
  {
    up: migration_20260520_125844_uuid_initial_schema.up,
    down: migration_20260520_125844_uuid_initial_schema.down,
    name: '20260520_125844_uuid_initial_schema',
  },
  {
    up: migration_20260602_080512.up,
    down: migration_20260602_080512.down,
    name: '20260602_080512'
  },
];
