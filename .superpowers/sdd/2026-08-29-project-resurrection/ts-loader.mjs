import { access, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { loadBindings, transform } from "next/dist/build/swc/index.js";

const SOURCE_ROOT = "/Users/pufferfish/Desktop/daytona/src/";

await loadBindings();

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return resolveTypeScriptFile(pathToFileURL(`${SOURCE_ROOT}${specifier.slice(2)}`).href, context, nextResolve);
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!specifier.startsWith("./") && !specifier.startsWith("../")) throw error;
    return resolveTypeScriptFile(new URL(specifier, context.parentURL).href, context, nextResolve);
  }
}

const resolveTypeScriptFile = async (url, context, nextResolve) => {
  const candidate = `${url}.ts`;
  await access(new URL(candidate));
  return nextResolve(candidate, context);
};

export async function load(url, context, nextLoad) {
  if (!url.endsWith(".ts")) return nextLoad(url, context);
  const source = await readFile(new URL(url), "utf8");
  const output = await transform(source, {
    filename: new URL(url).pathname,
    jsc: { parser: { syntax: "typescript" }, target: "es2022" },
    module: { type: "es6" },
  });
  return { format: "module", shortCircuit: true, source: output.code };
}
