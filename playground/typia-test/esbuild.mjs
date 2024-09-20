import { build } from "esbuild";
import UnpluginTypia from "@ryoppippi/unplugin-typia/esbuild";

build({
  entryPoints: ["./output/**/*"],
  bundle: true,
  outdir: "./build",
  plugins: [
    UnpluginTypia({
      /* options */
      cache: true,
    }),
  ],
});
