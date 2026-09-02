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

/**
 * The categories this server ships with. A guidelines manifest may add its own
 * or override these, so a validated category is a plain string at runtime —
 * this union names the built-in defaults and keeps them exhaustively checked.
 */
export type BuiltInValidationCategory =
  'component' | 'styling' | 'types' | 'testing' | 'file-structure';

/** Category name -> rule. Keys are open: the manifest may contribute more. */
export type ValidationRules = Record<string, ValidationRule>;

export type SearchGuidelinesArgs = {
  query: string;
};

export type ValidateCodePatternArgs = {
  code: string;
  category: string;
};

export type GenerationTask = 'component' | 'feature' | 'bootstrap' | 'hook';

export type GenerateCodeArgs = {
  task: GenerationTask;
  name: string;
  requirements?: string;
  includeTests?: boolean;
  includeRef?: boolean;
};

export type GeneratedFile = {
  path: string;
  content: string;
};

export type GenerateCodeResult = {
  text: string;
  files?: GeneratedFile[];
  commands?: string[];
};

export type SearchMatch = {
  line: string;
  index: number;
};

export type SearchResult = {
  guideline: Guideline;
  matches: SearchMatch[];
};
