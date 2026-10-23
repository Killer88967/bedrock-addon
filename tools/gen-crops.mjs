// Generates every crop's block, seed item, food item, loot tables, seed recipe,
// and merges its texture/sound/lang entries into the resource pack.
// Run: npm run gen:crops
// Edit the CROPS table, never the generated JSON (it gets overwritten).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const NS = "hh";
const FORMAT = "1.26.50";
const BP = "behavior_packs/hearth_and_harvest";
const RP = "resource_packs/hearth_and_harvest";

/**
 * id            item/block base name
 * name          display name of the produce
 * growthChance  chance per random tick on wet farmland (halved when dry)
 * food          nutrition + saturation_modifier for the produce
 * heights       selection box height for each of the 4 visual stages
 * mature        [min, max] drops when the ripe crop is broken
 * harvest       optional right-click picking that regrows from `resetTo`
 * seedRecipe    seeds crafted from 1 produce
 */
const CROPS = [
  {
    id: "tomato",
    name: "Tomato",
    growthChance: 0.3,
    food: { nutrition: 3, saturation: 0.6 },
    heights: [3, 7, 11, 14],
    mature: { produce: [1, 3], seeds: [1, 2] },
    harvest: { min: 1, max: 3, resetTo: 4 },
    seedRecipe: 2,
  },
  {
    id: "onion",
    name: "Onion",
    growthChance: 0.3,
    food: { nutrition: 2, saturation: 0.3 },
    heights: [3, 6, 9, 11],
    mature: { produce: [2, 4], seeds: [0, 2] },
    seedRecipe: 1,
  },
  {
    id: "lettuce",
    name: "Lettuce",
    growthChance: 0.35,
    food: { nutrition: 2, saturation: 0.6 },
    heights: [3, 5, 7, 9],
    mature: { produce: [1, 1], seeds: [1, 2] },
    seedRecipe: 1,
  },
  {
    id: "strawberry",
    name: "Strawberry",
    growthChance: 0.25,
    food: { nutrition: 2, saturation: 0.3 },
    heights: [3, 6, 8, 9],
    mature: { produce: [1, 3], seeds: [1, 1] },
    harvest: { min: 1, max: 3, resetTo: 4 },
    seedRecipe: 2,
  },
  {
    id: "peanut",
    name: "Peanut",
    growthChance: 0.3,
    food: { nutrition: 1, saturation: 0.3 },
    heights: [3, 6, 9, 10],
    mature: { produce: [2, 4], seeds: [0, 1] },
    seedRecipe: 1,
  },
];

// 8 growth states shown as 4 visuals. Visual 0 (growth 0-1) is the base block.
const STAGE_CONDITIONS = [
  "q.block_state('hh:growth') >= 2 && q.block_state('hh:growth') <= 3",
  "q.block_state('hh:growth') >= 4 && q.block_state('hh:growth') <= 6",
  "q.block_state('hh:growth') == 7",
];

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
}

function material(texture) {
  return {
    "*": { texture, render_method: "alpha_test", ambient_occlusion: 0.0, face_dimming: false },
  };
}

function selectionBox(height) {
  return { origin: [-8, 0, -8], size: [16, height, 16] };
}

function countFn([min, max]) {
  return min === max && min === 1 ? [] : [{ function: "set_count", count: { min, max } }];
}

function itemEntry(name, range) {
  const functions = countFn(range);
  return { type: "item", name, weight: 1, ...(functions.length ? { functions } : {}) };
}

function block(crop) {
  const texture = (i) => `${NS}_${crop.id}_crop_stage_${i}`;
  const lootPath = (kind) => `loot_tables/blocks/crops/${crop.id}_crop_${kind}.json`;

  const cropParams = { max_growth: 7, growth_chance: crop.growthChance };
  if (crop.harvest) {
    const { min, max, resetTo } = crop.harvest;
    cropParams.harvest = { item: `${NS}:${crop.id}`, min, max, reset_to: resetTo };
  }

  return {
    format_version: FORMAT,
    "minecraft:block": {
      description: {
        identifier: `${NS}:${crop.id}_crop`,
        menu_category: { category: "none" },
        states: { [`${NS}:growth`]: [0, 1, 2, 3, 4, 5, 6, 7] },
      },
      components: {
        [`${NS}:crop`]: cropParams,
        "minecraft:geometry": "geometry.hh.crop",
        "minecraft:material_instances": material(texture(0)),
        "minecraft:collision_box": false,
        "minecraft:selection_box": selectionBox(crop.heights[0]),
        "minecraft:destructible_by_mining": { seconds_to_destroy: 0 },
        "minecraft:light_dampening": 0,
        "minecraft:placement_filter": {
          conditions: [{ allowed_faces: ["up"], block_filter: ["minecraft:farmland"] }],
        },
        "minecraft:loot": lootPath("young"),
      },
      permutations: STAGE_CONDITIONS.map((condition, i) => {
        const stage = i + 1;
        const components = {
          "minecraft:material_instances": material(texture(stage)),
          "minecraft:selection_box": selectionBox(crop.heights[stage]),
        };
        if (stage === 3) components["minecraft:loot"] = lootPath("mature");
        return { condition, components };
      }),
    },
  };
}

function seedsItem(crop) {
  return {
    format_version: FORMAT,
    "minecraft:item": {
      description: {
        identifier: `${NS}:${crop.id}_seeds`,
        menu_category: { category: "nature", group: "minecraft:itemGroup.name.seed" },
      },
      components: {
        "minecraft:icon": { textures: { default: `${NS}_${crop.id}_seeds` } },
        "minecraft:block_placer": {
          block: `${NS}:${crop.id}_crop`,
          use_on: [{ name: "minecraft:farmland" }],
        },
        "minecraft:compostable": { composting_chance: 30 },
      },
    },
  };
}

function foodItem(crop) {
  return {
    format_version: FORMAT,
    "minecraft:item": {
      description: {
        identifier: `${NS}:${crop.id}`,
        menu_category: { category: "equipment", group: "minecraft:itemGroup.name.miscFood" },
      },
      components: {
        "minecraft:icon": { textures: { default: `${NS}_${crop.id}` } },
        "minecraft:food": {
          nutrition: crop.food.nutrition,
          saturation_modifier: crop.food.saturation,
        },
        "minecraft:use_modifiers": { use_duration: 1.6, movement_modifier: 0.35 },
        "minecraft:use_animation": "eat",
        "minecraft:compostable": { composting_chance: 65 },
      },
    },
  };
}

function youngLoot(crop) {
  return { pools: [{ rolls: 1, entries: [itemEntry(`${NS}:${crop.id}_seeds`, [1, 1])] }] };
}

function matureLoot(crop) {
  return {
    pools: [
      { rolls: 1, entries: [itemEntry(`${NS}:${crop.id}`, crop.mature.produce)] },
      { rolls: 1, entries: [itemEntry(`${NS}:${crop.id}_seeds`, crop.mature.seeds)] },
    ],
  };
}

function seedRecipe(crop) {
  return {
    format_version: FORMAT,
    "minecraft:recipe_shapeless": {
      description: { identifier: `${NS}:${crop.id}_seeds_from_${crop.id}` },
      tags: ["crafting_table"],
      unlock: [{ item: `${NS}:${crop.id}` }],
      ingredients: [{ item: `${NS}:${crop.id}` }],
      result: { item: `${NS}:${crop.id}_seeds`, count: crop.seedRecipe },
    },
  };
}

// --- Behavior pack ---
for (const crop of CROPS) {
  writeJson(join(BP, `blocks/crops/${crop.id}_crop.json`), block(crop));
  writeJson(join(BP, `items/crops/${crop.id}_seeds.json`), seedsItem(crop));
  writeJson(join(BP, `items/foods/${crop.id}.json`), foodItem(crop));
  writeJson(join(BP, `loot_tables/blocks/crops/${crop.id}_crop_young.json`), youngLoot(crop));
  writeJson(join(BP, `loot_tables/blocks/crops/${crop.id}_crop_mature.json`), matureLoot(crop));
  writeJson(join(BP, `recipes/crops/${crop.id}_seeds.json`), seedRecipe(crop));
}

// --- Resource pack (merged so non-crop entries are kept) ---
const terrainFile = join(RP, "textures/terrain_texture.json");
const terrain = readJson(terrainFile, {
  resource_pack_name: "hearth_and_harvest",
  texture_name: "atlas.terrain",
  padding: 8,
  num_mip_levels: 4,
  texture_data: {},
});
const itemTexFile = join(RP, "textures/item_texture.json");
const itemTex = readJson(itemTexFile, {
  resource_pack_name: "hearth_and_harvest",
  texture_name: "atlas.items",
  texture_data: {},
});
const blocksFile = join(RP, "blocks.json");
const blocks = readJson(blocksFile, { format_version: [1, 1, 0] });

for (const crop of CROPS) {
  for (let i = 0; i < 4; i++) {
    terrain.texture_data[`${NS}_${crop.id}_crop_stage_${i}`] = {
      textures: `textures/blocks/crops/${crop.id}_stage_${i}`,
    };
  }
  itemTex.texture_data[`${NS}_${crop.id}`] = { textures: `textures/items/foods/${crop.id}` };
  itemTex.texture_data[`${NS}_${crop.id}_seeds`] = {
    textures: `textures/items/crops/${crop.id}_seeds`,
  };
  blocks[`${NS}:${crop.id}_crop`] = { sound: "grass" };
}

writeJson(terrainFile, terrain);
writeJson(itemTexFile, itemTex);
writeJson(blocksFile, blocks);

// Lang: add missing keys, keep everything else as-is.
const langFile = join(RP, "texts/en_US.lang");
let lang = existsSync(langFile) ? readFileSync(langFile, "utf8") : "";
if (!lang.endsWith("\n")) lang += "\n";
for (const crop of CROPS) {
  const entries = {
    [`tile.${NS}:${crop.id}_crop.name`]: `${crop.name} Crop`,
    [`item.${NS}:${crop.id}`]: crop.name,
    [`item.${NS}:${crop.id}_seeds`]: `${crop.name} Seeds`,
  };
  for (const [key, value] of Object.entries(entries)) {
    if (!lang.split("\n").some((line) => line.startsWith(`${key}=`))) lang += `${key}=${value}\n`;
  }
}
writeFileSync(langFile, lang);

console.log(`Generated ${CROPS.length} crops: ${CROPS.map((c) => c.id).join(", ")}`);
