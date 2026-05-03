import * as migration_20251130_130914 from './20251130_130914';
import * as migration_20251201_142254 from './20251201_142254';
import * as migration_20251201_145708 from './20251201_145708';
import * as migration_20251207_093404 from './20251207_093404';
import * as migration_20251207_100251 from './20251207_100251';
import * as migration_20260225_103936 from './20260225_103936';
import * as migration_20260320_145621 from './20260320_145621';
import * as migration_20260405_074530_syllabus_coverage from './20260405_074530_syllabus_coverage';
import * as migration_20260503_084109 from './20260503_084109';

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
    name: '20251207_093404',
  },
  {
    up: migration_20251207_100251.up,
    down: migration_20251207_100251.down,
    name: '20251207_100251',
  },
  {
    up: migration_20260225_103936.up,
    down: migration_20260225_103936.down,
    name: '20260225_103936',
  },
  {
    up: migration_20260320_145621.up,
    down: migration_20260320_145621.down,
    name: '20260320_145621',
  },
  {
    up: migration_20260405_074530_syllabus_coverage.up,
    down: migration_20260405_074530_syllabus_coverage.down,
    name: '20260405_074530_syllabus_coverage',
  },
  {
    up: migration_20260503_084109.up,
    down: migration_20260503_084109.down,
    name: '20260503_084109'
  },
];
