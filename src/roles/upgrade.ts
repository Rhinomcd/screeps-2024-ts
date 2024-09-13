import { Role } from "main";
import { getSpawn } from "utils/utils";

export const upgrade = () => {
  for (const key of Object.keys(Game.creeps)) {
    const creep = Game.creeps[key];
    if (creep.memory.role !== Role.UPGRADER) {
      continue;
    }

    dumpEnergyAtController(creep);
  }
};

const dumpEnergyAtController = (creep: Creep) => {
  if (creep.room.controller) {
    const returnCode = creep.upgradeController(creep.room.controller);
    switch (returnCode) {
      case ERR_NOT_IN_RANGE:
        creep.say("MOVE");
        creep.moveTo(creep.room.controller);
        break;
      case ERR_NOT_ENOUGH_ENERGY:
        creep.moveTo(getSpawn())
        creep.withdraw(getSpawn(), RESOURCE_ENERGY, creep.store.getFreeCapacity())
        break;
    }
  }
};
