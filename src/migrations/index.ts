import * as migration_20261009_160103_initial from './20261009_160103_initial';
import * as migration_20261009_201318_design_kit_rebuild from './20261009_201318_design_kit_rebuild';

export const migrations = [
  {
    up: migration_20261009_160103_initial.up,
    down: migration_20261009_160103_initial.down,
    name: '20261009_160103_initial',
  },
  {
    up: migration_20261009_201318_design_kit_rebuild.up,
    down: migration_20261009_201318_design_kit_rebuild.down,
    name: '20261009_201318_design_kit_rebuild'
  },
];
