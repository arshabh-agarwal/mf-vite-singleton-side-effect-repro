// Stand-in for a web-component library: registering a custom element is a
// top-level side effect, so evaluating two copies of this module throws.
export const version = '1.1.0';

(globalThis.__sharedElementsEvaluated ||= []).push(version);
console.log('[shared-elements] evaluated', version);

class SharedEl extends HTMLElement {
  connectedCallback() {
    this.textContent = 'shared-el from shared-elements ' + version;
  }
}
customElements.define('shared-el', SharedEl);
