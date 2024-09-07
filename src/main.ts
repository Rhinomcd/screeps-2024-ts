import { mine } from "roles/mine";
import { upgrade } from "roles/upgrade";
import roster from "roster.json";
import { ErrorMapper } from "utils/ErrorMapper";
import { getSpawn } from "utils/utils";

export enum Role {
  WORKER = 0,
  MINER = 1,
  UPGRADER = 2,
}

export enum Job {
  MINE = 0,
  UPGRADE = 1,
}

declare global {
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory {
    role: Role;
    assignedSource?: Id<Source>;
    assignment?: Job;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

export const debugLog = (msg: string) => {
  console.log(`DEBUG: ${msg}`);
};

const getCreepName = () => {
  const randomId = Math.random().toString(36).slice(-6);
  return `creep-${randomId}`;
};

const spawnCreep = (spawn: StructureSpawn) => {
  const creepName = getCreepName();
  const spawnStatus = spawn.spawnCreep([WORK, MOVE, CARRY], creepName, {
    memory: {
      role: Role.WORKER,
      assignment:  Job.MINE
    },
  });
  console.log(`spawnStatus: ${spawnStatus}`);
};

const canSpawnCreep = () => {
  const numCreeps = Object.keys(Game.creeps).length;
  //TODO: only spawning workers
  return numCreeps < roster.creepLimits.worker;
};

const needEnergy = () => {
  return getSpawn().store.getFreeCapacity(RESOURCE_ENERGY) === 300;
};

const spendEnergy = () => {
  for (const key of Object.keys(Game.creeps)) {
    const creep = Game.creeps[key];

    if (creep.memory.role === Role.WORKER) {
      creep.memory.assignment = Job.UPGRADE;
    }
    upgrade();
  }
};

const garbageCollection = () => {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
};

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);
  garbageCollection();
  const primarySpawn = getSpawn();
  if (canSpawnCreep()) {
    debugLog("should spawn creep");
    spawnCreep(primarySpawn);
  }

  if (needEnergy()) {
    debugLog("should mine");
    mine();
  } else {
    spendEnergy();
    debugLog("we should spend energy");
  }
});
