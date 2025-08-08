import { defineProject } from "vitest/config";

export default defineProject({
  
  test: {
    testTimeout: 10_000,  
    pool: "forks",
    environment: "node"
  },
});
