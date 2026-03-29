/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === "development",
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === "development",
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    domains: ["placeholder.svg"],
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  
  // Security headers
  async headers() {
    const commonHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ]

    // Do not block embedding in development so the Builder preview iframe works
    const headers = process.env.NODE_ENV === "development"
      ? commonHeaders
      : [{ key: "X-Frame-Options", value: "SAMEORIGIN" }, ...commonHeaders]

    return [
      {
        source: "/(.*)",
        headers,
      },
    ]
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/admin",
        permanent: true,
      },
    ]
  },
  
  // Compress responses
  compress: true,
  
  // Enable SWC minification
  swcMinify: true,
}

export default nextConfig
