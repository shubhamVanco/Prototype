import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server output (.next/standalone) so the Docker image stays small.
  output: "standalone",
  // Trace dependencies from this folder even if a lockfile exists higher up the directory tree.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
};

export default nextConfig;
