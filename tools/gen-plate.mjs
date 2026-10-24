// Generates the plate block, its model, and its resource pack entries.
// Run: npm run gen:plate
// To add a filling: add it to FILLINGS here AND to FILLINGS in scripts/components/plate.ts,
// then give it a 4x4 swatch in the plate texture (textures/blocks/kitchen/plate).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { NS, FORMAT, BP, RP } from "./utils/constants.mjs";

const SLOTS = 3;

/**
 * state  value of the hh:layer_N states
 * uv     top-left of its 4x4 swatch in the plate texture
 * size   width/depth of the layer in pixels (bread is 8)
 */
const FILLINGS = [
  { state: "bacon", uv: [12, 4], size: 8 },
  { state: "lettuce", uv: [12, 8], size: 9 },
  { state: "tomato", uv: [12, 12], size: 7 },
  { state: "onion", uv: [0, 12], size: 7 },
  { state: "butter", uv: [16, 0], size: 8 },
  { state: "peanut_butter", uv: [16, 4], size: 8 },
];

/** The bottom slice. Its state value is also the bone name. */
const BASES = [
  { state: "bread", uv: [12, 0] },
  { state: "toast", uv: [4, 12] },
];

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
}

/** A square layer centered on the plate, textured with one 4x4 swatch on every face. */
function layerCube(size, y, height, uv) {
  const swatch = { uv, uv_size: [4, 4] };
  const side = { uv, uv_size: [4, height] };
  return {
    origin: [-size / 2, y, -size / 2],
    size: [size, height, size],
    uv: { north: side, south: side, east: side, west: side, up: swatch, down: swatch },
  };
}

// --- Block ---
const states = { [`${NS}:base`]: ["none", ...BASES.map((b) => b.state)] };
for (let slot = 1; slot <= SLOTS; slot++) {
  states[`${NS}:layer_${slot}`] = ["none", ...FILLINGS.map((f) => f.state)];
}

const boneVisibility = {};
for (const { state } of BASES) {
  boneVisibility[state] = `q.block_state('${NS}:base') == '${state}'`;
}
for (let slot = 1; slot <= SLOTS; slot++) {
  for (const { state } of FILLINGS) {
    boneVisibility[`layer_${slot}_${state}`] = `q.block_state('${NS}:layer_${slot}') == '${state}'`;
  }
}

const block = {
  format_version: FORMAT,
  "minecraft:block": {
    description: {
      identifier: `${NS}:plate`,
      menu_category: { category: "items" },
      states,
    },
    components: {
      [`${NS}:plate`]: {},
      "minecraft:geometry": { identifier: "geometry.hh.plate", bone_visibility: boneVisibility },
      "minecraft:material_instances": {
        "*": { texture: `${NS}_plate`, render_method: "opaque" },
      },
      "minecraft:collision_box": { origin: [-5, 0, -5], size: [10, 1, 10] },
      "minecraft:selection_box": { origin: [-5, 0, -5], size: [10, 2, 10] },
      "minecraft:destructible_by_mining": { seconds_to_destroy: 0.3 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": { conditions: [{ allowed_faces: ["up"] }] },
      "minecraft:tags": ["minecraft:is_pickaxe_item_destructible"],
    },
    permutations: [
      {
        condition: `q.block_state('${NS}:base') != 'none'`,
        components: {
          "minecraft:selection_box": { origin: [-5, 0, -5], size: [10, 3 + SLOTS, 10] },
        },
      },
    ],
  },
};

// --- Model ---
// Plate is 10x1x10. Bread sits on it (y 1-3), each filling slot is 1px above the last.
const bones = [
  {
    name: "plate",
    pivot: [0, 0, 0],
    cubes: [
      {
        origin: [-5, 0, -5],
        size: [10, 1, 10],
        uv: {
          north: { uv: [0, 10], uv_size: [10, 1] },
          south: { uv: [0, 10], uv_size: [10, 1] },
          east: { uv: [0, 10], uv_size: [10, 1] },
          west: { uv: [0, 10], uv_size: [10, 1] },
          up: { uv: [0, 0], uv_size: [10, 10] },
          down: { uv: [0, 0], uv_size: [10, 10] },
        },
      },
    ],
  },
  ...BASES.map(({ state, uv }) => ({
    name: state,
    parent: "plate",
    pivot: [0, 0, 0],
    cubes: [layerCube(8, 1, 2, uv)],
  })),
];
for (let slot = 1; slot <= SLOTS; slot++) {
  for (const { state, uv, size } of FILLINGS) {
    bones.push({
      name: `layer_${slot}_${state}`,
      parent: "plate",
      pivot: [0, 0, 0],
      cubes: [layerCube(size, 2 + slot, 1, uv)],
    });
  }
}

const geometry = {
  format_version: "1.16.0",
  "minecraft:geometry": [
    {
      description: {
        identifier: "geometry.hh.plate",
        texture_width: 32,
        texture_height: 16,
        visible_bounds_width: 2,
        visible_bounds_height: 1.5,
        visible_bounds_offset: [0, 0.25, 0],
      },
      bones,
    },
  ],
};

// --- Recipe ---
const recipe = {
  format_version: FORMAT,
  "minecraft:recipe_shaped": {
    description: { identifier: `${NS}:plate` },
    tags: ["crafting_table"],
    unlock: [{ item: "minecraft:white_terracotta" }],
    pattern: ["TTT"],
    key: { T: { item: "minecraft:white_terracotta" } },
    result: { item: `${NS}:plate`, count: 2 },
  },
};

writeJson(join(BP, "blocks/kitchen/plate.json"), block);
writeJson(join(BP, "recipes/kitchen/plate.json"), recipe);
writeJson(join(RP, "models/blocks/plate.geo.json"), geometry);

// --- Resource pack entries (merged) ---
const blocksFile = join(RP, "blocks.json");
const blocks = readJson(blocksFile, { format_version: [1, 1, 0] });
blocks[`${NS}:plate`] = { sound: "stone" };
writeJson(blocksFile, blocks);

const terrainFile = join(RP, "textures/terrain_texture.json");
const terrain = readJson(terrainFile, null);
terrain.texture_data[`${NS}_plate`] = { textures: "textures/blocks/kitchen/plate" };
writeJson(terrainFile, terrain);

const langFile = join(RP, "texts/en_US.lang");
let lang = existsSync(langFile) ? readFileSync(langFile, "utf8") : "";
if (!lang.endsWith("\n")) lang += "\n";
const key = `tile.${NS}:plate.name`;
if (!lang.split("\n").some((line) => line.startsWith(`${key}=`))) lang += `${key}=Plate\n`;
writeFileSync(langFile, lang);

console.log(`Generated plate with ${SLOTS} slots and ${FILLINGS.length} fillings`);
