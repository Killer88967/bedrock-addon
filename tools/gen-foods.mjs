// Generates simple food items (anything you just eat) and merges their
// texture and lang entries into the resource pack.
// Run: npm run gen:foods
// Edit the FOODS table, never the generated JSON (it gets overwritten).
// Crop produce (tomato, onion, ...) lives in gen-crops.mjs instead.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const NS = "hh";
const FORMAT = "1.26.50";
const BP = "behavior_packs/hearth_and_harvest";
const RP = "resource_packs/hearth_and_harvest";

/*
 * id          item id (texture is textures/items/foods/<id>.png)
 * name        display name
 * nutrition   hunger points restored
 * saturation  saturation_modifier
 * returns     item given back after eating (bowls, jars)
 * stack       max stack size (default 64)
 * compost     composting chance, if compostable
 */
const FOODS = [
  { id: "tomato_slices", name: "Tomato Slices", nutrition: 1, saturation: 0.3, compost: 50 },
  { id: "onion_slices", name: "Onion Slices", nutrition: 1, saturation: 0.3, compost: 50 },
  { id: "lettuce_leaf", name: "Lettuce Leaf", nutrition: 1, saturation: 0.3, compost: 50 },
  { id: "bread_slice", name: "Bread Slice", nutrition: 2, saturation: 0.6, compost: 50 },
  { id: "bacon", name: "Raw Bacon", nutrition: 1, saturation: 0.3 },
  { id: "cooked_bacon", name: "Cooked Bacon", nutrition: 3, saturation: 0.8 },
  { id: "roasted_peanuts", name: "Roasted Peanuts", nutrition: 3, saturation: 0.6 },
  {
    id: "garden_salad",
    name: "Garden Salad",
    nutrition: 8,
    saturation: 0.6,
    returns: "minecraft:bowl",
    stack: 1,
  },
];

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
}

function foodItem(food) {
  const components = {
    "minecraft:icon": { textures: { default: `${NS}_${food.id}` } },
    "minecraft:food": {
      nutrition: food.nutrition,
      saturation_modifier: food.saturation,
      ...(food.returns ? { using_converts_to: food.returns } : {}),
    },
    "minecraft:use_modifiers": { use_duration: 1.6, movement_modifier: 0.35 },
    "minecraft:use_animation": "eat",
  };
  if (food.stack) components["minecraft:max_stack_size"] = food.stack;
  if (food.compost) components["minecraft:compostable"] = { composting_chance: food.compost };

  return {
    format_version: FORMAT,
    "minecraft:item": {
      description: {
        identifier: `${NS}:${food.id}`,
        menu_category: { category: "equipment", group: "minecraft:itemGroup.name.miscFood" },
      },
      components,
    },
  };
}

for (const food of FOODS) {
  writeJson(join(BP, `items/foods/${food.id}.json`), foodItem(food));
}

const itemTexFile = join(RP, "textures/item_texture.json");
const itemTex = readJson(itemTexFile, {
  resource_pack_name: "hearth_and_harvest",
  texture_name: "atlas.items",
  texture_data: {},
});
for (const food of FOODS) {
  itemTex.texture_data[`${NS}_${food.id}`] = { textures: `textures/items/foods/${food.id}` };
}
writeJson(itemTexFile, itemTex);

const langFile = join(RP, "texts/en_US.lang");
let lang = existsSync(langFile) ? readFileSync(langFile, "utf8") : "";
if (!lang.endsWith("\n")) lang += "\n";
for (const food of FOODS) {
  const key = `item.${NS}:${food.id}`;
  if (!lang.split("\n").some((line) => line.startsWith(`${key}=`))) lang += `${key}=${food.name}\n`;
}
writeFileSync(langFile, lang);

console.log(`Generated ${FOODS.length} foods: ${FOODS.map((f) => f.id).join(", ")}`);
