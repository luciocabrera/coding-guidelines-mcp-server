export type ValidationRule = {
  patterns: RegExp[];
  antiPatterns: RegExp[];
  advice: string;
};

export type ValidationCategory = 'component' | 'styling' | 'types' | 'testing' | 'file-structure';

export type ValidateCodePatternArgs = {
  code: string;
  category: ValidationCategory;
};
