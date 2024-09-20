import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["./output/**/*"],
  bundle: true,
  outdir: "./build",
});
