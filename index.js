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

  const mergeRoutine = (keys, value, { array, not_override, }, is_value) =>  {
    value = not_override ?  assign(copy(array), value) : assign(value, array);
    return is_value ? value : getAllKeys(value);
  };

  const where = (callback) => addCall({ callback, call: whereRoutine, });
  const spread = (array, is_soft) => addCall({ callback: { array, is_soft, }, call: spreadRoutine, });
  const alter = (callback) => addCall({ callback, call: alterRoutine, });
  const merge = (array, not_override) => addCall({ callback: { array, not_override, }, call: mergeRoutine, });

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
        const not_last_change = isLiteral(value[key]) && !isLiteral(changes[pointer]);
        value[key] = recursively_evolve(not_last_change ? default_value : value[key], changes[pointer], key);
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
