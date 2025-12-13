import type { Guideline } from '@/types';

export type SearchGuidelinesArgs = {
  query: string;
};

export type SearchMatch = {
  line: string;
  index: number;
};

export type SearchResult = {
  guideline: Guideline;
  matches: SearchMatch[];
};
