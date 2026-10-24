import {
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  ItemComponentTypes,
  ItemStack,
  type Player,
} from "@minecraft/server";

export function getHeldItem(player: Player): ItemStack | undefined {
  return player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
}

export function isCreative(player: Player): boolean {
  return player.getGameMode() === GameMode.Creative;
}

/** Removes `count` of the held item, unless the player is in creative. */
export function consumeHeldItem(player: Player, count = 1): void {
  if (isCreative(player)) return;
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!equippable || !held) return;

  if (held.amount > count) {
    held.amount -= count;
    equippable.setEquipment(EquipmentSlot.Mainhand, held);
  } else {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
  }
}

/** Uses up one durability point on the held item, breaking it when it runs out. */
export function damageHeldItem(player: Player): void {
  if (player.getGameMode() === GameMode.Creative) return;
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  const durability = held?.getComponent(ItemComponentTypes.Durability);
  if (!equippable || !held || !durability) return;

  if (durability.damage + 1 >= durability.maxDurability) {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    player.playSound("random.break");
  } else {
    durability.damage += 1;
    equippable.setEquipment(EquipmentSlot.Mainhand, held);
  }
}

/** Puts an item in the player's inventory, dropping whatever doesn't fit at their feet. */
export function giveItem(player: Player, item: ItemStack): void {
  const leftover = player.getComponent(EntityComponentTypes.Inventory)?.container.addItem(item);
  if (leftover) player.dimension.spawnItem(leftover, player.location);
}

/** Swaps the held item for another item type, keeping its durability damage and name. */
export function swapHeldItem(player: Player, typeId: string): void {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!equippable || !held) return;

  const next = new ItemStack(typeId, held.amount);
  const oldDurability = held.getComponent(ItemComponentTypes.Durability);
  const newDurability = next.getComponent(ItemComponentTypes.Durability);
  if (oldDurability && newDurability) {
    newDurability.damage = Math.min(oldDurability.damage, newDurability.maxDurability);
  }
  if (held.nameTag) next.nameTag = held.nameTag;
  equippable.setEquipment(EquipmentSlot.Mainhand, next);
}

/** Shows a short message above the hotbar. */
export function hint(player: Player, message: string): void {
  player.onScreenDisplay.setActionBar(message);
}
