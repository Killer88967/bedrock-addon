# Hearth & Harvest - Roadmap

Bedrock addon (BP + RP) adding farming, cooking, kitchen blocks, home furniture,
and fitting mobs. Single player, multiplayer, and Realms.

## Tech

- TypeScript, `@minecraft/server` + `@minecraft/server-ui` (stable only, no Beta APIs so it runs on Realms)
- Build: `@minecraft/core-build-tasks` (just-scripts + esbuild)
- `npm run build` / `npm run mcaddon` / `npm run mcaddon:production`
- Target: latest stable Bedrock (26.50+). Manifest module versions must match installed typings.
- Namespace: `hh:`

## Mechanics (decided)

- **Crops**: custom crop blocks with growth-stage states, bonemeal support, seeds from grass/wild plants.
- **Processing chain**: raw crop → prep (cutting board) → cook (cooking pot / stove) → store (fridge, cupboard).
- **Cutting board**: place ingredient, interact with knife to slice. Sandwiches assembled here in order (bread → fillings → bread).
- **Butter churn**: milk bucket → butter (returns empty bucket).
- **Cooking pot**: over a heat source (campfire/stove) with a server-ui recipe picker; jams, soups, stews.
- **Storage blocks** (fridge, cupboard, drawers): inventory backed by an invisible container entity tied to the block; removed and items dropped when the block breaks.
- **Freshness**: optional. Fridge-stored food stays fresh; controlled by a world setting so it can be disabled.
- **Food buffs**: crafted meals give better saturation and small effects (e.g. stew → regeneration I, short).
- **Multiplayer**: all block state stored in dynamic properties keyed by dimension + location; per-block "in use" lock so two players can't use the same station at once; no client-only state.

## Phase 0 - Project setup

- [x] Devcontainer, package.json, tsconfig, just.config.ts, ESLint, Prettier
- [x] BP + RP manifests with dependency UUIDs linked
- [x] Script entry, registered custom block/item components skeleton
- [x] Lang files (en_US) set up

## Phase 1 - Crops & raw ingredients

- [x] Tomato, onion, lettuce, strawberry, peanut (crop blocks + seeds + produce)
- [x] Growth stages, bonemeal, drops, farmland requirement
- [x] Wild variants that drop seeds
- [x] Textures + item icons

## Phase 2 - Basic foods

- [x] Knife item (durability)
- [ ] Butter (churn), cheese (later), peanut butter
- [ ] Jams: strawberry, sweet berry, glow berry (+ glass jar item)
- [x] Sliced items: tomato slices, onion slices, lettuce leaf, bread slice
- [ ] Sandwiches: PB&J, BLT-style, cheese/veggie, toasted variants

## Phase 3 - Kitchen blocks & UI

- [x] Cutting board (block + interaction + slice logic)
- [x] Toaster
- [ ] Butter churn
- [ ] Cooking pot + server-ui recipe menu
- [ ] Stove (heat source, multiple wood types optional)
- [ ] Recipe registry in TS so new recipes are data, not new code

## Phase 4 - Storage & furniture

- [ ] Fridge (2-block tall, open/close states, freshness hook)
- [ ] Cupboards + drawers (all vanilla wood types incl. poplar)
- [ ] Counter tops, shelves, table, chairs (sittable via rideable entity)
- [ ] Lamps / pendant lights, window shutters, rugs
- [ ] Container entity system shared across all storage blocks

## Phase 5 - World integration

- [ ] Wild crops via feature rules in Dappled Forest (+ plains/meadow where it fits)
- [ ] Seeds in village chest loot (prefer script-injected loot over overriding vanilla tables, for compatibility)
- [ ] Investigate adding crops to village farms (jigsaw/structure edits); fallback: script-based farm decoration on first chunk visit
- [ ] Wandering trader trades for seeds and kitchen items

## Phase 6 - Mobs

- [ ] Field mouse: small pest, nibbles mature crops, drops nothing special, scared of cats
- [ ] Crow: steals seeds from dropped items/farmland, drops feathers
- [ ] Scarecrow: craftable decorative guard that scares crows/mice in a radius
- [ ] Traveling farmer villager-style trader (seeds, jars, rare recipes)
- [ ] Spawn rules, models, animations, sounds

## Phase 7 - Polish & multiplayer testing

- [ ] Realm test with 2+ players (station locks, storage sync, chunk unload safety)
- [ ] Balance pass on hunger/saturation/effects
- [ ] Recipe book / guide item (server-ui)
- [ ] Settings menu (freshness on/off, pest spawn rate)
- [ ] Production build size and performance check

## Backlog

- Cheese wheel aging, pickling, baking oven (pies, cakes)
- Beehive-adjacent honey recipes
- Greenhouse block / sprinkler
- More crops: corn, rice, pepper, garlic, potato variants
