import { deepPatch, deepClone, deepDiff } from './state';
import { isObject, isNumber } from './utils';

/**
 * Create a synchronization function.
 *
 * @param {Proxy} state
 * @param {function} handler
 * @param {object} [options]
 * @param {object} [options.slippage]
 * @returns {function}
 */
export function createSync (state, handler, options) {
  const { slippage } = options || {};
  let data;
  const syncer = async (...args) => {
    const oldv = data;
    const newv = deepClone(state);
    const diff = deepDiff(newv, oldv);
    data = await handler(newv, oldv, diff, ...args);
    if (isObject(data)) {
      deepPatch(state, data);
    }
    return data;
  };
  let timer;
  if (isNumber(slippage)) {
    return async function (...args) {
      return new Promise(resolve => {
        clearTimeout(timer);
        timer = setTimeout(
          async () => resolve(await syncer(...args)),
          timer ? slippage : 0
        );
      });
    };
  } else {
    return syncer;
  }
}
