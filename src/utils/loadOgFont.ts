import fs from "fs";
import path from "path";

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type FontStyle = "normal" | "italic";

export interface OgFontOption {
  name: string;
  data: ArrayBuffer;
  weight: Weight;
  style: FontStyle;
}

export async function loadOgFont(): Promise<OgFontOption[]> {
  // Ensure it searches from the root of the project
  const fontPath = path.resolve("./src/assets/fonts/wotfard.ttf");
  const fontData = fs.readFileSync(fontPath);

  // We map different weights to the same TTF file so that satori
  // can render correctly regardless of the fontWeight
  // used in the templates.
  return [
    { name: "Wotfard", data: fontData.buffer, weight: 400, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 600, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 700, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 900, style: "normal" },
  ];
}

export default loadOgFont;
