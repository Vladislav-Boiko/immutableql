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
    if (!compareObjects(first[i], seocnd[i])) {
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

const immutableql = () => {
  let current_pointer = 0;
  let calls_table = {};

  const getPointer = () => `$evolveq1$_#${++current_pointer}`;
  const addCall = (call) => {
    const new_pointer = getPointer();
    calls_table[new_pointer] = call;
    return new_pointer;
  };

  const whereRoutine = (keys, value, callback, is_value) => {
    if (callback === true) {
      callback = () => true;
    }
    if (typeof callback !== 'function') {
      const accessors_tree = copy(callback);
      callback = (key) => isSubtree(value[key], copy(accessors_tree));
    }
    const new_keys = is_value ? getAllKeys(value) : keys;
    const filtered = new_keys.filter((key) => callback(key, value[key]));
    return is_value ? copySubset(value, filtered) : filtered;
  };

  const spreadRoutine = (keys, value, { array, is_soft, }) => {
    if (value instanceof Array) {
      return !is_soft ? [ ...value, ...array, ] : array.filter((val, i) => value[i] !== undefined);
    }
    return !is_soft ? array : array.filter((key) => !!keys.find((k) => k !== key));
  };

  const alterRoutine = (key, value, callback) => callback(key, value);

  const mergeRoutine = (keys, value, { array, not_override, join_tree, }, is_value) =>  {
    let values = [];
    if (join_tree) {
      for (let merging_key of getAllKeys(array)) {
        let merged = false;
        for (let key of getAllKeys(value)) {
          if (typeof join_tree === 'function' ? join_tree(value[key], array[merging_key]) : subtreesMatch(value[key], array[merging_key], join_tree)) {
            value[key] = not_override ? assign(copy(array[merging_key]), value[key]) : assign(copy(value[key]), array[merging_key]);
            merged = true;
            break;
          }
        }
        if (!merged) {
          if (value instanceof Array) {
            value.push(array[merging_key]);
          } else {
            value[merging_key] = copy(array[merging_key]);
          }
        }
      }
    } else {
      value = not_override ? assign(copy(array), value) : assign(value, array);
    }
    return is_value ? value : getAllKeys(value);
  };

  const where = (callback) => addCall({ callback, call: whereRoutine, });
  const spread = (array, is_soft) => addCall({ callback: { array, is_soft, }, call: spreadRoutine, });
  const alter = (callback) => addCall({ callback, call: alterRoutine, });
  const merge = (array, not_override, join_tree) => addCall({ callback: { array, not_override, join_tree, }, call: mergeRoutine, });

  const evolve_value = (value, change, key) => {
    const routine = calls_table[change];
    return routine ? routine.call(key, value, routine.callback, true) : change;
  };

  const evolve_key = (value, changes, parent_key) => {
    for (let pointer of getAllKeys(changes)) {
      const routine = calls_table[pointer];
      const next_keys = routine ? routine.call(getAllKeys(value), value, routine.callback) : [ pointer, ];
      next_keys.forEach((key) => {
        const default_value = changes[pointer] instanceof Array ? [] : {};
        const is_not_last_change = isLiteral(value[key]) && !isLiteral(changes[pointer]) && typeof value[key] !== typeof default_value;
        value[key] = recursively_evolve(is_not_last_change ? default_value : value[key], changes[pointer], key);
      });
    }
    return value;
  };

  const recursively_evolve = (value, changes, key) => {
    let new_value = copy(value);
    if (changes === undefined) {
      return new_value;
    }
    if (isLiteral(changes)) {
      return evolve_value(new_value, changes, key);
    }
    return evolve_key(new_value, changes, key);
  };

  const evolve = (value, changes) => {
    const result = recursively_evolve(value, changes);
    current_pointer = 0;
    calls_table = {};
    return result;    
  };

  return { evolve, where, spread, alter, merge, };
};

module.exports = immutableql();
