import {
  BlockPermutation,
  Direction,
  ItemComponentTypes,
  type ItemCustomComponent,
  type Player,
} from "@minecraft/server";
import { NS } from "../constants";
import { MAX_SPREAD_USES, USES_STATE } from "../spreads";
import { consumeHeldItem } from "../utils/inventory";

export const SPREAD_PLACER_COMPONENT = `${NS}:spread_placer`;

interface SpreadPlacerParams {
  /** Block to place. Its hh:uses state is set from the item's durability. */
  block: string;
}

/**
 * Places a butter dish or peanut butter jar, keeping how much is left.
 * Items without durability (the empty dish) place an empty one.
 */
export const SpreadPlacerComponent: ItemCustomComponent = {
  onUseOn({ source, block, blockFace, itemStack }, { params }) {
    if (source.typeId !== "minecraft:player" || blockFace !== Direction.Up) return;
    const target = block.above();
    if (!target?.isAir) return;

    const durability = itemStack.getComponent(ItemComponentTypes.Durability);
    const uses = durability ? MAX_SPREAD_USES - durability.damage : 0;
    const { block: blockId } = params as SpreadPlacerParams;

    target.setPermutation(BlockPermutation.resolve(blockId, { [USES_STATE]: uses }));
    consumeHeldItem(source as Player);
    target.dimension.playSound("dig.stone", target.center());
  },
};
