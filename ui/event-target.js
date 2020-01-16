/* 
  EventTarget Polyfill
  See also: 
  https://developer.mozilla.org/en-US/docs/Web/API/EventTarget#Example
*/

// Feature detection
try {
    // Try to create a new instance
    const eventTarget = new EventTarget()
} catch (e) {
    // Error occurred, thus we have to use the polyfill:
    window.EventTarget = class {

        constructor() {
            // a DOM element           
            this._$el = document.createElement('a');
        }

        addEventListener(type, handler) {
            // bind handler to our DOM element
            return this._$el.addEventListener(type, handler);
        }

        removeEventListener(type, handler) {
            // bind handler to our DOM element
            return this._$el.removeEventListener(type, handler);
        }

        dispatchEvent(event) {
            // dispatch event on our DOM element
            this._$el.dispatchEvent(event);
        }
    }
}