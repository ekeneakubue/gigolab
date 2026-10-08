import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["@aws-sdk/client-s3"],
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
