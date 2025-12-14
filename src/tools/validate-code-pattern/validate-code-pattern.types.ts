export type ValidateCodePatternArgs = {
  category: ValidationCategory;
  code: string;
};

export type ValidationCategory = 'component' | 'file-structure' | 'styling' | 'testing' | 'types';

export type ValidationRule = {
  advice: string;
  antiPatterns: RegExp[];
  patterns: RegExp[];
};
