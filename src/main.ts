import { mine } from "roles/mine";
import { ErrorMapper } from "utils/ErrorMapper";
import { getSpawn } from "utils/utils";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    role: string;
    room: string;
    working: boolean;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

const debugLog = (msg: string) => {
  console.log(`DEBUG: ${msg}`);
};


const getCreepName = () => {
  const randomId = Math.random().toString(36).slice(-6);
  return `creep-${randomId}`;
};

const spawnCreep = (spawn: StructureSpawn) => {
  const spawnStatus = spawn.spawnCreep([WORK, MOVE, CARRY], getCreepName());
  console.log(`spawnStatus: ${spawnStatus}`);
};

// @ts-ignore
module.exports.loop = () => {
  const CREEP_LIMIT = 3;
  const primarySpawn = getSpawn();
  if (Object.keys(Game.creeps).length < CREEP_LIMIT) {
    debugLog("should spawn creep");
    spawnCreep(primarySpawn);
  }
  if (primarySpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    debugLog("should mine");
    mine();
  } else {
    debugLog("should debug");
  }
};
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);
  const CREEP_LIMIT = 3;
  const primarySpawn = getSpawn();
  if (Object.keys(Game.creeps).length < CREEP_LIMIT) {
    debugLog("should spawn creep");
    spawnCreep(primarySpawn);
  }
  if (primarySpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    debugLog("should mine");
    mine();
  } else {
    debugLog("should debug");
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
