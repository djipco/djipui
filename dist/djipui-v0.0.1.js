import EventEmitter from "./eventemitter.js"

/**
 * DjipUI Module
 * @module djipui
 */

/**
 * CSS class name identifying all DOM elements in this library.
 * @type {string}
 * @private
 */
const DEFAULT_CLASS = "djipui";

/**
 * The `Item` class is the basic abstract class from which all visual user interface elements
 * derive (panels, tiles, buttons, etc.). It usually isn't instantiated directly but it can be.
 *
 * @extends EventEmitter
 * @abstract
 */
export class Item extends EventEmitter {

  /**
   * Creates an `Item` object.
   *
   * @param {Object} [options={}] Initialization options
   * @param {string} [options.id] The 'id' to use for the generated DOM element
   * @param {Container} [options.parent] The parent `Container` object.
   */
  constructor(options = {}) {

    super();

    this._domElement = null;
    this._parent = null;

    // Listeners registered on other objects (for removal purposes)
    this._callbacks = {};

    // Render the DOM element and add ID if specified (must be done before setting the parent)
    if (options.id) this.id = options.id;

    // Add to parent (if parent has been specified)
    if (options.parent) this.parent = options.parent;

    // Inject styles
    this.injectStylesInHead(`styles-${DEFAULT_CLASS}-${this.type.toLowerCase()}`, this.css);

  }

  /**
   * The DOM element used by this object
   * @type {ChildNode}
   * @readonly
   */
  get domElement() {

    if (!this._domElement) {
      this._domElement = new DOMParser().parseFromString(
        this.template, "text/html"
      ).body.firstChild;
    }

    return this._domElement;

  }

  /**
   *
   * @returns {Element}
   */
  get content() {
    return this.domElement.querySelector("div.content");
  }

  /**
   * A string that's used as a template to build the DOM element
   * @type {string}
   * @readonly
   */
  get template() {
    return `<div class="${DEFAULT_CLASS} item"></div>`;
  }

  /**
   * A string of valid CSS to apply to this element
   * @type {string}
   * @readonly
   */
  get css() {
    return ``;
  }

  /**
   * The parent container object
   * @type {Container}
   */
  get parent() {
    return this._parent;
  }

  set parent(parent) {

    // Remove from old parent (if any)
    if (this.parent && this.parent.content) {
      this.parent.content.removeChild(this.domElement);
      this._parent = null;
    }

    // Add to new parent (if parameter is an actual parent)
    if (parent && parent.content && typeof parent.content.appendChild === "function") {
      parent.content.appendChild(this.domElement);
      this._parent = parent;
    }

  }

  /**
   * The type of object (`Panel`, `Tile`, `Button`, etc.)
   * @type {string}
   * @readonly
   */
  get type() {
    return this.constructor.name;
  }

  /**
   * The id of the DOM element used to render that interface element
   * @type {string}
   */
  get id() {
    return this.domElement.id;
  }

  set id(id) {
    this.domElement.setAttribute("id", id.toString());
  }

  /**
   * Transforms the specified CSS string into a valid <style> tag and injects it in the head of the
   * document. If a style is already present with the same id, it will be overwritten.
   *
   * @param {string} id The 'id' for the generated <style> tag
   * @param {string} [cssString=""] A string of valid CSS rules
   */
  injectStylesInHead(id, cssString = "") {

    if (id.length < 1) throw new TypeError("The 'id' parameter must be a string.");

    // Check if it's already there and remove it if it is
    let styleElement = document.getElementById(id);
    if (styleElement) document.head.removeChild(styleElement);

    // Inject it
    if (cssString.length > 0) {
      styleElement = document.createElement("style");
      styleElement.type = "text/css";
      styleElement.setAttribute("id", id);
      styleElement.appendChild(document.createTextNode(cssString));
      document.head.appendChild(styleElement);
    }

  }

  destroy() {

    console.log(this);

    if (this.parent) {
      this.parent.content.removeChild(this.domElement);
    }

    this.removeAllListeners();

  }

}

/**
 * The `Container` class creates invisible containers that can be used to group items together.
 * @extends Item
 */
export class Container extends Item {

  constructor(options = {}) {

    super(options);

    // Containers can have children. Add specified children (if any)
    this.children = [];
    (options.children || []).forEach(item => this.addChild(item.type, item.options));

  }

  get template() {
    return `
      <div class="${DEFAULT_CLASS} item container">
        <div class="content"></div>
      </div>
    `;
  }

  get css() {

    return `
      .djipui.container > .content:empty {
        display: none;
      }
    
    `;

  }

  addChild(type, options = {}) {
    console.log("addChild", type, options);

    options.parent = this;
    console.log("children avant", type, this.children);
    let child = new CLASSES[type](options);
    this.children.push(child);



    console.log("children après", type, this.children);
    return child;
  }

  getChildById(id) {
    return this.children.filter(child => child.id === id)[0] || false;
  }

  /**
   * Tries to recursively find and return the first descendant (`Item` or `Container`) with a
   * matching ID. If none is found, it returns `false`.
   *
   * @param {string} id
   * @returns {Item|Container|boolean}
   */
  getDescendantById(id) {

    if (this.id === id) return this;

    for (let i = 0; i < this.children.length; i += 1) {

      if (typeof this.children[i].getDescendantById !== "function") {
        if (this.children[i].id === id) return this.children[i];
        continue;
      }

      let result = this.children[i].getDescendantById(id);
      if (result) return result;

    }

    return false;

  }

  destroy() {
    super.destroy();
    this.children.forEach(child => {
      console.log("allo", child);
      child.destroy()
    });
  }

  // removeChild(child) {
  //   this.children.splice(this.children.indexOf(child), 1);
  //   child.parent = undefined;
  // }

  // removeChildren() {
  //
  //   this.children.forEach(child => {
  //     this.removeChild(child)
  //   });
  //
  // }

}

/**
 * The `Tile` class creates a tile container that can be used to group items together.
 * @extends Container
 */
export class Tile extends Container {

  constructor(options = {}) {
    super(options);
    if (options.label) this.label = options.label;
  }

  /**
   * A string that's used as a template to build the DOM element. This returns the default template
   * before any options are injected.
   *
   * @type {string}
   * @readonly
   */
  get template() {

    return `
      <div class="${DEFAULT_CLASS} item container tile">
        <h1 class="label"></h1>
        <div class="content"></div>
      </div>
    `;

  }

  get css() {

    return `
      
      .djipui.tile {
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5em;
        width: calc(1/4*100% - (1 - 1/4)*0.5em);
      }
      
      .djipui.tile:last-child {
        margin-right: 0;
      }
      
      .djipui.tile > h1 {
        font-size: 1em;
        font-weight: bold;
        margin: 0;
        background-color: rgba(0, 0, 0, .2);
        padding: 0.25em 0.3em;
        text-transform: uppercase;
        min-width: 100px;
        text-align: center;
      }
      
      .djipui.tile > .content {
    
        display: flex;
        flex-wrap: wrap;
        border-bottom: 1px solid rgba(0, 0, 0, .2);
        border-right: 1px solid rgba(0, 0, 0, .2);
        border-left: 1px solid rgba(0, 0, 0, .2);
        
        padding: 0.5em;
    
      }
      
      .djipui.tile > .content:empty {
        padding: 0;
        border: none;
      }

    `;

  }

  get label() {
    return this.domElement.querySelector("h1").innerHTML;
  }

  set label(value) {
    this.domElement.querySelector("h1").innerHTML = value.toString();
  }

}

/**
 * The `UI` class
 * @extends Container
 */
export class UI extends Container {

  /**
   * Creates a new `UI` object. The `UI` object is the top-level of the hierarchy. It will be
   * appended to the body unless a `parentNode` option is specified. You can have many `UI` objects
   * in the same page.
   *
   * @param {Object} [options] - Options to pass to the constructor
   * @param {HTMLElement} [options.parentNode] - The DOM node to which the DOM element for this `UI`
   * object should be appended.
   * @param {string} [options.id] - The desired id to be used in the DOM for this element
   * @param {Array} [options.children] - The children that should also be inserted. See the various
   * children (Panel, Screen, Value, Button, etc.) for more details on the syntax.
   */
  constructor(options = {}) {

    super(options);

    // Add the domElement to the specified parentNode or the the <body> if none is specified. The UI
    // object does not have a parent because it is top-level
    if (options.parentNode && options.parentNode.appendChild) {
      options.parentNode.appendChild(this.domElement);
    } else {
      document.body.appendChild(this.domElement);
    }

  }

  get template() {
    return `
      <div class="${DEFAULT_CLASS} item container ui">
        <div class="content"></div>
      </div>
    `;
  }

  get css() {

    return `
    
      .${DEFAULT_CLASS} {
        box-sizing: border-box;
        font-size: 12px;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: rgba(255, 255, 255, 0.9)
      }

    `;

  }

  set parent(parent) {
    throw new ReferenceError("The 'parent' property cannot be used on top-level objects.");
  }

  destroy() {
    super.destroy();
    this.domElement.parentNode.removeChild(this.domElement);
  }

}

/**
 * The `Value` class...
 * @extends Item
 */
export class Value extends Item {

  constructor(options = {}) {

    super(options);

    if (options.label) this.label = options.label;
    if (options.value) this.value = options.value;

  }

  get template() {

    return `
      <div class="${DEFAULT_CLASS} item value">
        <h1 class="label">Label</h1>
        <div class="content"></div>
      </div>
    `;

  }

  get label() {
    return this.domElement.querySelector("h1").innerHTML;
  }

  set label(value) {
    this.domElement.querySelector("h1").innerHTML = value;
  }

  get value() {
    return this.domElement.querySelector("div.content").innerHTML;
  }

  set value(value) {
    this.domElement.querySelector("div.content").innerHTML = value.toString();
  }

  get css() {

    return `
    
      .${DEFAULT_CLASS}.value {
        margin-bottom: 0.5em;
        display: flex;
        justify-content: space-between;
        flex-grow: 1;
        width: 100%;
      }
      
      .${DEFAULT_CLASS}.value:first-child {
        padding-top: 0;
      }
      
      .${DEFAULT_CLASS}.value:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }
      
      .${DEFAULT_CLASS}.value > h1 {
        font-size: 1em;
        font-weight: normal;
        padding: 0.3em 0.5em 0.2em 0;
        margin: 0;
        width: 30%;
      }
      
      .${DEFAULT_CLASS}.value > .content {
        width: 70%;
        background-color: rgba(0, 0, 0, .2);
        padding: 0.3em 0.2em 0.2em 0.4em;
        border-radius: 0.25em;
      }
      
    `;

  }

}

/**
 * The `Button` class represents a single interactive button.
 * @class
 * @extends Item
 */
export class Button extends Item {

  constructor(options = {}) {

    super(options);

    if (options.label) this.label = options.label;

    // Register listener on DOM object and store it for later removal
    this._callbacks.click = e => this.emit("click", e);
    this.domElement.querySelector(".content > button").addEventListener(
      "click", this._callbacks.click
    );

  }

  get template() {

    return `
      <div class="${DEFAULT_CLASS} item button">
        <div class="content">
          <button>Button</button>
        </div>
      </div>
    `;

  }

  get css() {

    return `
    
      .${DEFAULT_CLASS}.button {
        width: 100%;
        margin-bottom: 0.5em;
      }
      
      .${DEFAULT_CLASS}.button:last-child {
        margin-bottom: 0;
      }
      
      .${DEFAULT_CLASS}.button .content {
        width: 100%;
        display: flex;
      }
    
      .${DEFAULT_CLASS}.button .content > button {
        padding: 4px 2px;
        background-color: rgba(0, 0, 0, .2);
        border: 1px solid rgba(255, 226, 12, .5);
        border-radius: 4px;
        flex-grow: 1;
        color: rgba(255, 255, 255, 0.9);
        outline: none;
      }
      
      .${DEFAULT_CLASS}.button .content > button:hover {
        background-color: rgba(0, 0, 0, .3);
      }
  
      .${DEFAULT_CLASS}.button .content > button:active {
        background-color: rgba(0, 0, 0, .2);
      }
    
    `;


  }

  get label() {
    return this.domElement.querySelector(".content > button").innerHTML;
  }

  set label(value) {
    this.domElement.querySelector(".content > button").innerHTML = value.toString();
  }

  destroy() {

    // Remove the DOM listener
    this.domElement.querySelector(".content > button").removeEventListener(
      "click", this._callbacks.click
    );

    // Remove any external listeners that may have been added to the button
    this.removeAllListeners();

  }

}

/**
 * The `Panel` class creates a panel container that can be used to group items together.
 * @extends Container
 */
export class Panel extends Container {

  /**
   *
   *
   * @param {Object} options Options to configure the `Panel` object
   * @param {string} options.parentNode
   * @param {string} [options.id]
   * @param {Array} [options.children]
   * @param {Boolean} [options.draggable=false]
   */
  constructor(options = {}) {

    super(options);

    // Parse options
    this.draggable = options.draggable === true || false;
    if (options.label) this.label = options.label;

    // this.collapsible = options.collapsible === true || false;
    // this.collapsed = options.collapsed === true || false;

    // Make draggable and/or callapsible if necessary
    // if (this.draggable) this._makeDraggable(this.title, this.domElement);
    // if (this.collapsible) this._makeCollapsible(this.title);

  }

  /**
   * A string that's used as a template to build the DOM element. This returns the default template
   * before any options are injected.
   *
   * @type {string}
   * @readonly
   */
  get template() {

    return `
      <div draggable="false" class="${DEFAULT_CLASS} item container panel">
        <h1 class="label">Panel</h1>
        <div class="content"></div>
      </div>
    `;

  }

  get css() {

    return `
    
      .djipui.panel {
        background-color: rgba(0, 0, 0, 0.5);
        overflow: scroll;
        border-radius: 0.25em;
        margin-bottom: 0.5em;
      }

      .djipui.panel:last-child {
        margin-bottom: 0;
      }

      .djipui.panel > h1 {
        font-size: 1em;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 5px 6px 5px 6px;
        margin: 0;
        text-transform: uppercase;
        font-weight: bold;
      }
            
      .djipui.panel[draggable=true] > h1 {
        cursor: move;
      }
      
      .djipui.panel > .content {
        display: flex;
        padding: 5px 6px 5px 6px;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      
      .djipui.panel > .content:empty {
        padding: 0;
      }
      

      
  `;

  }

  get label() {
    return this.domElement.querySelector("h1").innerHTML;
  }

  set label(value) {
    this.domElement.querySelector("h1").innerHTML = value.toString();
  }

  get draggable() {
    return this.domElement.getAttribute("draggable");
  }

  set draggable(value) {
    this.domElement.setAttribute("draggable", value === true);
  }

  _makeDraggable(trigger, container) {

    // Fetch the highest zIndex so the dragged panel is always on top
    let elements = document.getElementsByTagName("*");
    let index = 0;

    for (let i = 0; i < elements.length - 1; i++) {
      if (parseInt(elements[i].style.zIndex) > index) {
        index = parseInt(elements[i].style.zIndex);
      }
    }

    trigger.addEventListener("mousedown", e => {

      e.preventDefault();

      let initX = this.container.offsetLeft;
      let initY = this.container.offsetTop;
      let mousePressX = e.clientX;
      let mousePressY = e.clientY;

      // Modify zIndex so that panel is on top THIS IS BUGGY AFTER A FEW TRIES!!!!
      // container.style.zIndex = (++index).toString();

      let reposition = e => {
        container.style.left = initX + e.clientX - mousePressX + "px";
        container.style.top = initY + e.clientY - mousePressY + "px";
      };

      addEventListener("mousemove", reposition);
      addEventListener("mouseup", () => removeEventListener("mousemove", reposition) );

    });


  }

  _makeCollapsible(trigger) {

    if (this.collapsible) {
      trigger.addEventListener("dblclick", () => this.toggleCollapse() );
    }

  }

  toggleCollapse() {

    if (!this.collapsible) return;

    let content = this.domElement.querySelector(".content");

    if (content.style.display === "none") {
      content.style.display = "block";
    } else {
      content.style.height = "";
      content.style.display = "none";
    }

  }

}

// Enum of available classes so they can be instantiated dynamically
const CLASSES = {
  Button,
  Container,
  Item,
  Panel,
  Tile,
  UI,
  Value
};

// This file was transformed to fit the needs of this project. Not originally written by me (heavily
// based on eventemitter3).

/**
 * EventEmitter Module
 * @module eventemitter
 */

/**
 * The `Listener` class represents a single event listener object. Such objects store the callback
 * (listener) function, the context to execute the function in (often `this`) and whether or not
 * the callback should only be executed once.
 *
 * @private
 */
class Listener {

  /**
   * Creates a `Listener` object
   *
   * @param {Function} callback The listener function
   * @param {*} context The context to invoke the listener in
   * @param {Boolean} [once=false] Whether the callback function should be executed only once
   */
  constructor(callback, context, once = false)  {
    this.fn = callback;
    this.context = context;
    this.once = once === true || false;
  }

}

/**
 * The `EventEmitter` class provides methods to implement the observable design pattern on extending
 * or mixing in classes (`addListener()`, `removeListener()`, `emit()`, etc.).
 * @public
 * @mixin
 */
export default class EventEmitter {

  /**
   * Creates an `EventEmitter` instance
   */
  constructor() {
    this._events = {};
    this._eventsCount = 0;
  }

  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} context The context to invoke the listener in.
   * @param {Boolean} once Specify if the listener is a one-time listener.
   * @returns {EventEmitter}
   * @private
   */
  addListener(event, fn, context, once = false) {

    if (typeof fn !== 'function') throw new TypeError('The listener must be a function');

    let listener = new Listener(fn, context || this, once);

    if (!this._events[event]) {
      this._events[event] = listener;
      this._eventsCount++;
    } else if (!this._events[event].fn) {
      this._events[event].push(listener);
    } else {
      this._events[event] = [this._events[event], listener];
    }

    return this;
  }

  /**
   * Clear event by name.
   *
   * @param {(String|Symbol)} event The Event name
   * @private
   */
  clearEvent(event) {

    if (--this._eventsCount === 0) {
      this._events = {};
    } else {
      delete this._events[event];
    }

  }

  /**
   * Array of all the unique events for which the emitter has registered listeners.
   * @type {Array}
   * @readonly
   */
  get eventNames() {
    let names = []
      , events
      , name;

    if (this._eventsCount === 0) return names;

    for (name in (events = this._events)) {
      if (Object.prototype.hasOwnProperty.call(events, name)) {
        names.push(name);
      }
    }

    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }

    return names;
  };

  /**
   * Return the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Array} The registered listeners.
   */
  getListeners(event) {

    let ee = [];
    let handlers = this._events[event];

    if (!handlers) return [];
    if (handlers.fn) return [handlers.fn];

    for (let i = 0; i < handlers.length; i++) {
      ee[i] = handlers[i].fn;
    }

    return ee;

  };

  /**
   * Return the number of listeners listening to a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Number} The number of listeners.
   */
  getListenerCount(event) {

    // let evt = PREFIX ? PREFIX + event : event;
    let listeners = this._events[event];

    if (!listeners) return 0;
    if (listeners.fn) return 1;
    return listeners.length;

  };

  /**
   * Calls each of the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Boolean} `true` if the event had listeners, else `false`.
   */
  emit(event, a1, a2, a3, a4, a5) {

    // let evt = PREFIX ? PREFIX + event : event;

    if (!this._events[event]) return false;

    let listeners = this._events[event]
      , len = arguments.length
      , args
      , i;

    if (listeners.fn) {

      if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

      switch (len) {
        case 1: return listeners.fn.call(listeners.context), true;
        case 2: return listeners.fn.call(listeners.context, a1), true;
        case 3: return listeners.fn.call(listeners.context, a1, a2), true;
        case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }

      for (i = 1, args = new Array(len -1); i < len; i++) {
        args[i - 1] = arguments[i];
      }

      listeners.fn.apply(listeners.context, args);

    } else {

      let length = listeners.length
        , j;

      for (i = 0; i < length; i++) {
        if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

        switch (len) {
          case 1: listeners[i].fn.call(listeners[i].context); break;
          case 2: listeners[i].fn.call(listeners[i].context, a1); break;
          case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
          case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
          default:
            if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
              args[j - 1] = arguments[j];
            }

            listeners[i].fn.apply(listeners[i].context, args);
        }
      }

    }

    return true;

  };

  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} callback The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   *
   * @returns {EventEmitter} `this`
   */
  on(event, callback, context) {
    return this.addListener(event, callback, context, false);
  };

  /**
   * Add a one-time listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} callback The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   *
   * @returns {EventEmitter} `this`
   */
  once(event, callback, context) {
    return this.addListener(event, callback, context, true);
  };

  /**
   * Remove the listeners of a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn Only remove the listeners that match this function.
   * @param {*} context Only remove the listeners that have this context.
   * @param {Boolean} once Only remove one-time listeners.
   *
   * @returns {EventEmitter} `this`
   */
  removeListener(event, fn, context, once) {

    let events = [];

    if (!this._events[event]) return this;
    if (!fn) {
      this.clearEvent(event);
      return this;
    }

    let listeners = this._events[event];

    if (listeners.fn) {
      if (
        listeners.fn === fn &&
        (!once || listeners.once) &&
        (!context || listeners.context === context)
      ) {
        this.clearEvent(event);
      }
    } else {
      for (let i = 0, events = [], length = listeners.length; i < length; i++) {
        if (
          listeners[i].fn !== fn ||
          (once && !listeners[i].once) ||
          (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }

      // Reset the array, or remove it completely if we have no more listeners.
      if (events.length) this._events[event] = events.length === 1 ? events[0] : events;
      else this.clearEvent(event);
    }

    return this;

  }

  /**
   * Remove all listeners, or those for the specified event (if present).
   *
   * @param {(String|Symbol)} [event] The event name.
   *
   * @returns {EventEmitter} `this`
   */
  removeAllListeners(event) {

    if (event) {
      if (this._events[event]) this.clearEvent(event);
    } else {
      this._events = {};
      this._eventsCount = 0;
    }

    return this;

  }

}




