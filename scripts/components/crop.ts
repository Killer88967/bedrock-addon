import {
  type Block,
  type BlockCustomComponent,
  BlockPermutation,
  ItemStack,
} from "@minecraft/server";
import { MinecraftBlockTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { NS } from "../constants";
import { consumeHeldItem, getHeldItem } from "../utils/inventory";
import { randInt } from "../utils/random";

export const CROP_COMPONENT = `${NS}:crop`;
const GROWTH_STATE = `${NS}:growth`;
const MIN_LIGHT = 9;

interface CropParams {
  /** Highest value of the growth state (mature). */
  max_growth: number;
  /** Chance per random tick to grow one stage on hydrated farmland. Halved when dry. */
  growth_chance: number;
  /** Right-click harvesting for crops that regrow (tomatoes, berries). */
  harvest?: {
    item: string;
    min: number;
    max: number;
    reset_to: number;
  };
}

function getGrowth(block: Block): number {
  const value = block.permutation.getAllStates()[GROWTH_STATE];
  return typeof value === "number" ? value : 0;
}

function setGrowth(block: Block, growth: number): void {
  const states = { ...block.permutation.getAllStates(), [GROWTH_STATE]: growth };
  block.setPermutation(BlockPermutation.resolve(block.typeId, states));
}

function isHydrated(block: Block): boolean {
  const below = block.below();
  if (below?.typeId !== MinecraftBlockTypes.Farmland) return false;
  const moisture = below.permutation.getState("moisturized_amount");
  return typeof moisture === "number" && moisture > 0;
}

export const CropComponent: BlockCustomComponent = {
  onRandomTick({ block }, { params }) {
    const p = params as CropParams;
    const growth = getGrowth(block);
    if (growth >= p.max_growth) return;
    if (block.getLightLevel() < MIN_LIGHT) return;

    const chance = isHydrated(block) ? p.growth_chance : p.growth_chance / 2;
    if (Math.random() < chance) setGrowth(block, growth + 1);
  },

  onPlayerInteract({ block, dimension, player }, { params }) {
    if (!player) return;
    const p = params as CropParams;
    const growth = getGrowth(block);
    const held = getHeldItem(player);

    if (held?.typeId === MinecraftItemTypes.BoneMeal) {
      if (growth >= p.max_growth) return;
      setGrowth(block, Math.min(p.max_growth, growth + randInt(2, 5)));
      consumeHeldItem(player);
      dimension.spawnParticle("minecraft:crop_growth_emitter", block.center());
      dimension.playSound("item.bone_meal.use", block.center());
      return;
    }

    if (p.harvest && growth >= p.max_growth) {
      const { item, min, max, reset_to } = p.harvest;
      dimension.spawnItem(new ItemStack(item, randInt(min, max)), block.center());
      setGrowth(block, reset_to);
      dimension.playSound("block.sweet_berry_bush.pick", block.center());
    }
  },
};
