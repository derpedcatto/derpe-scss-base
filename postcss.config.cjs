// Transpiles modern CSS (notably light-dark()) down to whatever the
// browserslist target in package.json requires, and autoprefixes.
// In a Vite project, drop this file in the root - Vite picks it up
// automatically
module.exports = {
  plugins: [require("postcss-preset-env")()],
};
