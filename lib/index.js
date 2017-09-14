const { assign, getAllKeys, copy, copySubset, isLiteral, isSubtree, subtreesMatch, } = require('./utils');

const immutableql = () => {
  let current_pointer = 0;
  let calls_table = {};

  const getPointer = () => `$evolveq1$_#${++current_pointer}`;
  const addCall = (call) => {
    const new_pointer = getPointer();
    calls_table[new_pointer] = call;
    return new_pointer;
  };

  const whereRoutine = (keys, value, callback, is_value, is_not) => {
    if (callback === true) {
      callback = () => true;
    }
    if (typeof callback !== 'function') {
      const accessors_tree = copy(callback);
      callback = (key) => isSubtree(value[key], copy(accessors_tree));
    }
    const new_keys = is_value ? getAllKeys(value) : keys;
    const filtered = new_keys.filter((key) => is_not ? !callback(key, value[key]) : callback(key, value[key]));
    return is_value ? copySubset(value, filtered) : filtered;
  };

  const spreadRoutine = (keys, value, { array, is_soft, }, is_value) => {
    if (value instanceof Array) {
      return !is_soft ? [ ...value, ...array, ] : array.filter((val, i) => value[i] !== undefined);
    }
    const spreaded = is_soft ? array.filter((key) => !!keys.find((k) => k !== key)) : array;
    if (is_value) {
      for (let key of spreaded) {
        value[key] = undefined;
      }
      return value;
    }
    return spreaded;
  };

  const alterRoutine = (key, value, callback) => callback(key, value);

  const isMatch = (old_value, fresh_value, join_tree) => {
    if (join_tree === true) {
      return true;
    }
    return typeof join_tree === 'function' ? join_tree(old_value, fresh_value) : subtreesMatch(old_value, fresh_value, join_tree);
  };

  const mergeWithCondition = (keys, value, { array, join_tree, }) => {
    let not_merged_keys = new Set(getAllKeys(array));
    for (let old_key of getAllKeys(value)) {
      let is_merge = false;
      const old_value = copy(value[old_key]);
      for (let new_key of getAllKeys(array)) {
        const fresh_value = copy(array[new_key]);
        if (isMatch(old_value, fresh_value, join_tree)) {
          is_merge = true;
          value[old_key] = { old: old_value, fresh: fresh_value, };
          not_merged_keys.delete(new_key);
        }
      }
      if (!is_merge) {
        value[old_key] = { old: old_value, fresh: null, };
      }
    }
    for (let key of not_merged_keys) {
      if (!value[key]) {
        value[key] = { old: null, fresh: copy(array[key]), };
      } else {
        if (value instanceof Array) {
          value.push({ old: null, fresh: copy(array[key]), });
        }
      }
    }
    return value;
  };

  const mergeByKey = (keys, value, array) => {
    const updated_keys = new Set( [ ...getAllKeys(value), ...getAllKeys(array), ]);
    for (let key of updated_keys) {
      value[key] = { old: copy(value[key]) || null, fresh: copy(array[key]) || null, };
    }
    return value;
  };

  const mergeRoutine = (keys, value, { array, join_tree, }, is_value) => {
    if (join_tree) {
      value = mergeWithCondition(keys, value, { array, join_tree, });
    } else {
      value = mergeByKey(keys, value, array);
    }
    return is_value ? value : getAllKeys(value);
  };

  const removeRoutine = (keys, value, callback, is_value) => {
    if (is_value) {
      if (callback) {
        return whereRoutine(keys, value, callback, true, true);
      }
      return null;
    }
  };

  const where = (callback) => addCall({ callback, call: whereRoutine, });
  const spread = (array, is_soft) => addCall({ callback: { array, is_soft, }, call: spreadRoutine, });
  const alter = (callback) => addCall({ callback, call: alterRoutine, });
  const merge = (array, join_tree) => addCall({ callback: { array, join_tree, }, call: mergeRoutine, });
  const remove = (callback) => addCall({ callback, call: removeRoutine, });

  const evolve_value = (value, change, key) => {
    const routine = calls_table[change];
    return routine ? routine.call(key, value, routine.callback, true) : change;
  };

  const evolve_key = (value, changes) => {
    for (let pointer of getAllKeys(changes)) {
      const routine = calls_table[pointer];
      const next_keys = routine ? routine.call(getAllKeys(value), value, routine.callback, false) : [ pointer, ];
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
    let result = value;
    if (changes instanceof Array) {
      for (let change of changes) {
        result = recursively_evolve(result, change);
      }
    } else {
      result = recursively_evolve(value, changes);
    }
    current_pointer = 0;
    calls_table = {};
    return result;
  };

  return { evolve, where, spread, alter, merge, remove, };
};

module.exports = immutableql();
