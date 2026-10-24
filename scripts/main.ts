import { system, world } from "@minecraft/server";
import { CROP_COMPONENT, CropComponent } from "./components/crop";
import { CUTTING_BOARD_COMPONENT, CuttingBoardComponent } from "./components/cutting-board";
import { PLATE_COMPONENT, PlateComponent } from "./components/plate";
import {
  SPREAD_CONTAINER_COMPONENT,
  SpreadContainerComponent,
} from "./components/spread-container";
import { SPREAD_PLACER_COMPONENT, SpreadPlacerComponent } from "./components/spread-placer";
import { TOASTER_COMPONENT, ToasterComponent } from "./components/toaster";
import { CHURN_COMPONENT, ChurnComponent } from "./components/churn";
import { NS } from "./constants";
import { registerSeedDrops } from "./features/seed-drops";

system.beforeEvents.startup.subscribe(({ blockComponentRegistry, itemComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent(CROP_COMPONENT, CropComponent);
  blockComponentRegistry.registerCustomComponent(CUTTING_BOARD_COMPONENT, CuttingBoardComponent);
  blockComponentRegistry.registerCustomComponent(PLATE_COMPONENT, PlateComponent);
  blockComponentRegistry.registerCustomComponent(TOASTER_COMPONENT, ToasterComponent);
  blockComponentRegistry.registerCustomComponent(CHURN_COMPONENT, ChurnComponent);
  blockComponentRegistry.registerCustomComponent(
    SPREAD_CONTAINER_COMPONENT,
    SpreadContainerComponent,
  );

  itemComponentRegistry.registerCustomComponent(SPREAD_PLACER_COMPONENT, SpreadPlacerComponent);
});

registerSeedDrops();

world.afterEvents.worldLoad.subscribe(() => {
  dev: console.warn(`[${NS}] Hearth & Harvest loaded`);
});
