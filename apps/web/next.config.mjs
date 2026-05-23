/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mezo Passport / wallet SDKs ship ESM that Next must transpile.
  transpilePackages: [],
};

export default nextConfig;
