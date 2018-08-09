'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var assign = Object.assign || function (target, source) {
  getAllKeys(source).forEach(function (key) {
    if (hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  });
  return target;
};

var getAllKeys = typeof Object.getOwnPropertySymbols === 'function' ? function (obj) {
  return [].concat(_toConsumableArray(Object.keys(obj)), _toConsumableArray(Object.getOwnPropertySymbols(obj)));
} : function (obj) {
  return Object.keys(obj);
};

var copy = function copy(object) {
  if (object instanceof Array) {
    return object.slice();
  }
  if (object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object') {
    var prototype = object.constructor && object.constructor.prototype;
    return assign(Object.create(prototype || null), object);
  }
  return object;
};

var copySubset = function copySubset(object, fields_subset) {
  var copied = void 0;
  if (object instanceof Array) {
    copied = [];
    fields_subset.forEach(function (field) {
      return copied.push(object[field]);
    });
  } else {
    copied = {};
    fields_subset.forEach(function (field) {
      return copied[field] = object[field];
    });
  }
  return copied;
};

var isLiteral = function isLiteral(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object' || value === null || value instanceof Array;
};

var compareObjects = function compareObjects(first, second) {
  if ((typeof first === 'undefined' ? 'undefined' : _typeof(first)) !== (typeof second === 'undefined' ? 'undefined' : _typeof(second))) {
    return false;
  }
  if ((typeof first === 'undefined' ? 'undefined' : _typeof(first)) !== 'object' || (typeof second === 'undefined' ? 'undefined' : _typeof(second)) !== 'object') {
    if (!(first instanceof Array && second instanceof Array)) {
      return first === second;
    } else {
      return compareArrays(first, second);
    }
  }
  var keys = new Set([].concat(_toConsumableArray(getAllKeys(first)), _toConsumableArray(getAllKeys(second))));
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;

      if (!compareObjects(first[key], second[key])) {
        return false;
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

  return true;
};

var compareArrays = function compareArrays(first, second) {
  if (!first || !second || !(first instanceof Array) || !(second instanceof Array) || first.length !== second.length) {
    return false;
  }
  for (var i in first) {
    if (first[i] instanceof Array && second[i] instanceof Array) {
      if (!compareArrays(first[i], second[i])) {
        return false;
      }
    }
    if (!compareObjects(first[i], second[i])) {
      return false;
    }
  }
  return true;
};

var isSubtree = function isSubtree(root1, root2) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = getAllKeys(root2)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var key = _step2.value;

      if (!root1[key]) {
        return false;
      }
      if (!compareObjects(root1[key], root2[key])) {
        return false;
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

  return true;
};

var subtreesMatch = function subtreesMatch(root1, root2, subtree) {
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = getAllKeys(subtree)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var key = _step3.value;

      if (subtree[key] === true) {
        return compareObjects(root1[key], root2[key]);
      }
      if (!root1[key] || !root2[key]) {
        return false;
      }
      if (!subtreesMatch(root1[key], root2[key])) {
        return false;
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

  return true;
};

module.exports = { assign: assign, getAllKeys: getAllKeys, copy: copy, copySubset: copySubset, isLiteral: isLiteral, compareObjects: compareObjects, compareArrays: compareArrays, isSubtree: isSubtree, subtreesMatch: subtreesMatch };