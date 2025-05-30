// tailwind.config.js
module.exports = {
  experimental: {
    optimizeUniversalDefaults: false,  // disable new universal defaults that emit oklch colors
  },
  theme: {
    extend: {
      colors: {
        // Override any custom colors here with hex or rgb
      },
    },
  },
};
