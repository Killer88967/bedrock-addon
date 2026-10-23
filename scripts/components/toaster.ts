import {
  type Block,
  type BlockCustomComponent,
  BlockPermutation,
  ItemStack,
  type Vector3,
} from "@minecraft/server";
import { NS } from "../constants";
import { consumeHeldItem, getHeldItem } from "../utils/inventory";

export const TOASTER_COMPONENT = `${NS}:toaster`;

const SLICES_STATE = `${NS}:slices`;
const TIME_STATE = `${NS}:toast_time`;
const MAX_SLICES = 2;
/** Seconds to toast. The block ticks once a second; must match the hh:toast_time range. */
const TOAST_SECONDS = 5;
const BREAD_SLICE = `${NS}:bread_slice`;
const TOAST = `${NS}:toast`;

interface ToasterState {
  slices: number;
  /** 0 = idle, 1..TOAST_SECONDS = seconds spent toasting. */
  time: number;
}

function readToaster(permutation: BlockPermutation): ToasterState {
  const states = permutation.getAllStates();
  const slices = states[SLICES_STATE];
  const time = states[TIME_STATE];
  return {
    slices: typeof slices === "number" ? slices : 0,
    time: typeof time === "number" ? time : 0,
  };
}

function writeToaster(block: Block, { slices, time }: ToasterState): void {
  const states = {
    ...block.permutation.getAllStates(),
    [SLICES_STATE]: slices,
    [TIME_STATE]: time,
  };
  block.setPermutation(BlockPermutation.resolve(block.typeId, states));
}

function top(block: Block): Vector3 {
  const { x, y, z } = block.center();
  return { x, y: y + 0.1, z };
}

export const ToasterComponent: BlockCustomComponent = {
  onPlayerInteract({ block, dimension, player }) {
    if (!player) return;
    const toaster = readToaster(block.permutation);
    if (toaster.time > 0) return; // Busy toasting.

    const held = getHeldItem(player);

    // Load a slice.
    if (held?.typeId === BREAD_SLICE && toaster.slices < MAX_SLICES) {
      writeToaster(block, { slices: toaster.slices + 1, time: 0 });
      consumeHeldItem(player);
      dimension.playSound("random.pop", top(block), { pitch: 0.8 });
      return;
    }

    // Empty hand: push the lever down.
    if (!held && toaster.slices > 0) {
      writeToaster(block, { slices: toaster.slices, time: 1 });
      dimension.playSound("random.click", top(block));
    }
  },

  onTick({ block, dimension }) {
    const toaster = readToaster(block.permutation);
    if (toaster.time === 0) return;

    if (toaster.time < TOAST_SECONDS) {
      writeToaster(block, { slices: toaster.slices, time: toaster.time + 1 });
      dimension.spawnParticle("minecraft:basic_smoke_particle", top(block));
      return;
    }

    // Done: pop the toast out.
    writeToaster(block, { slices: 0, time: 0 });
    for (let i = 0; i < toaster.slices; i++) {
      const item = dimension.spawnItem(new ItemStack(TOAST), top(block));
      item.applyImpulse({ x: (Math.random() - 0.5) * 0.1, y: 0.3, z: (Math.random() - 0.5) * 0.1 });
    }
    dimension.playSound("random.pop", top(block), { pitch: 1.4 });
  },

  onBreak({ block, brokenBlockPermutation, dimension }) {
    const { slices } = readToaster(brokenBlockPermutation);
    if (slices > 0) dimension.spawnItem(new ItemStack(BREAD_SLICE, slices), block.center());
  },
};
