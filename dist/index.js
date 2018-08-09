'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('./utils'),
    assign = _require.assign,
    getAllKeys = _require.getAllKeys,
    copy = _require.copy,
    copySubset = _require.copySubset,
    isLiteral = _require.isLiteral,
    isSubtree = _require.isSubtree,
    subtreesMatch = _require.subtreesMatch;

module.exports = function () {
  var current_pointer = 0;
  var calls_table = {};

  var getPointer = function getPointer() {
    return '$evolveq1$_#' + ++current_pointer;
  };
  var addCall = function addCall(call) {
    var new_pointer = getPointer();
    calls_table[new_pointer] = call;
    return new_pointer;
  };

  var whereRoutine = function whereRoutine(keys, value, callback, is_value, is_not) {
    if (callback === true) {
      callback = function callback() {
        return true;
      };
    }
    if (typeof callback !== 'function') {
      var accessors_tree = copy(callback);
      callback = function callback(key) {
        return isSubtree(value[key], copy(accessors_tree));
      };
    }
    var new_keys = is_value ? getAllKeys(value) : keys;
    var filtered = new_keys.filter(function (key) {
      return is_not ? !callback(key, value[key]) : callback(key, value[key]);
    });
    return is_value ? copySubset(value, filtered) : filtered;
  };

  var spreadRoutine = function spreadRoutine(keys, value, _ref, is_value) {
    var array = _ref.array,
        is_soft = _ref.is_soft;

    if (value instanceof Array) {
      return !is_soft ? [].concat(_toConsumableArray(value), _toConsumableArray(array)) : array.filter(function (val, i) {
        return value[i] !== undefined;
      });
    }
    var spreaded = is_soft ? array.filter(function (key) {
      return !!keys.find(function (k) {
        return k !== key;
      });
    }) : array;
    if (is_value) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = spreaded[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          value[key] = undefined;
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

      return value;
    }
    return spreaded;
  };

  var alterRoutine = function alterRoutine(key, value, callback) {
    return callback(key, value);
  };

  var isMatch = function isMatch(old_value, fresh_value, join_tree) {
    if (join_tree === true) {
      return true;
    }
    return typeof join_tree === 'function' ? join_tree(old_value, fresh_value) : subtreesMatch(old_value, fresh_value, join_tree);
  };

  var mergeWithCondition = function mergeWithCondition(keys, value, _ref2) {
    var array = _ref2.array,
        join_tree = _ref2.join_tree;

    var not_merged_keys = new Set(getAllKeys(array));
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = getAllKeys(value)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var old_key = _step2.value;

        var is_merge = false;
        var old_value = copy(value[old_key]);
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = getAllKeys(array)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var new_key = _step4.value;

            var fresh_value = copy(array[new_key]);
            if (isMatch(old_value, fresh_value, join_tree)) {
              is_merge = true;
              value[old_key] = { old: old_value, fresh: fresh_value };
              not_merged_keys.delete(new_key);
            }
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        if (!is_merge) {
          value[old_key] = { old: old_value, fresh: null };
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = not_merged_keys[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var key = _step3.value;

        if (!value[key]) {
          value[key] = { old: null, fresh: copy(array[key]) };
        } else {
          if (value instanceof Array) {
            value.push({ old: null, fresh: copy(array[key]) });
          }
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return value;
  };

  var mergeByKey = function mergeByKey(keys, value, array) {
    var updated_keys = new Set([].concat(_toConsumableArray(getAllKeys(value)), _toConsumableArray(getAllKeys(array))));
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = updated_keys[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var key = _step5.value;

        value[key] = { old: copy(value[key]) || null, fresh: copy(array[key]) || null };
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    return value;
  };

  var mergeRoutine = function mergeRoutine(keys, value, _ref3, is_value) {
    var array = _ref3.array,
        join_tree = _ref3.join_tree;

    if (join_tree) {
      value = mergeWithCondition(keys, value, { array: array, join_tree: join_tree });
    } else {
      value = mergeByKey(keys, value, array);
    }
    return is_value ? value : getAllKeys(value);
  };

  var removeRoutine = function removeRoutine(keys, value, callback, is_value) {
    if (is_value) {
      if (callback) {
        return whereRoutine(keys, value, callback, true, true);
      }
      return null;
    }
  };

  var where = function where(callback) {
    return addCall({ callback: callback, call: whereRoutine });
  };
  var spread = function spread(array, is_soft) {
    return addCall({ callback: { array: array, is_soft: is_soft }, call: spreadRoutine });
  };
  var alter = function alter(callback) {
    return addCall({ callback: callback, call: alterRoutine });
  };
  var merge = function merge(array, join_tree) {
    return addCall({ callback: { array: array, join_tree: join_tree }, call: mergeRoutine });
  };
  var remove = function remove(callback) {
    return addCall({ callback: callback, call: removeRoutine });
  };

  var evolve_value = function evolve_value(value, change, key) {
    var routine = calls_table[change];
    return routine ? routine.call(key, value, routine.callback, true) : change;
  };

  var evolve_key = function evolve_key(value, changes) {
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      var _loop = function _loop() {
        var pointer = _step6.value;

        var routine = calls_table[pointer];
        var next_keys = routine ? routine.call(getAllKeys(value), value, routine.callback, false) : [pointer];
        next_keys.forEach(function (key) {
          var default_value = changes[pointer] instanceof Array ? [] : {};
          var is_not_last_change = isLiteral(value[key]) && !isLiteral(changes[pointer]) && _typeof(value[key]) !== (typeof default_value === 'undefined' ? 'undefined' : _typeof(default_value));
          value[key] = recursively_evolve(is_not_last_change ? default_value : value[key], changes[pointer], key);
        });
      };

      for (var _iterator6 = getAllKeys(changes)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        _loop();
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }

    return value;
  };

  var recursively_evolve = function recursively_evolve(value, changes, key) {
    var new_value = copy(value);
    if (changes === undefined) {
      return new_value;
    }
    if (isLiteral(changes)) {
      return evolve_value(new_value, changes, key);
    }
    return evolve_key(new_value, changes, key);
  };

  var evolve = function evolve(value, changes) {
    var result = value;
    if (changes instanceof Array) {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = changes[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var change = _step7.value;

          result = recursively_evolve(result, change);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    } else {
      result = recursively_evolve(value, changes);
    }
    current_pointer = 0;
    calls_table = {};
    return result;
  };

  return { evolve: evolve, where: where, spread: spread, alter: alter, merge: merge, remove: remove };
}();