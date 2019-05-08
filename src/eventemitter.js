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




