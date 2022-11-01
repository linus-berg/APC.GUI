/**
 *
 * Asynchronously loads the component for ValidateAllButton
 *
 */

import { lazyLoad } from 'utils/loadable';

export const ValidateAllButton = lazyLoad(
  () => import('./index'),
  module => module.ValidateAllButton,
);
