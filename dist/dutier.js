/**
  * @name dutier
  * @description A small (2kb) and simple state management solution for Javascript applications.
  * @author Luis Vinícius
  * @email luis@uilabs.me
  */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Dutier = global.Dutier || {})));
}(this, (function (exports) { 'use strict';

/**
 * The Providers
 */
var Provider = {
  // The reducers
  _reducers: new Map(),
  // The subscribe handlers
  _handlers: [],
  // the middlewares
  _middlewares: [],
  // The state manager
  _updateState: function _updateState() {}
};

/**
 * Creates a Dutier store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 * @param { Object } state The initial application state
 * @return {Function} currentState Return a function that
 * updates and returns the current state
 */
var create = (function (state) {
  return function (state) {
    return function (current) {
      state = Object.assign({}, state, current);
      return JSON.parse(JSON.stringify(state));
    };
  }(state);
});

/**
 * @name setReducer
 * @description Set the reducer function, the
 * initial state of the reducer and store state
 */
var setReducer = (function (reducers) {
  // if createStore don't was called yet
  if (Provider._updateState({}) === undefined) {
    Provider._updateState = create({});
  }
  reducers.forEach(function (reducer) {
    var initial = reducer(undefined, { type: '@@DUTIER.INITIAL_STATE' });
    Provider._reducers.set(reducer, { initial: initial });
    Provider._updateState(initial);
  });
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Async Reducer
 * Just dispatch if return new state values.
 * With this, the subscribe function will not be
 * called unnecessary, because the state don't be changed
 */
var asyncReducer = (function (action) {
  return new Promise(function (resolve) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Provider._reducers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var reducer = _step.value;

        var _reducer = _slicedToArray(reducer, 2),
            reducerFunction = _reducer[0],
            reducerProps = _reducer[1];

        var stateReducer = reducerProps.current ? reducerProps.current : reducerProps.initial;
        var current = reducerProps.current = reducerFunction(stateReducer, action);
        var reducerOldState = reducerFunction(stateReducer, { type: '@@Dutier.OLD_STATE', value: action.value }
        // pass old state just to middleware
        );var oldState = Object.assign({}, Provider._updateState({}), reducerOldState);
        if (JSON.stringify(current) !== JSON.stringify(stateReducer)) {
          return resolve({ action: action, oldState: oldState, state: Provider._updateState(current) });
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });
});

/**
 * Apply the subscribe handler functions
 */
var applyHandler = (function (_ref) {
  var type = _ref.type,
      state = _ref.state;

  Provider._handlers.forEach(function (handler) {
    if (handler !== undefined && typeof handler === 'function') {
      handler({ type: type, state: state });
    }
  });
  return { type: type, state: state };
});

var applyMiddleware = (function (data) {
  Provider._middlewares.forEach(function (middleware) {
    return middleware.call(null, data);
  });
  return Promise.resolve({ type: data.action.type, state: data.state });
});

/**
   * @name dispatch
   * @description Dispatch an action to change
   * the store state
   * @param { Object } payload The action payload
   */
var dispatch = (function (payload) {
  return new Promise(function (resolve) {
    return payload.call(null, resolve);
  }).then(asyncReducer).then(applyMiddleware).then(applyHandler);
});

/**
 * @name getState
 * @return {Object} a copy of the state
 */
var getState = (function () {
  return Provider._updateState({});
});

/**
 * @name unsubscribe
 * @description Unsubscribes from listening to a component
 * @param {Function} handler The handler function
 **/
var unsubscribe = (function (handler) {
  Provider._handlers.forEach(function (fn, index) {
    if (fn === handler) {
      Provider._handlers.splice(index, 1);
    }
  });
});

/**
 * Subscribe to receive notifications when state is updated.
 * @name subscribe
 * @description Subscribe to call the handler function when the action will be triggered
 * @param {Function} handler The function that will be called
 **/
var subscribe = (function (handler) {
  Provider._handlers.push(handler);
  return function () {
    unsubscribe(handler);
  };
});

/**
 * @name createStore
 * @description Sets the store state
 * @param {Object} data Simple Object that contain the State
 * @param {Function} reducers The action reducers
 */
var createStore = (function () {
  for (var _len = arguments.length, reducers = Array(_len), _key = 0; _key < _len; _key++) {
    reducers[_key] = arguments[_key];
  }

  if (Provider._updateState({}) === undefined) {
    Provider._updateState = create({});
  }
  setReducer(reducers);
  return { dispatch: dispatch, subscribe: subscribe, getState: getState };
});

/**
 * @name combine
 * @description Combine the reducers
 */
var combine = (function () {
  for (var _len = arguments.length, reducers = Array(_len), _key = 0; _key < _len; _key++) {
    reducers[_key] = arguments[_key];
  }

  setReducer(reducers);
});

var middleware = (function () {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  Provider._middlewares = Provider._middlewares.concat(middlewares);
});

exports.createStore = createStore;
exports.combine = combine;
exports.applyMiddleware = middleware;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=dutier.js.map
