/** Join a path to Vite `base` (e.g. `/khmer-typing-master/`). */
export function publicAsset(path: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  const cleaned = path.replace(/^\//, "");
  return `${base}${cleaned}`;
}
