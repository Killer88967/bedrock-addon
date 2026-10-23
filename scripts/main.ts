import { system, world } from "@minecraft/server";

export const NS = "hh";

system.beforeEvents.startup.subscribe(({ blockComponentRegistry, itemComponentRegistry }) => {
  void blockComponentRegistry;
  void itemComponentRegistry;
});

world.afterEvents.worldLoad.subscribe(() => {
  dev: console.warn(`[${NS}] Hearth & Harvest loaded`);
});
