/**
 * Search Utilities
 * Functions for searching within guideline documents
 */

import { readFile } from "fs/promises";
import { join } from "path";
import type { Guideline, SearchMatch, SearchResult } from "../types.js";

/**
 * Search for a query in a guideline file
 */
export async function searchInGuideline(
  guidelinesPath: string,
  guideline: Guideline,
  query: string
): Promise<SearchResult | null> {
  try {
    const content = await readFile(join(guidelinesPath, guideline.file), "utf-8");
    const lines = content.split("\n");
    const matches: SearchMatch[] = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.toLowerCase().includes(query.toLowerCase()));

    if (matches.length > 0) {
      return { guideline, matches };
    }
    return null;
  } catch {
    // Silently skip files that can't be read
    return null;
  }
}

/**
 * Format search results for display
 */
export function formatSearchResults(
  results: SearchResult[],
  maxMatchesPerFile: number = 5
): string {
  if (results.length === 0) {
    return "No results found";
  }

  const formatted: string[] = [];

  for (const { guideline, matches } of results) {
    formatted.push(`\n**${guideline.name}** (${guideline.file}):`);

    const displayMatches = matches.slice(0, maxMatchesPerFile);
    displayMatches.forEach(({ line, index }) => {
      formatted.push(`Line ${index + 1}: ${line.trim()}`);
    });

    if (matches.length > maxMatchesPerFile) {
      formatted.push(`... and ${matches.length - maxMatchesPerFile} more matches`);
    }
  }

  return `Found results in ${results.length} documents:\n${formatted.join("\n")}`;
}

/**
 * Extract context lines around a match for better readability
 */
export function extractContext(
  lines: string[],
  matchIndex: number,
  contextSize: number = 2
): string {
  const start = Math.max(0, matchIndex - contextSize);
  const end = Math.min(lines.length, matchIndex + contextSize + 1);

  return lines
    .slice(start, end)
    .map((line, idx) => {
      const lineNum = start + idx + 1;
      const marker = start + idx === matchIndex ? "→" : " ";
      return `${marker} ${lineNum}: ${line}`;
    })
    .join("\n");
}
