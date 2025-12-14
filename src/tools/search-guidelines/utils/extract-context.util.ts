type ExtractContextArgs = {
  contextSize?: number;
  lines: string[];
  matchIndex: number;
};

/**
 * Extract context lines around a match for better readability
 */
export const extractContext = ({
  contextSize = 2,
  lines,
  matchIndex,
}: ExtractContextArgs): string => {
  const start = Math.max(0, matchIndex - contextSize);
  const end = Math.min(lines.length, matchIndex + contextSize + 1);

  return lines
    .slice(start, end)
    .map((line, index) => {
      const lineNumber = start + index + 1;
      const marker = start + index === matchIndex ? '→' : ' ';
      return `${marker} ${lineNumber.toString()}: ${line}`;
    })
    .join('\n');
};
