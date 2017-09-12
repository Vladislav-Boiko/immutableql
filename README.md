Complex immutable changes of large js objects made simple
=========================================================

Immutableql allows CRUD operations over JS objects (and arrays) at any depth in a neat and easy-to-read way.

The library was inspired by the [immutability-helper](https://github.com/kolodny/immutability-helper) project, and tried to tackle the complexity of its syntax when dealing with huge object trees alike the ones one can face working with redux. Although, it is not limited to be used with redux, *immutableql* was written with it in mind.

## Installation
```js
yarn add immutableql
# OR
npm i immutableql
```

## Enough talk, show me some code!

In a nutshell, there is an *evolve* function that in combination with a few other helper functions, provides a mechanism to describe in a human readable way what changes to an object should be made like this:

```js
import { evolve, spread, where, alter, } from 'immutableql';
const original_object = { a: 1, };
const changes = {
  // First add proprties b, c, d, to the object and set their values to zeros
  [spread([ 'b', 'c', 'd', ])]: 0,
  // Then set the values under all keys larger than 'b' to two
  [where((key) => key > 'b')]: 2,
  // Now, set the values of keys less than 'd' having values more than 1 to three
  [where((key, value) => key < 'd' && value > 1)]: 3,
  // Set the value of property d to 4
  d: 4,
  // Add a key e, with value { f: 5, }
  e: { f: 5, },
  // For all keys that are greater than d, access their f property (or add such if not present) and increment its value
  [where((key) => key > 'd')]: { f: alter((key, value) => (value || 0) + 1 ), },
};
const new_object = evolve(original_object, changes);

// Result:
// -> original = { a: 1, }
// -> new_object = { a: 1, b: 0, c: 3, d: 4, e: { f: 6, } }
```


## How does it work?

### creaton and simpliest changes
**evolve(value: any, changes: any): any**

```js
import { evolve, } from 'immutableql';
const user = { id: 1, name: 'Admin', };
const changed = evolve(user, { name: 'root', });

// Result:
// -> user = { id: 1, name: 'Admin', }
// -> changed = { id: 1, name: 'root', }
```

Or in  case of requirejs environment one can as well:
```js
var { evolve, } = require('immutableql');
```

As one can see, the first parameter of the evolve function is the object one wants to change, and the second is an object describing instructions on how it should be changed. In this concrete example, it is requested to set the value under key *a* to *2*.

In fact, it is possible to replace values under given keys with arbitrary data (i.e. also with arrays), or change empty objects, numbers, nulls, undefined or unexisted keys. The second parameter of the evolve function describes a path to the modified values and rules how they should be altered:

```js
import { evolve, } from 'immutableql';
const user = { id: 10, permissions: null, }; // one might as well completely omit the "permissions" property declaration
const changed = evolve(user, { permissions: { groups: { tasks: 'read', }, }, });

// Result:
// -> to_chnage = { id: 10, permissions: null, }
// -> changed = { id: 10, { permissions: { groups: { tasks: 'read', }, }, }, }
```

Same way arrays can be evolved at a given index:
```js
import { evolve, } from 'immutableql';
const changed = evolve([ 1, 2, ], { 0: 3, 1: 4, });

// Result:
// -> changed = [ 3, 4, ]
```

### where statement
**where(callback:([key: string | number, value: any]) => boolean)**
**where(object)**
**where(boolean)**

It is cool to modify objects by a given path maintaining immutability, but it would not be enough for complex dynamic objects' updates, so one might need a *where* function to dynamically signify which keys should be changed. For simple use-cases, one can pass an object to the where function that will describe a tree to be matched at a given property for the change to fire:
```js
import { evolve, where, } from 'immutableql';
const users = [ { id: 1, is_online: false, }, { id: 2, is_online: true, }, { id: 3, is_online: false, }];
evolve(users, { [where({ id: 2, })]: { is_online: false, } });

// Result:
// -> [ { id: 1, is_online: false, }, { id: 2, is_online: false, }, { id: 3, is_online: false, }]
```
You might nest such requests as deep as you want, i.e. you can pass complex objects to the where function as input (arrays will be also matched against.)

Sometimes you do want to modify all keys (especially in arrays), for some particular use-cases, for that you can simply use *where(true)*:
```js
import { evolve, where, } from 'immutableql';
const users = [ { id: 1, is_online: false, }, { id: 2, is_online: true, }, { id: 3, is_online: false, }];
evolve(users, { [where(true)]: { is_online: true, } });

// Result:
// -> [ { id: 1, is_online: true, }, { id: 2, is_online: true, }, { id: 3, is_online: true, }]
```

For more complicated cases it is possible to pass a function to the where routine that will determine weather a change should take place under a given property or not.
```js
import { evolve, where, } from 'immutableql';
const to_chagne = { a: 1, b: 2, c: 3, };
evolve(to_change, { [where((key) => key > 'a')]: 4, });
evolve(to_change, { [where((key, value) => value < 3)]: 4, });

// Result:
// -> { a: 1, b: 4, c: 4, }
// -> { a: 4, b: 4, c: 3, }
```

Pay attention to the brackets aruond *[where((key) => key > 'a')]*, the function call itself, without them, cannot be used as a key in a javascript object.

The callback passed to the *where* function, takes as a first argument the key, and as the second the value under that key, it should return true for the key-value pairs to be changed.
Same applies to the arrays, the key in their case will be the index, and the value - value at that index.

It is also possible to only select data, without modificaiton:
expect(evolve_wrap({ a: 1, b: 2, c: 3, }, where((key, value) => value > 1))).toEqual({ b: 2, c: 3, })); 
```js
import { evolve, where, } from 'immutableql';
const to_chagne = { a: 1, b: 2, c: 3, };
evolve(to_chagne, where((key, value) => value > 1));

// Result:
// -> { b: 2, c: 3, }
```

### spread statement
**spread(keys: array, not_override: boolean)**

It would not have been enough if it was only possible to narrow the set of keys via *where* statement, sometimes it is needed to add some keys, the spread function was designed for this purpose.

Simply adding new keys:
```js
import { evolve, spread, } from 'immutableql';
evolve({ id: 10, }, { [spread([ 'visits', 'balance', ])]: 0, });

// Result:
// -> { id: 10, visits: 0, balance: 0, }
```

By default the function overrides the initial values under the spread keys with provided data. If one wants to add keys without overriding the respective values already present, the second parameter of *spread* function comes to help:
```js
import { evolve, spread, } from 'immutableql';
evolve({ balance: 10, }, { [spread([ 'visits', 'balance', ], true)]: 0, });

// Result:
// -> { visits: 0, balance: 0, }
```

One can use this mechanism to add values to an array:
```js
import { evolve, spread, } from 'immutableql';
evolve([ 1, 2, 3, ], spread([ 4, 5, 6, 7, ]));

// Result:
// -> [ 1, 2, 3, 4, 5, 6, 7, ]
```

Or, as well, to modify array values under certain keys, same as with objects:
```js
import { evolve, spread, } from 'immutableql';
evolve_wrap([ 7, ], { [spread([ 0, 3, 4, ])]: 1, });

// Result:
// ->[ 1,,,1,1, ]
```

### alter statement
**alter(key: any, vlaue: any)**

After we can select or add keys within js objects, one could like to modify the values under these keys in various ways, hence the alter funcion.

At its simplest, the alter function just has to return a new value under the stated key:
```js
import { evolve, alter, } from 'immutableql';
evolve({}, alter((value) => ({ name: 'root', })));
evolve({ balance: 10, }, { balance: alter((key, value) => value + 1) });

// Result:
// -> { name: 'root', }
// -> { balance: 11, }
```

Especially it comes in handy for arrays alteration:
```js
import { evolve, alter, } from 'immutableql';
evolve([ 1, 2, ], alter((key, value) => [ ...value, 3, ])); // 1
evolve([ 1, 2, ], alter((key, value) => { value.push(3); return value; })); // 2
evolve([ 1, 2, 3, ], alter((key, value) => value.slice(1))); // 3
evolve([ 1, 2, 3, 4, ], alter((key, value) => value.filter((e) => e > 3))); // 4
evolve([ 1, 2, 3, ], alter((key, value) => value.map((e) => 5))); // 5
evolve([ 1, 2, 3, ], alter((key, value) => value.reduce((sum, e) => sum + e), 0)); // 6

// Result: 
// -> [ 1, 2, 3, ] // 1
// -> [ 1, 2, 3, ] // 2
// -> [ 2, 3, ]    // 3
// -> [ 4, ]       // 4
// -> [ 5, 5, 5, ] // 5
// -> 6            // 6
```

### merge statement
**merge(to_merge_with: any, merge_condition: object | function)**

Sometimes it is wanted to merge some objects, and not to declare all the necessary modifications through key-value pair changes. The merge function combines two given objects by a given condition and puts under the original key a new object containing the both merged ones ( { old: original_value, fresh: new_value, }), such that one can further specify the exact mergin behavior via alter function. If the merge condition is such, that there are some unmerged properties left in the object provided they will be put as { old: original_value, fresh: null, } under the old key, if this unmerged property belongs to the old object, or will be put as { old: null, fresh: new_value, } if they belonged to the merging object. In the second case the key is chosen as follows: if the key under which the value was present in the merging object is available it will be used, if not, and the object operated is an array, the merging object will be pushed in it, otherwise, the object is dropped (as it is not matching the merging condition anyway.)
The second parameter of the merge function is same as the parameter of the where function

```js
import { evolve, merge, } from 'immutableql';
evolve({ id: 1, balance: 2, }, {
  [merge({ balance: 3, visits: 3, })]:
    alter((key, { old, fresh, }) => Object.assign(old, fresh, { balance: old.balance + fresh.balance, }))
});

// Result:
// -> { id: 1, balance: 5, visits: 3, }
```

Often we need to merge arrays (or even objects), that store objects to be merged at different indexies (properits), then one can parametrrize the merge, by telling what fields should match for the merge to appear, or even pass a function that will determine the conditions for merge. If you provide a joining object as in the exmple below, you shall set the fields of that object (can be nested) to true at the positions that shall match:
```js
import { evolve, merge, } from 'immutableql';
const shopping_cart = [ { id: 1, amount: 1, }, { id: 2, amount: 2, }, ];
const added = [ { id: 2, amount: 1 }, { id: 3, amount: 3, }, ];
evolve(shopping_cart, {
  [merge(added, { id: true, })]: 
    alter((key, { old, fresh }) => Object.assign(old || {}, fresh || {}, { amount: (old ? old.amount : 0) + (fresh ? fresh.amount : 0) }))
});

// Result
// -> [ { id: 1, amount: 1, }, { id: 2, amount: 3, }, { id: 3, amount: 3, }, ]
```
