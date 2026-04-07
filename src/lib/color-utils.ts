export function hexToRgb(
  hexColor: string,
  fallbackColor: string,
): [number, number, number] {
  const rgbColor = hexColor.match(
    /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
  );

  if (rgbColor) {
    const [, r, g, b] = rgbColor;
    return [r, g, b].map((channel = "00") => parseInt(channel, 16) / 255) as [
      number,
      number,
      number,
    ];
  }

  console.error(
    `Invalid hex color '${hexColor}'. Falling back to '${fallbackColor}'.`,
  );

  if (hexColor === fallbackColor) {
    return [0, 0, 0];
  }

  return hexToRgb(fallbackColor, fallbackColor);
}
