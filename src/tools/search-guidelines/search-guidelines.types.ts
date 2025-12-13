import type { Guideline } from '@/types';

export type SearchGuidelinesArgs = {
  query: string;
};

export type SearchMatch = {
  index: number;
  line: string;
};

export type SearchResult = {
  guideline: Guideline;
  matches: SearchMatch[];
};
