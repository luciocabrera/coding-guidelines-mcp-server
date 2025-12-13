/**
 * Type definitions for the Coding Guidelines MCP Server
 */

export type Guideline = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  file: string;
};

export type ValidationRule = {
  patterns: RegExp[];
  antiPatterns: RegExp[];
  advice: string;
};

export type ValidationCategory = 'component' | 'styling' | 'types' | 'testing' | 'file-structure';

export type SearchGuidelinesArgs = {
  query: string;
};

export type ValidateCodePatternArgs = {
  code: string;
  category: ValidationCategory;
};

export type SearchMatch = {
  line: string;
  index: number;
};

export type SearchResult = {
  guideline: Guideline;
  matches: SearchMatch[];
};
