export type ValidationRule = {
  advice: string;
  antiPatterns: RegExp[];
  patterns: RegExp[];
};

export type ValidationCategory = 'component' | 'styling' | 'types' | 'testing' | 'file-structure';

export type ValidateCodePatternArgs = {
  category: ValidationCategory;
  code: string;
};
