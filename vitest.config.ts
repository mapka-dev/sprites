import { defineConfig } from "vitest/config";

const projects = [
  "sprites-generate", 
  "sprites-benchmarks",
  "shelf-pack"
];

export default defineConfig({
  test: {
    projects: projects.map((name) => {
      return {
        extends: `./packages/${name}/vitest.config.ts`,
          test: {
          root: `./packages/${name}/`,
          name,
          include: [
            "src/**/*.test.ts",
            "src/**/*.test.tsx",
          ],
          benchmark: {
            include: ["src/**/*.bench.ts"],
          },
        },
      };
    }),
  },
});