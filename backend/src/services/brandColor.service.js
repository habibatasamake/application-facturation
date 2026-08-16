const fs = require("fs");
const path = require("path");
const { Vibrant } = require("node-vibrant/node");

const DEFAULT_ACCENT_COLOR = "#8CC63F";

const rgbToHex = (r, g, b) => {
  return (
    "#" +
    [r, g, b]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
};

const isValidColor = (rgb) => {
  if (!rgb || rgb.length !== 3) return false;

  const [r, g, b] = rgb;

  // éviter une couleur trop claire, presque blanche
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness < 220;
};

const getAccentColorFromLogo = async (logoUrl) => {
  try {
    if (!logoUrl) {
      return DEFAULT_ACCENT_COLOR;
    }

    const logoPath = path.join(
      __dirname,
      "../..",
      logoUrl.replace(/^\/+/, "")
    );

    if (!fs.existsSync(logoPath)) {
      return DEFAULT_ACCENT_COLOR;
    }

    const palette = await Vibrant.from(logoPath).getPalette();

    const candidates = [
      palette.Vibrant,
      palette.DarkVibrant,
      palette.Muted,
      palette.DarkMuted,
      palette.LightVibrant,
      palette.LightMuted,
    ];

    for (const swatch of candidates) {
      if (swatch) {
        const rgb = swatch.rgb.map(Math.round);

        if (isValidColor(rgb)) {
          return rgbToHex(rgb[0], rgb[1], rgb[2]);
        }
      }
    }

    return DEFAULT_ACCENT_COLOR;
  } catch (error) {
    console.error("Erreur extraction couleur logo :", error);
    return DEFAULT_ACCENT_COLOR;
  }
};

module.exports = {
  getAccentColorFromLogo,
  DEFAULT_ACCENT_COLOR,
};