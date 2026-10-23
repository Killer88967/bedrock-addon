import tseslint from "typescript-eslint";
import minecraftLinting from "eslint-plugin-minecraft-linting";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["scripts/**/*.ts"],
    extends: [tseslint.configs.recommended],
    plugins: { "minecraft-linting": minecraftLinting },
    rules: {
      "minecraft-linting/avoid-unnecessary-command": "error",
    },
  },
);
