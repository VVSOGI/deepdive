import { build } from "esbuild";
import UnpluginTypia from "@ryoppippi/unplugin-typia/esbuild";

build({
  entryPoints: "./output/**",
  bundle: true,
  outfile: "./build/output.js",
  plugins: [
    UnpluginTypia({
      /* options */
    }),
  ],
});
