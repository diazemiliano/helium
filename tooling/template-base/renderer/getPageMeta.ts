import { PageContext } from './../types';
import { documentProps } from '../pages/index/index.page';

export { getPageMeta };

function getPageMeta(pageContext: PageContext) {
  const title = fetchProperty(pageContext, 'title');
  const description = fetchProperty(pageContext, 'description');
  return { title, description };
}

function hasKey<O>(obj: O, key: PropertyKey): key is keyof O {
  return key in obj;
}

function fetchProperty(pageContext: PageContext, property: string) {
  /**
   * pageContext.pageExports.documentProps for static titles (defined in the `export { documentProps }` of the page's `.page.js`)
   * pageContext.documentProps for dynamic tiles (defined in the `export addContextProps()` of the page's `.page.server.js`)
   */
  let result;
  if (hasKey(pageContext.pageExports.documentProps || {}, property)) {
    result = (pageContext.pageExports.documentProps || {})[property];
  } else if (hasKey(pageContext.documentProps || {}, property)) {
    result = (pageContext.documentProps || {})[property];
  }
  return result;
}
