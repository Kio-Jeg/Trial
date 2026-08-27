export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function isPdfPath(path: string) {
  return path.toLowerCase().endsWith(".pdf");
}
