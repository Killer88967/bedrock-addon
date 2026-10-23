import {
  type Block,
  type BlockCustomComponent,
  BlockPermutation,
  ItemStack,
  type Vector3,
} from "@minecraft/server";
import { NS } from "../constants";
import { consumeHeldItem, getHeldItem, giveItem } from "../utils/inventory";

export const PLATE_COMPONENT = `${NS}:plate`;

const BASE_STATE = `${NS}:base`;
const SLOTS = 3;
const EMPTY = "none";

/** Bottom/top slice item -> value of the hh:base state. */
const BREADS: Record<string, string> = {
  [`${NS}:bread_slice`]: "bread",
  [`${NS}:toast`]: "toast",
};
const ITEM_BY_BASE = new Map(Object.entries(BREADS).map(([item, state]) => [state, item]));

/**
 * Item -> value of the hh:layer_N states.
 * Keep in sync with FILLINGS in tools/gen-plate.mjs.
 */
const FILLINGS: Record<string, string> = {
  [`${NS}:cooked_bacon`]: "bacon",
  [`${NS}:lettuce_leaf`]: "lettuce",
  [`${NS}:tomato_slices`]: "tomato",
  [`${NS}:onion_slices`]: "onion",
};

const ITEM_BY_FILLING = new Map(Object.entries(FILLINGS).map(([item, state]) => [state, item]));

interface SandwichRecipe {
  result: string;
  matches: (fillings: string[]) => boolean;
}

/** Exact filling set, in any order. */
function exactly(...wanted: string[]): (fillings: string[]) => boolean {
  const key = [...wanted].sort().join(",");
  return (fillings) => [...fillings].sort().join(",") === key;
}

/**
 * Checked top to bottom; anything unmatched becomes a plain sandwich.
 * `result` is the item name without namespace; toasted versions are `toasted_<result>`.
 */
const SANDWICHES: SandwichRecipe[] = [
  { result: "blt", matches: exactly("bacon", "lettuce", "tomato") },
  { result: "veggie_sandwich", matches: exactly("lettuce", "onion", "tomato") },
  { result: "bacon_sandwich", matches: (f) => f.every((filling) => filling === "bacon") },
];
const PLAIN_SANDWICH = "sandwich";

interface PlateContents {
  /** "none", "bread", or "toast". */
  base: string;
  /** Fillings from bottom to top, no gaps. */
  fillings: string[];
}

function readPlate(permutation: BlockPermutation): PlateContents {
  const states = permutation.getAllStates();
  const fillings: string[] = [];
  for (let slot = 1; slot <= SLOTS; slot++) {
    const value = states[`${NS}:layer_${slot}`];
    if (typeof value === "string" && value !== EMPTY) fillings.push(value);
  }
  const base = states[BASE_STATE];
  return { base: typeof base === "string" ? base : EMPTY, fillings };
}

function writePlate(block: Block, { base, fillings }: PlateContents): void {
  const states: Record<string, string> = { [BASE_STATE]: base };
  for (let slot = 1; slot <= SLOTS; slot++) {
    states[`${NS}:layer_${slot}`] = fillings[slot - 1] ?? EMPTY;
  }
  block.setPermutation(BlockPermutation.resolve(block.typeId, states));
}

/** Toasted only when both slices are toast. */
function sandwichFor(fillings: string[], toasted: boolean): string {
  const name = SANDWICHES.find((recipe) => recipe.matches(fillings))?.result ?? PLAIN_SANDWICH;
  return toasted ? `${NS}:toasted_${name}` : `${NS}:${name}`;
}

function above(block: Block): Vector3 {
  const { x, y, z } = block.center();
  return { x, y: y - 0.2, z };
}

export const PlateComponent: BlockCustomComponent = {
  onPlayerInteract({ block, dimension, player }) {
    if (!player) return;
    const plate = readPlate(block.permutation);
    const held = getHeldItem(player);

    // Empty hand: take the top layer back.
    if (!held) {
      const top = plate.fillings.pop();
      if (top) {
        giveItem(player, new ItemStack(ITEM_BY_FILLING.get(top)!));
      } else if (plate.base !== EMPTY) {
        giveItem(player, new ItemStack(ITEM_BY_BASE.get(plate.base)!));
        plate.base = EMPTY;
      } else {
        return;
      }
      writePlate(block, plate);
      dimension.playSound("random.pop", above(block));
      return;
    }

    // Bread or toast: start the sandwich, or finish it if it has fillings.
    const bread = BREADS[held.typeId];
    if (bread) {
      if (plate.base === EMPTY) {
        writePlate(block, { base: bread, fillings: [] });
        consumeHeldItem(player);
        dimension.playSound("random.pop", above(block), { pitch: 0.8 });
        return;
      }
      if (plate.fillings.length === 0) return;

      const result = sandwichFor(plate.fillings, plate.base === "toast" && bread === "toast");
      writePlate(block, { base: EMPTY, fillings: [] });
      consumeHeldItem(player);
      dimension.spawnItem(new ItemStack(result), above(block));
      dimension.playSound("random.pop", above(block), { pitch: 1.2 });
      return;
    }

    // Filling: stack it if there's bread and room.
    const filling = FILLINGS[held.typeId];
    if (filling && plate.base !== EMPTY && plate.fillings.length < SLOTS) {
      plate.fillings.push(filling);
      writePlate(block, plate);
      consumeHeldItem(player);
      dimension.playSound("random.pop", above(block), { pitch: 0.9 + plate.fillings.length * 0.1 });
    }
  },

  onBreak({ block, brokenBlockPermutation, dimension }) {
    const { base, fillings } = readPlate(brokenBlockPermutation);
    const location = block.center();
    const baseItem = ITEM_BY_BASE.get(base);
    if (baseItem) dimension.spawnItem(new ItemStack(baseItem), location);
    for (const filling of fillings) {
      const item = ITEM_BY_FILLING.get(filling);
      if (item) dimension.spawnItem(new ItemStack(item), location);
    }
  },
};
