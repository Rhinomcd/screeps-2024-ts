import { debugLog, Job, Role } from "main";
import { getSpawn } from "utils/utils";

const dumpEnergyAtSpawn = (creep: Creep) => {
  const primarySpawn = getSpawn();
  if (creep.transfer(primarySpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creep.say("➡️");
    creep.moveTo(primarySpawn.pos);
  }
};

const harvestEnergy = (creep: Creep) => {
  debugLog(`${creep.name} - should be harvestingEnergy`)
  if (creep.memory.assignedSource === undefined) {
    creep.memory.assignedSource =
      creep.pos.findClosestByRange(FIND_SOURCES)?.id;
  }

  const energySource = Game.getObjectById(
    creep.memory.assignedSource as Id<Source>,
  ) as Source;
  const harvestPosition = energySource.pos;
  creep.say("⛏️");
  const harvestStatus = creep.harvest(energySource);

  if (harvestStatus === ERR_NOT_IN_RANGE) {
    creep.say("➡️");
    creep.moveTo(harvestPosition);
  }
};

const creepShouldMine = (creep: Creep) => {
  return (
    (creep.memory.role === Role.WORKER &&
      creep.memory.assignment === Job.MINE) ||
    creep.memory.role === Role.MINER
  );
};

export const mine = () => {
  for (const key of Object.keys(Game.creeps)) {
    const creep = Game.creeps[key];
    if (creep.memory.role === Role.WORKER) {
      creep.memory.assignment = Job.MINE;
    }
    if (!creepShouldMine(creep)) {
      debugLog(`${creep.name} - should be breaking `)
      break;
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      debugLog(`${creep.name} - should be dumping energy`)
      dumpEnergyAtSpawn(creep);
      break;
    }

    harvestEnergy(creep);
  }
};

