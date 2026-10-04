/**
 * Stand-in for modules jest cannot load.
 *
 * Two kinds of module land here:
 *   - `@ws-widget/*` and `@ws/author`, which source files still import but which
 *     are not part of this repository and are not installed.
 *   - `ckeditor5`, which ships as native ESM that jest's CJS runtime cannot require.
 *
 * Any named import resolves to a distinct, stable class, so specs can reference or
 * construct them without exercising real behaviour. Nothing here is a substitute for
 * testing those libraries - it only stops unrelated specs dying at import time.
 */
const cache = {}

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => {
      // Symbols and `then` must stay undefined: returning a value for `then` would
      // make this object look thenable and hang anything that awaits it.
      if (typeof prop === 'symbol' || prop === 'then') {
        return undefined
      }
      if (prop === '__esModule') {
        return true
      }
      if (!(prop in cache)) {
        cache[prop] = class Stub {}
        Object.defineProperty(cache[prop], 'name', { value: String(prop) })
      }
      return cache[prop]
    },
  },
)
