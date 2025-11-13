// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "spinslow": "spin 20s linear infinite"
      },
    }
  },
  plugins: [],
}

