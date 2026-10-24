import { NS } from "./constants";

/** Every butter dish and peanut butter jar holds this many spreads. */
export const MAX_SPREAD_USES = 4;
export const USES_STATE = `${NS}:uses`;
export const KNIFE = `${NS}:knife`;

/** Spread -> knife coated in it. */
export const COATED_KNIVES: Record<string, string> = {
  butter: `${NS}:butter_knife`,
  peanut_butter: `${NS}:peanut_butter_knife`,
};

export const SPREAD_BY_KNIFE = new Map(
  Object.entries(COATED_KNIVES).map(([spread, knife]) => [knife, spread]),
);
