export type GenerateCodeArgs = {
  name: string;
  requirements?: string;
  shouldIncludeRef?: boolean;
  shouldIncludeTests?: boolean;
  task: GenerationTask;
};

export type GenerateCodeResult = {
  commands?: string[];
  files?: GeneratedFile[];
  text: string;
};

export type GeneratedFile = {
  content: string;
  path: string;
};

export type GenerationTask = 'bootstrap' | 'component' | 'feature' | 'hook';
