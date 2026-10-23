import { system, world } from "@minecraft/server";
import { CROP_COMPONENT, CropComponent } from "./components/crop";
import { CUTTING_BOARD_COMPONENT, CuttingBoardComponent } from "./components/cutting-board";
import { NS } from "./constants";
import { registerSeedDrops } from "./features/seed-drops";

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent(CROP_COMPONENT, CropComponent);
  blockComponentRegistry.registerCustomComponent(CUTTING_BOARD_COMPONENT, CuttingBoardComponent);
});

registerSeedDrops();

world.afterEvents.worldLoad.subscribe(() => {
  dev: console.warn(`[${NS}] Hearth & Harvest loaded`);
});
