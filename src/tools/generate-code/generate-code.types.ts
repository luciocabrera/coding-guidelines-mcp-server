export type GenerationTask = 'component' | 'feature' | 'bootstrap' | 'hook';

export type GenerateCodeArgs = {
  includeRef?: boolean;
  includeTests?: boolean;
  name: string;
  requirements?: string;
  task: GenerationTask;
};

export type GeneratedFile = {
  content: string;
  path: string;
};

export type GenerateCodeResult = {
  commands?: string[];
  files?: GeneratedFile[];
  text: string;
};
