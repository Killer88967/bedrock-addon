import {
  type Block,
  type BlockCustomComponent,
  BlockPermutation,
  ItemStack,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { NS } from "../constants";
import { consumeHeldItem, damageHeldItem, getHeldItem, giveItem } from "../utils/inventory";

export const CUTTING_BOARD_COMPONENT = `${NS}:cutting_board`;
const INGREDIENT_STATE = `${NS}:ingredient`;
const EMPTY = "none";
const KNIFE_TAG = `${NS}:knife`;

interface SliceRecipe {
  /** Value of the hh:ingredient state that shows this ingredient on the board. */
  state: string;
  result: string;
  count: number;
}

/** Item placed on the board -> what the knife turns it into. */
const SLICING: Record<string, SliceRecipe> = {
  [`${NS}:tomato`]: { state: "tomato", result: `${NS}:tomato_slices`, count: 2 },
  [`${NS}:onion`]: { state: "onion", result: `${NS}:onion_slices`, count: 2 },
  [`${NS}:lettuce`]: { state: "lettuce", result: `${NS}:lettuce_leaf`, count: 3 },
  [MinecraftItemTypes.Bread]: { state: "bread", result: `${NS}:bread_slice`, count: 3 },
  [MinecraftItemTypes.Porkchop]: { state: "porkchop", result: `${NS}:bacon`, count: 3 },
  [MinecraftItemTypes.CookedPorkchop]: {
    state: "cooked_porkchop",
    result: `${NS}:cooked_bacon`,
    count: 3,
  },
};

/** hh:ingredient state -> the item that's sitting on the board. */
const ITEM_BY_STATE = new Map(
  Object.entries(SLICING).map(([item, recipe]) => [recipe.state, item] as const),
);

function getIngredient(permutation: BlockPermutation): string {
  const value = permutation.getAllStates()[INGREDIENT_STATE];
  return typeof value === "string" ? value : EMPTY;
}

function setIngredient(block: Block, state: string): void {
  const states = { ...block.permutation.getAllStates(), [INGREDIENT_STATE]: state };
  block.setPermutation(BlockPermutation.resolve(block.typeId, states));
}

function boardTop(block: Block) {
  const { x, y, z } = block.center();
  return { x, y: y - 0.3, z };
}

export const CuttingBoardComponent: BlockCustomComponent = {
  onPlayerInteract({ block, dimension, player }) {
    if (!player) return;
    const ingredient = getIngredient(block.permutation);
    const held = getHeldItem(player);

    // Empty board: put the held ingredient on it.
    if (ingredient === EMPTY) {
      const recipe = held && SLICING[held.typeId];
      if (!recipe) return;
      setIngredient(block, recipe.state);
      consumeHeldItem(player);
      dimension.playSound("random.pop", boardTop(block), { pitch: 0.8 });
      return;
    }

    const item = ITEM_BY_STATE.get(ingredient);
    if (!item) {
      setIngredient(block, EMPTY); // Unknown state, just clear it.
      return;
    }

    // Knife in hand: slice it.
    if (held?.hasTag(KNIFE_TAG)) {
      const recipe = SLICING[item]!;
      setIngredient(block, EMPTY);
      dimension.spawnItem(new ItemStack(recipe.result, recipe.count), boardTop(block));
      dimension.playSound("mob.sheep.shear", boardTop(block));
      damageHeldItem(player);
      return;
    }

    // Anything else: take the ingredient back.
    setIngredient(block, EMPTY);
    giveItem(player, new ItemStack(item));
    dimension.playSound("random.pop", boardTop(block));
  },

  onBreak({ block, brokenBlockPermutation, dimension }) {
    const item = ITEM_BY_STATE.get(getIngredient(brokenBlockPermutation));
    if (item) dimension.spawnItem(new ItemStack(item), block.center());
  },
};
