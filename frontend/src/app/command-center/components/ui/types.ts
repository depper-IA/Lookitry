// Shared UI types (stub for constants.ts dependency)
export interface ColorValue {
  h: number; // hue 0-360
  s: number; // saturation 0-100
  b: number; // brightness -100 to 100
  c: number; // contrast -100 to 100
  colorize?: boolean;
}
