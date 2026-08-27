// Global computed data.
//
// Eleventy reads the whole module namespace of a data file, so everything
// exported here lands in the data cascade — keep it to the computed values
// themselves and import any helpers.
import { editLink } from '../../lib/pages-cms.js';

// The footer's "Edit this page" link. The Pages CMS editor URL names one
// specific file, so it can only be built per page.
export default {
  editLink: (data) => editLink(data.page?.inputPath),
};
