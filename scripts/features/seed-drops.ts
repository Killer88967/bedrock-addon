import { GameMode, ItemStack, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { NS } from "../constants";

/** Seeds that can drop when a player breaks grass, with their drop chance. */
const GRASS_SEEDS: { item: string; chance: number }[] = [
  { item: `${NS}:tomato_seeds`, chance: 0.025 },
  { item: `${NS}:onion_seeds`, chance: 0.025 },
  { item: `${NS}:lettuce_seeds`, chance: 0.025 },
  { item: `${NS}:strawberry_seeds`, chance: 0.025 },
  { item: `${NS}:peanut_seeds`, chance: 0.025 },
];

const GRASS_BLOCKS: string[] = [
  MinecraftBlockTypes.ShortGrass,
  MinecraftBlockTypes.TallGrass,
  MinecraftBlockTypes.Fern,
  MinecraftBlockTypes.LargeFern,
];

export function registerSeedDrops(): void {
  world.afterEvents.playerBreakBlock.subscribe(
    ({ player, block, dimension }) => {
      if (player.getGameMode() === GameMode.Creative) return;

      for (const { item, chance } of GRASS_SEEDS) {
        if (Math.random() < chance) {
          dimension.spawnItem(new ItemStack(item), block.center());
        }
      }
    },
    { blockTypes: GRASS_BLOCKS },
  );
}
