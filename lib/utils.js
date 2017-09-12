const assign = Object.assign || ((target, source) => {
  getAllKeys(source).forEach((key) => {
    if (hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  });
  return target;
});

const getAllKeys = typeof Object.getOwnPropertySymbols === 'function' ?
  (obj) => [ ...Object.keys(obj), ...Object.getOwnPropertySymbols(obj), ] :
  (obj) => Object.keys(obj);

const copy = (object) => {
  if (object instanceof Array) {
    return object.slice();
  }
  if (object && typeof object === 'object') {
    const prototype = object.constructor && object.constructor.prototype;
    return assign(Object.create(prototype || null), object);
  }
  return object;
};

const copySubset = (object, fields_subset) => {
  let copied;
  if (object instanceof Array) {
    copied = [];
    fields_subset.forEach((field) => copied.push(object[field]));
  } else {
    copied = {};
    fields_subset.forEach((field) => copied[field] = object[field]);
  }
  return copied;
};

const isLiteral = (value) => typeof value !== 'object' || value === null || value instanceof Array;

const compareObjects = (first, second) => {
  if (typeof first !== typeof second) {
    return false;
  }
  if (typeof first !== 'object' || typeof second !== 'object') {
    if (!(first instanceof Array && second instanceof Array)) {
      return first === second;
    } else {
      return compareArrays(first, second);
    }
  }
  const keys = new Set([ ...getAllKeys(first), ...getAllKeys(second), ]);
  for (let key of keys) {
    if (!compareObjects(first[key], second[key])) {
      return false;
    }
  }
  return true;
};

const compareArrays = (first, second) => {
  if (!first || !second || !(first instanceof Array) || !(second instanceof Array) || first.length !== second.length) {
    return false;
  }
  for (let i in first) {
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

const isSubtree = (root1, root2) => {
  for (let key of getAllKeys(root2)) {
    if (!root1[key]) {
      return false;
    }
    if (!compareObjects(root1[key], root2[key])) {
      return false;
    }
  }
  return true;
};

const subtreesMatch = (root1, root2, subtree) => {
  for (let key of getAllKeys(subtree)) {
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
  return true;
};

module.exports = { assign, getAllKeys, copy, copySubset, isLiteral, compareObjects, compareArrays, isSubtree, subtreesMatch, };
