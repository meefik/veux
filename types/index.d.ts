/**
 * Create a state.
 *
 * @param data Initial state data.
 * @param options State options.
 */
export function signal(data: object, context?: object): {
  [key: string]: any
};
/**
 * Create an element.
 *
 * @param config Element configuration.
 * @param options Element options.
 */
export function render(config: object): Element;
/**
 * Mount an element to the DOM with moutation observer.
 * 
 * @param el Source element.
 * @param target Target element.
 */
export function mount(el: Element, target: Element): void;
/**
 * Create a localization.
 * 
 * @param locales Localized translations.
 * @param options Localization options.
 */
export function l10n(locales: object, options?: {
  language?: string,
  fallback?: string,
}): (path: string, data?: object | string, lang?: string) => string;
/**
 * Create an RPC client.
 * 
 * @param options RPC connection options.
 */
export function rpc(url: string, options?: {
  method?: object,
  headers?: object,
}): {
  [fn: string]: (params: any) => any
};
