import * as migration_20261009_160103_initial from './20261009_160103_initial';

export const migrations = [
  {
    up: migration_20261009_160103_initial.up,
    down: migration_20261009_160103_initial.down,
    name: '20261009_160103_initial'
  },
];
