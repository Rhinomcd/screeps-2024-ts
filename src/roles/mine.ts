import { getSpawn } from "utils/utils";

export const mine = () => {
  const HARVEST_SUCCESS = 0;
  for (const key of Object.keys(Game.creeps)) {
    const creep = Game.creeps[key];

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      const primarySpawn = getSpawn();
      if (creep.transfer(primarySpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say("➡️")
        creep.moveTo(primarySpawn.pos);
      }
      break;
    }

    if (creep.memory.assignedSource === undefined) {
      creep.memory.assignedSource =
        creep.pos.findClosestByRange(FIND_SOURCES)?.id;
    }

    const energySource = Game.getObjectById(creep.memory.assignedSource) as Source;
    const harvestPosition = energySource.pos;
    creep.say("⛏️")
    const harvestStatus = creep.harvest(energySource);

    if (harvestStatus !== HARVEST_SUCCESS) {
      console.log(`harvestStatus: ${harvestStatus} creepName ${creep.name}`);
      creep.say("➡️")
      creep.moveTo(harvestPosition);
    }
  }
};
