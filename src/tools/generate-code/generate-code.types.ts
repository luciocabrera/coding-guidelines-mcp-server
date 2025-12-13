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
