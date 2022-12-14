/**
 *
 * Asynchronously loads the component for Administration
 *
 */

import { lazyLoad } from 'utils/loadable';

export const ProcessorConfig = lazyLoad(
  () => import('./index'),
  module => module.ProcessorConfig,
);
