export const toPascalCase = (value: string): string => {
  // Split into parts and filter out empty strings
  const parts: string[] = value.split(/[^a-zA-Z0-9]+/).filter(Boolean);

  // Capitalize each part
  const capitalized: string = parts
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // Remove non-alphanumeric characters (using replace instead of replaceAll for compatibility)
  const cleaned: string = capitalized.replaceAll(/[^a-zA-Z0-9]/g, '');

  // Remove leading digits
  const result: string = cleaned.replace(/^\d+/, '');

  return result;
};
