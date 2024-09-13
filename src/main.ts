import { mine } from "roles/mine";
import { upgrade } from "roles/upgrade";
import { doWork } from "roles/work";
import roster from "roster.json";
import { ErrorMapper } from "utils/ErrorMapper";
import { debugLog, getSpawn } from "utils/utils";

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
		creepCounts: any;
		creepLimits: any;
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

//	if (!room) {
//		console.log("FATAL");
//		return;
//	}
//
//	const source = room.find(FIND_SOURCES)[0];
//	const controller = room.controller;
//	if (controller === undefined) {
//		return;
//	}
//
//	// Use PathFinder to find the path between the source and the controller
//	const path = PathFinder.search(
//		source.pos,
//		{ pos: controller.pos, range: 1 },
//		{
//			roomCallback: (roomName) => {
//				const costs = new PathFinder.CostMatrix();
//				for (const structure of room.find(FIND_STRUCTURES)) {
//					if (structure.structureType === STRUCTURE_ROAD) {
//						// Favor roads
//						costs.set(structure.pos.x, structure.pos.y, 1);
//					} else if (
//						structure.structureType !== STRUCTURE_CONTAINER &&
//						(structure.structureType !== STRUCTURE_RAMPART || !structure.my)
//					) {
//						// Block walkable tiles
//						costs.set(structure.pos.x, structure.pos.y, 255);
//					}
//				}
//				return costs;
//			},
//		},
//	).path;
//
//	if (path.length === 0) {
//		console.log("No valid path found between source and controller.");
//		return;
//	}
//
//	// Calculate the midpoint of the path
//	const midpointIndex = Math.floor(path.length / 2);
//	const midpoint = path[midpointIndex];
//
//	// Check if the midpoint is buildable terrain (not a wall or obstacle)
//	const terrain = room.getTerrain();
//	if (terrain.get(midpoint.x, midpoint.y) !== TERRAIN_MASK_WALL) {
//		// Try to place the spawn at the midpoint
//		const result = room.createConstructionSite(
//			midpoint.x,
//			midpoint.y,
//			STRUCTURE_SPAWN,
//		);
//
//		if (result === OK) {
//			console.log(
//				`Spawn placed successfully at (${midpoint.x}, ${midpoint.y})`,
//			);
//		} else {
//			console.log("Failed to place spawn:", result);
//		}
//	} else {
//		console.log("Midpoint along path is not buildable.");
//	}
//};

const getCreepName = (identifier: string) => {
	const randomId = Math.random().toString(36).slice(-6);
	return `creep-${identifier}-${randomId}`;
};

function spawnMiner(spawn: StructureSpawn) {
	debugLog("Spawn miner");
	const creepName = getCreepName("miner");
	const spawnStatus = spawn.spawnCreep([WORK, WORK, MOVE], creepName, {
		memory: {
			role: Role.MINER,
		},
	});
	console.log(`spawnStatus: ${spawnStatus}`);
	return spawnStatus;
}

function spawnUpgrader(spawn: StructureSpawn) {
	const creepName = getCreepName("upgrader");
	const spawnStatus = spawn.spawnCreep([WORK, MOVE, CARRY], creepName, {
		memory: {
			role: Role.UPGRADER,
		},
	});
	console.log(`spawnStatus: ${spawnStatus}`);
	return spawnStatus;
}

function spawnWorker(spawn: StructureSpawn) {
	const creepName = getCreepName("worker");
	const spawnStatus = spawn.spawnCreep([WORK, MOVE, CARRY], creepName, {
		memory: {
			role: Role.WORKER,
		},
	});
	console.log(`spawnStatus: ${spawnStatus}`);
	return spawnStatus;
}

const setMemoryCreepLimits = () => {
	if (Memory.creepLimits === undefined) {
		Memory.creepLimits = roster.creepLimits;
	}
};

const spawnCreep = (spawn: StructureSpawn) => {
	const spawnPriority = ["miner", "worker", "upgrader"];

	const roleToSpawn = spawnPriority.reduce((lowest, role) => {
		const limit = Memory.creepLimits[role];

		if (Memory.creepCounts[role] < limit) {
			if (Memory.creepCounts[lowest] >= Memory.creepLimits[lowest]) {
				return role;
			}

			return Memory.creepCounts[role] < Memory.creepCounts[lowest]
				? role
				: lowest;
		}
		return lowest;
	}, spawnPriority[0]);

	debugLog(`roleToSpawn ${roleToSpawn}`);
	switch (roleToSpawn) {
		case "worker":
			if (Memory.creepCounts.worker < Memory.creepLimits.worker) {
				const result = spawnWorker(spawn);
				console.log(`Tried spawning ${roleToSpawn} -- result: ${result}`);
				if (result === OK || result === ERR_NOT_ENOUGH_ENERGY) {
					return;
				}
			}
			break;
		case "miner":
			debugLog("MINER b4");
			debugLog(Memory.creepCounts.miner);
			debugLog(Memory.creepLimits.miner);
			debugLog(`${Memory.creepCounts.miner < Memory.creepLimits.miner}`);
			if (Memory.creepCounts.miner < Memory.creepLimits.miner) {
				debugLog("MINER");
				const result = spawnMiner(spawn);
				console.log(`Tried spawning ${roleToSpawn} -- result: ${result}`);
				if (result === OK || result === ERR_NOT_ENOUGH_ENERGY) {
					return;
				}
			}
			break;
		case "upgrader":
			if (Memory.creepCounts.upgrader < Memory.creepLimits.upgrader) {
				const result = spawnUpgrader(spawn);
				console.log(`Tried spawning ${roleToSpawn} -- result: ${result}`);
				if (result === OK || result === ERR_NOT_ENOUGH_ENERGY) {
					return;
				}
			}
			break;
	}
};

const needEnergy = () => {
	return getSpawn().store.getFreeCapacity(RESOURCE_ENERGY) >= 150;
};

const spendEnergy = () => {
	let rooms = Object.keys(Game.creeps)
		.map((creep) => Game.creeps[creep].room)
		.filter((room) => room !== undefined);
    rooms = [... new Set(rooms)];


	for (const room of rooms) {
		debugLog(`Room - ${room?.name}`);
		if (
			JSON.stringify(Memory.creepLimits) !== JSON.stringify(Memory.creepCounts)
		) {
			debugLog("spending energy to spawn");
			spawnCreep(getSpawn());
		}
		if (room.controller !== undefined && room.controller.level >= 4) {
			console.log("we should build storage");
			//TODO build storage for energy
		}
		upgrade();
	}
};

const garbageCollection = () => {
	Memory.creepCounts = {
		worker: 0,
		miner: 0,
		upgrader: 0,
	};
	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			delete Memory.creeps[name];
			switch (Memory.creeps[name]?.role) {
				case Role.MINER:
					Memory.creepCounts.miner--;
					break;
				case Role.WORKER:
					Memory.creepCounts.worker--;
					break;
				case Role.UPGRADER:
					Memory.creepCounts.upgrader--;
					break;
			}
			break;
		}
		switch (Memory.creeps[name].role) {
			case Role.MINER:
				Memory.creepCounts.miner++;
				break;
			case Role.WORKER:
				Memory.creepCounts.worker++;
				break;
			case Role.UPGRADER:
				Memory.creepCounts.upgrader++;
				break;
		}
	}
};

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
	console.log(`Current game tick is ${Game.time}`);
	setMemoryCreepLimits();
	garbageCollection();
	mine();
	doWork();
	spendEnergy();
});
