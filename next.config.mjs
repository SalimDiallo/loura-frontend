import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Migration: "images.domains" is deprecated. Use "images.remotePatterns" as recommended.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.louratech.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ]
  },
}

// Enrobage Sentry : activé uniquement si un DSN est défini (sinon on
// renvoie la config nue pour ne pas faire planter le build en dev sans token).
const sentryEnabled = !!(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
)

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Upload des sourcemaps : nécessite SENTRY_AUTH_TOKEN + ORG + PROJECT
      // (sinon withSentryConfig ignore l'upload sans casser le build).
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      // Cache l'URL d'ingest derrière une route Next pour contourner les
      // ad-blockers côté client.
      tunnelRoute: "/api/sentry-tunnel",
      disableLogger: true,
    })
  : nextConfig
