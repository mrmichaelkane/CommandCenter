import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subfolder of a larger repo; pin the workspace root so
  // Turbopack doesn't infer the parent directory from a sibling lockfile.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
