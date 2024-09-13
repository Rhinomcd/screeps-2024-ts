import { Role } from "main";

export const doWork = () => {
	for (const name in Game.creeps) {
		const creep = Game.creeps[name];
		if (creep.memory.role !== Role.WORKER) {
			continue;
		}
		creep.say("WORK");

		if (creep.store.getFreeCapacity() > 0) {
			if (!findAndPickupEnergy(creep)) {
				const source = creep.pos.findClosestByPath(FIND_SOURCES) as Source;
				if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
					creep.moveTo(source, { visualizePathStyle: { stroke: "#ffffff" } });
				}
			}
		} else {
			// If the creep is full, go deposit energy
			const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
				filter: (structure) => {
					return (
						(structure.structureType === STRUCTURE_SPAWN ||
							structure.structureType === STRUCTURE_EXTENSION ||
							structure.structureType === STRUCTURE_TOWER) &&
						structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
					);
				},
			});

			if (
				target &&
				creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
			) {
				creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
			}
		}
	}
};

const findAndPickupEnergy = (creep: Creep) => {
	const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
		filter: (resource) => resource.resourceType === RESOURCE_ENERGY,
	});

	if (droppedEnergy) {
		if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
			creep.moveTo(droppedEnergy, {
				visualizePathStyle: { stroke: "#ffaa00" },
			});
		}
		return true;
	}

	return false;
};
