// Generates simple food items (anything you just eat) and merges their
// texture and lang entries into the resource pack.
// Run: npm run gen:foods
// Edit the FOODS table, never the generated JSON (it gets overwritten).
// Crop produce (tomato, onion, ...) lives in gen-crops.mjs instead.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { NS, FORMAT, BP, RP } from "./utils/constants.mjs";

/*
 * id          item id (texture is textures/items/foods/<id>.png)
 * name        display name
 * nutrition   hunger points restored
 * saturation  saturation_modifier
 * returns     item given back after eating (bowls, jars)
 * stack       max stack size (default 64)
 * compost     composting chance, if compostable
 * smeltFrom   also generate a furnace/smoker/campfire recipe from this item
 */
const FOODS = [
  { id: "tomato_slices", name: "Tomato Slices", nutrition: 1, saturation: 0.3, compost: 50 },
  { id: "onion_slices", name: "Onion Slices", nutrition: 1, saturation: 0.3, compost: 50 },
  { id: "lettuce_leaf", name: "Lettuce Leaf", nutrition: 1, saturation: 0.3, compost: 50 },
  { id: "bread_slice", name: "Bread Slice", nutrition: 2, saturation: 0.6, compost: 50 },
  { id: "toast", name: "Toast", nutrition: 3, saturation: 0.6 },
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
  { id: "sandwich", name: "Sandwich", nutrition: 6, saturation: 0.6 },
  { id: "veggie_sandwich", name: "Veggie Sandwich", nutrition: 7, saturation: 0.7 },
  { id: "bacon_sandwich", name: "Bacon Sandwich", nutrition: 8, saturation: 0.8 },
  { id: "blt", name: "BLT", nutrition: 10, saturation: 0.9 },
  { id: "toasted_sandwich", name: "Toasted Sandwich", nutrition: 7, saturation: 0.7 },
  { id: "toasted_veggie_sandwich", name: "Toasted Veggie Sandwich", nutrition: 8, saturation: 0.8 },
  { id: "toasted_bacon_sandwich", name: "Toasted Bacon Sandwich", nutrition: 9, saturation: 0.9 },
  { id: "toasted_blt", name: "Toasted BLT", nutrition: 11, saturation: 1.0 },
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

function smeltRecipe(food) {
  return {
    format_version: FORMAT,
    "minecraft:recipe_furnace": {
      description: { identifier: `${NS}:${food.id}` },
      unlock: [{ item: food.smeltFrom }],
      tags: ["furnace", "smoker", "campfire", "soul_campfire"],
      input: food.smeltFrom,
      output: `${NS}:${food.id}`,
    },
  };
}

for (const food of FOODS) {
  writeJson(join(BP, `items/foods/${food.id}.json`), foodItem(food));
  if (food.smeltFrom) writeJson(join(BP, `recipes/foods/${food.id}.json`), smeltRecipe(food));
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
