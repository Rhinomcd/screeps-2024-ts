import { mine } from "roles/mine";
import roster from "roster.json";
import { ErrorMapper } from "utils/ErrorMapper";
import { getSpawn } from "utils/utils";

declare global {
	interface Memory {
		uuid: number;
		log: any;
	}

	interface CreepMemory {
		role: string;
		room: string;
		working: boolean;
		assignedSource?: Id<_HasId>;
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

const canSpawnCreep = () => {
	const numCreeps = Object.keys(Game.creeps).length;
	//TODO: only spawning workers
	return numCreeps >= roster.creepLimits.worker;
};

const needEnergy = () => {
	return getSpawn().store.getFreeCapacity(RESOURCE_ENERGY) > 0;
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
	const primarySpawn = getSpawn();
	if (canSpawnCreep()) {
		debugLog("should spawn creep");
		spawnCreep(primarySpawn);
	}

	if (needEnergy()) {
		debugLog("should mine");
		mine();
	} else {
		debugLog("we should spend energy");
	}
	garbageCollection();
});
