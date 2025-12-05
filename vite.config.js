// https://vitejs.dev/config/
export default {
  base: Deno.env.get("REPO_NAME") || "/",
  publicDir: "public",
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
