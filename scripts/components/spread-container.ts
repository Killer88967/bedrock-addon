import {
  type Block,
  type BlockCustomComponent,
  BlockPermutation,
  ItemComponentTypes,
  ItemStack,
  type Player,
} from "@minecraft/server";
import { NS } from "../constants";
import { COATED_KNIVES, KNIFE, MAX_SPREAD_USES, USES_STATE } from "../spreads";
import { consumeHeldItem, getHeldItem, hint, isCreative, swapHeldItem } from "../utils/inventory";

export const SPREAD_CONTAINER_COMPONENT = `${NS}:spread_container`;

/** Parameters from the block JSON. */
interface SpreadContainerParams {
  /** "butter" or "peanut_butter". */
  spread: string;
  /** Item dropped when broken with spread left; its durability shows what's left. */
  item: string;
  /** Item dropped when broken empty. */
  empty_item: string;
  /** Optional item that refills it to full. */
  refill?: string;
}

function getUses(permutation: BlockPermutation): number {
  const value = permutation.getAllStates()[USES_STATE];
  return typeof value === "number" ? value : 0;
}

function setUses(block: Block, uses: number): void {
  block.setPermutation(BlockPermutation.resolve(block.typeId, { [USES_STATE]: uses }));
}

/** The item form of a container with this many uses left. */
export function containerItem(params: SpreadContainerParams, uses: number): ItemStack {
  if (uses <= 0) return new ItemStack(params.empty_item);
  const stack = new ItemStack(params.item);
  const durability = stack.getComponent(ItemComponentTypes.Durability);
  if (durability) durability.damage = MAX_SPREAD_USES - uses;
  return stack;
}

export const SpreadContainerComponent: BlockCustomComponent = {
  onPlayerInteract({ block, dimension, player }, { params }) {
    if (!player) return;
    const p = params as SpreadContainerParams;
    const uses = getUses(block.permutation);
    const held = getHeldItem(player);

    // Clean knife: scoop some spread onto it.
    if (held?.typeId === KNIFE) {
      const coated = COATED_KNIVES[p.spread];
      if (!coated) return;
      if (uses === 0) {
        hint(player, "It's empty");
        return;
      }
      swapHeldItem(player, coated);
      setUses(block, uses - 1);
      dimension.playSound("random.pop", block.center(), { pitch: 1.6, volume: 0.5 });
      return;
    }

    // Refill.
    if (p.refill && held?.typeId === p.refill) {
      if (uses >= MAX_SPREAD_USES) {
        hint(player, "It's already full");
        return;
      }
      setUses(block, MAX_SPREAD_USES);
      consumeHeldItem(player);
      dimension.playSound("random.pop", block.center(), { pitch: 0.9 });
    }
  },

  onBreak({ block, brokenBlockPermutation, dimension, entitySource }, { params }) {
    if (entitySource?.typeId === "minecraft:player" && isCreative(entitySource as Player)) return;
    const item = containerItem(params as SpreadContainerParams, getUses(brokenBlockPermutation));
    dimension.spawnItem(item, block.center());
  },
};
