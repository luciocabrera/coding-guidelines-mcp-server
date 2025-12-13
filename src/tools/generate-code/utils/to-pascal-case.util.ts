export function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^\d+/, '');
}
