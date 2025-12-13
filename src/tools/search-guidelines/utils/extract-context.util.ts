/**
 * Extract context lines around a match for better readability
 */
export function extractContext(
  lines: string[],
  matchIndex: number,
  contextSize: number = 2,
): string {
  const start = Math.max(0, matchIndex - contextSize);
  const end = Math.min(lines.length, matchIndex + contextSize + 1);

  return lines
    .slice(start, end)
    .map((line, idx) => {
      const lineNum = start + idx + 1;
      const marker = start + idx === matchIndex ? '→' : ' ';
      return `${marker} ${lineNum}: ${line}`;
    })
    .join('\n');
}
