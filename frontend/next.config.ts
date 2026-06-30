import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Kunci root workspace ke folder frontend ini. Tanpa ini, lockfile nyasar
  // di direktori induk bisa membuat Turbopack salah menebak root project.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
