import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Drop the `X-Powered-By: Next.js` response header.
  poweredByHeader: false,

  compiler: {
    // Strip `console.*` from production bundles, keeping error/warn for
    // monitoring. Left on in dev so logs stay available.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  images: {
    // Modern formats — smaller than JPEG/PNG; the browser picks what it supports.
    formats: ["image/avif", "image/webp"],
    // Product photos live in Supabase Storage when that backing is configured;
    // `next/image` refuses remote hosts that are not listed here.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    /*
      Every distinct (image, width, quality) is a billed transformation, and the
      shop hit the free tier's 5 000 with photos still to add — past the limit
      new ones **error**, so a piece added tomorrow would show broken images.

      These lists were the generic starter defaults: sixteen possible widths per
      photo. What the layout actually asks for is much narrower — the `sizes`
      attributes in use are 4rem thumbnails, 50vw/12–20rem cards, a 32rem
      gallery and one 82rem hero. Nine widths cover all of that with retina to
      spare, and cut the ceiling per photo by roughly half.

      Trim further only by checking the `sizes` props first: a width a layout
      asks for and cannot find is served by the next one **up**, which wastes
      bytes on the customer's data plan rather than saving anything.
    */
    deviceSizes: [640, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 384],

    /*
      How long an optimised image is kept before it is transformed again.

      The default is measured in seconds, which for a catalogue means paying for
      the same photo over and over. Nothing here changes under a stable name:
      uploads land in Supabase under a generated unique name, and the seeded
      photos are static files. Thirty days is the balance — if a photo is ever
      replaced *at the same path*, that is how long the old one can linger.
    */
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // React Compiler (automatic memoisation) is an opt-in performance win.
  // It requires the `babel-plugin-react-compiler` dev dependency and routes
  // the build through Babel — enable once installed:
  // reactCompiler: true,
};

export default nextConfig;
