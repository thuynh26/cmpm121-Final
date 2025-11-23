// https://vitejs.dev/config/
export default {
  base: Deno.env.get("REPO_NAME") || "/",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: "es2015",
    outDir: "dist",
    sourcemap: true,
  },
};
