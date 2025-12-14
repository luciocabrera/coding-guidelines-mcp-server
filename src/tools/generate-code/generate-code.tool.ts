import type { GenerateCodeArgs } from './generate-code.types.js';

import { buildBootstrapPlan, buildComponentScaffold, buildFeatureScaffold } from './utils';

export const generateCode = (arguments_: GenerateCodeArgs) => {
  const { name, requirements, shouldIncludeRef, shouldIncludeTests, task } = arguments_;

  switch (task) {
    case 'bootstrap': {
      return buildBootstrapPlan(requirements);
    }
    case 'component': {
      return buildComponentScaffold({ name, requirements, shouldIncludeRef, shouldIncludeTests });
    }
    case 'feature': {
      return buildFeatureScaffold({ name, requirements });
    }
    case 'hook': {
      return buildFeatureScaffold({ name: `${name}Hook`, requirements });
    }
    default: {
      return { content: [{ text: 'Unknown task', type: 'text' }] };
    }
  }
};
