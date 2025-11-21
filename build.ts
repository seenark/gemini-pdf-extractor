import process from "node:process";
import Bun from "bun";

Bun.build({
    bytecode: false,
    entrypoints: ["./src/index.ts"],
    format: "esm",
    minify: true,
    outdir: "./dist",
    target: "bun",
}).then((result) => {
    if (result.success === false) {
        console.error("Build failed: ", result.logs);
        process.exit(1);
    }
})