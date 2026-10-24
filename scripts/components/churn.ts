import {
  type Block,
  type BlockCustomComponent,
  BlockPermutation,
  ItemStack,
  type Vector3,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { NS } from "../constants";
import { consumeHeldItem, getHeldItem, giveItem, hint, isCreative } from "../utils/inventory";

export const CHURN_COMPONENT = `${NS}:churn`;

const CONTENTS_STATE = `${NS}:contents`;
const PROGRESS_STATE = `${NS}:progress`;
const EMPTY = "none";
/** Clicks to finish. Must match the top of the hh:progress range. */
const CHURN_STEPS = 5;
const GLASS_JAR = `${NS}:glass_jar`;

interface ChurnInput {
  /** Value of the hh:contents state. */
  contents: string;
  /** How many of the item it takes. */
  amount: number;
  /** Item handed back when loading (the empty bucket). */
  returns?: string;
}

/** Held item -> what it fills the churn with. */
const INPUTS: Record<string, ChurnInput> = {
  [MinecraftItemTypes.MilkBucket]: {
    contents: "milk",
    amount: 1,
    returns: MinecraftItemTypes.Bucket,
  },
  [`${NS}:roasted_peanuts`]: { contents: "peanuts", amount: 3 },
};

/** What each filling turns into once churned. */
const OUTPUTS: Record<string, { item: string; count: number; needsJar: boolean }> = {
  milk: { item: `${NS}:butter`, count: 2, needsJar: false },
  peanuts: { item: `${NS}:peanut_butter`, count: 1, needsJar: true },
};

/** Dropped when the churn is broken mid-churn. Milk just spills. */
const DROPS_ON_BREAK: Record<string, { item: string; count: number }> = {
  peanuts: { item: `${NS}:roasted_peanuts`, count: 3 },
};

interface ChurnState {
  contents: string;
  progress: number;
}

function readChurn(permutation: BlockPermutation): ChurnState {
  const states = permutation.getAllStates();
  const contents = states[CONTENTS_STATE];
  const progress = states[PROGRESS_STATE];
  return {
    contents: typeof contents === "string" ? contents : EMPTY,
    progress: typeof progress === "number" ? progress : 0,
  };
}

function writeChurn(block: Block, { contents, progress }: ChurnState): void {
  block.setPermutation(
    BlockPermutation.resolve(block.typeId, {
      [CONTENTS_STATE]: contents,
      [PROGRESS_STATE]: progress,
    }),
  );
}

function top(block: Block): Vector3 {
  const { x, y, z } = block.center();
  return { x, y: y + 0.5, z };
}

export const ChurnComponent: BlockCustomComponent = {
  onPlayerInteract({ block, dimension, player }) {
    if (!player) return;
    const churn = readChurn(block.permutation);
    const held = getHeldItem(player);

    // Empty churn: load it.
    if (churn.contents === EMPTY) {
      const input = held && INPUTS[held.typeId];
      if (!input) return;
      if (held.amount < input.amount && !isCreative(player)) {
        hint(player, `Needs ${input.amount} of these`);
        return;
      }
      writeChurn(block, { contents: input.contents, progress: 0 });
      consumeHeldItem(player, input.amount);
      if (input.returns && !isCreative(player)) giveItem(player, new ItemStack(input.returns));
      dimension.playSound("bucket.empty_water", top(block), { pitch: 1.2 });
      return;
    }

    const output = OUTPUTS[churn.contents];
    if (!output) {
      writeChurn(block, { contents: EMPTY, progress: 0 }); // Unknown contents, clear it.
      return;
    }

    // Finished and waiting for a jar.
    if (churn.progress >= CHURN_STEPS) {
      if (held?.typeId === GLASS_JAR) {
        consumeHeldItem(player);
        giveItem(player, new ItemStack(output.item, output.count));
        writeChurn(block, { contents: EMPTY, progress: 0 });
        dimension.playSound("bottle.fill", top(block));
      } else {
        hint(player, "Use a glass jar to collect it");
      }
      return;
    }

    // Empty hand: churn.
    if (held) return;
    const progress = churn.progress + 1;
    dimension.playSound("random.splash", top(block), { volume: 0.4, pitch: 1.4 + progress * 0.05 });

    if (progress < CHURN_STEPS) {
      writeChurn(block, { contents: churn.contents, progress });
      return;
    }

    if (output.needsJar) {
      writeChurn(block, { contents: churn.contents, progress });
      hint(player, "Done! Use a glass jar to collect it");
    } else {
      writeChurn(block, { contents: EMPTY, progress: 0 });
      dimension.spawnItem(new ItemStack(output.item, output.count), top(block));
      dimension.playSound("random.pop", top(block));
    }
  },

  onBreak({ block, brokenBlockPermutation, dimension }) {
    const { contents } = readChurn(brokenBlockPermutation);
    const drop = DROPS_ON_BREAK[contents];
    if (drop) dimension.spawnItem(new ItemStack(drop.item, drop.count), block.center());
  },
};
