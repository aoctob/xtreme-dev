import * as migration_20261009_160103_initial from './20261009_160103_initial';
import * as migration_20261009_201318_design_kit_rebuild from './20261009_201318_design_kit_rebuild';
import * as migration_20261010_231938_roles_permissions from './20261010_231938_roles_permissions';
import * as migration_20261010_232000_drop_legacy_roles from './20261010_232000_drop_legacy_roles';

export const migrations = [
  {
    up: migration_20261009_160103_initial.up,
    down: migration_20261009_160103_initial.down,
    name: '20261009_160103_initial',
  },
  {
    up: migration_20261009_201318_design_kit_rebuild.up,
    down: migration_20261009_201318_design_kit_rebuild.down,
    name: '20261009_201318_design_kit_rebuild',
  },
  {
    up: migration_20261010_231938_roles_permissions.up,
    down: migration_20261010_231938_roles_permissions.down,
    name: '20261010_231938_roles_permissions',
  },
  {
    up: migration_20261010_232000_drop_legacy_roles.up,
    down: migration_20261010_232000_drop_legacy_roles.down,
    name: '20261010_232000_drop_legacy_roles'
  },
];
