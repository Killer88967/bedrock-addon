import {
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  type ItemStack,
  type Player,
} from "@minecraft/server";

export function getHeldItem(player: Player): ItemStack | undefined {
  return player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
}

/** Removes one of the held item, unless the player is in creative. */
export function consumeHeldItem(player: Player): void {
  if (player.getGameMode() === GameMode.Creative) return;
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!equippable || !held) return;

  if (held.amount > 1) {
    held.amount -= 1;
    equippable.setEquipment(EquipmentSlot.Mainhand, held);
  } else {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
  }
}
