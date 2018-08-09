const assert = require('assert');
const deepcopy = require('deepcopy');

const { evolve, where, spread, alter, merge, remove, } = require('./');

// For testing purposes checks that we didn't change the original object.
const evolve_wrap = (original, changes) => {
  const stay_unchanged = deepcopy(original);
  const changed = evolve(original, changes);
  try {
    assert.deepEqual(original, stay_unchanged);
  } catch(e) {
    console.log(`FATAL!! mutated original object`);
    console.error(e);
  }
  return changed;
};

describe('Evolve function', () => {
  it(`copies the original object`, () => {
      assert.deepEqual(evolve_wrap({ a: 1, b: 2, }), { a: 1, b: 2, });
      let first = { a: 1, b: 2, };
      let second = evolve_wrap({ a: 1, b: 2, });
      first.a = 2;
      assert.notDeepEqual(first, second);
    });

  it(`replaces values with literals`,
    () => assert.deepEqual(evolve_wrap({}, 2), 2));

  it(`replaces null with literals`,
    () => assert.deepEqual(evolve_wrap(null, 2), 2));

  it(`replaces undefined with literals`,
    () => assert.deepEqual(evolve_wrap(null, 2), 2));

  it(`replaces values with objects,`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, { a: { b: { c: 2, }, }, }), { a: { b: { c: 2, }, }, }));

  it(`replaces nested values with objects,`,
    () => assert.deepEqual(evolve_wrap({ a: { b: 2, }, }, { a: { b: { c: { d: 3, }, }, }, }), { a: { b: { c: { d: 3, }, }, }, }));

  it(`treats literals as alters`,
    () => assert.deepEqual(evolve_wrap({}, { a: 2, }), { a: 2, }));

  it(`treats arrays as alters`,
    () => assert.deepEqual(evolve_wrap({}, { a: [ 2, 3, ], }), { a: [ 2, 3, ], }));

  it(`can evolve an array by index`, () => {
    assert.deepEqual(evolve_wrap([], { 0: 2, }), [ 2, ])
    assert.deepEqual(evolve_wrap([], { 2: 2, }), [ ,,2, ])
  });
});

describe('where', () => {
  it(`can where key literals`,
    () => assert.deepEqual(evolve_wrap({ a: 1, b: 2, c: 3, }, { b: 4, }), { a: 1, b: 4, c: 3, }));

  it(`can where keys`,
    () => assert.deepEqual(evolve_wrap({ a: 1, b: 2, c: 3, }, { [where((key) => key > 'a')]: 4, }), { a: 1, b: 4, c: 4, }));

  it(`can where values`,
    () => assert.deepEqual(evolve_wrap({ a: 1, b: 2, c: 3, }, where((key, value) => value > 1)), { b: 2, c: 3, }));

  it(`can where values by inner parameter`,
    () => assert.deepEqual(evolve_wrap({ a: 1, b: 2, c: 3, }, where(1)), { a: 1, b: 2, c: 3, }));

  it(`can where arrays`,
    () => assert.deepEqual(evolve_wrap([ { a: 1, }, { a: 2, }, { a: 3, }, ], where((key, value) => value.a > 2)), [ { a: 3, }, ]));

  it(`can where arrays by inner parameter`,
    () => assert.deepEqual(evolve_wrap([ { a: 1, }, { a: 2, }, { a: 3, }, ], where({ a: 3, })), [ { a: 3, }, ]));

  it(`can where netsted arrays`,
    () => assert.deepEqual(evolve_wrap({ a: [ { b: 1, }, { b: 2, }, ], },
      { a: {
        [where((key, value) => value.b > 1)]:
          { c: 3, },
        },
    }), { a: [ { b: 1, }, { b: 2, c: 3, }, ], }));

  it(`can take objects as input (sugar)`,
    () => assert.deepEqual(evolve_wrap([ { a: 1, b: 2, }, { a: 3, b: 4, }, ], { [where({ a: 1, })]: { b: 5, }, }), [ { a: 1, b: 5, }, { a: 3, b: 4, }, ]));

  it(`can take nested objects as input (sugar)`,
    () => assert.deepEqual(evolve_wrap([ { a: { c: 6, }, b: 2, e: 7, }, { a: 3, b: 4, }, ], { [where({ a: { c: 6, }, e: 7, })]: { b: 5, }, }), [ { a: { c: 6, }, b: 5, e: 7, }, { a: 3, b: 4, }, ]));

  it(`can take nested objects-arrays as input (sugar)`,
    () => assert.deepEqual(evolve_wrap([ { a: { c: 6, }, b: 2, e: [ 1, [ 2, { f: 8, }, ], ], }, { a: 3, b: 4, }, ], { [where({ a: { c: 6, }, e: [ 1, [ 2, { f: 8, }, ], ], })]: { b: 5, }, }), [ { a: { c: 6, }, b: 5, e: [ 1, [ 2, { f: 8, }, ], ], }, { a: 3, b: 4, }, ]));

  it(`can use true as a parameter (sugar)`,
    () => assert.deepEqual(evolve_wrap({ a: 1, b: 2, c: 3, }, { [where(true)]: 5, }), { a: 5, b: 5, c: 5, }));

  it(`can fullfil the scenario from readme`,
    () => {
      const users = [ { id: 1, is_online: false, }, { id: 2, is_online: true, }, { id: 3, is_online: false, }, ];
      assert.deepEqual(evolve_wrap(users, { [where({ id: 2, })]: { is_online: false, }, }), [ { id: 1, is_online: false, }, { id: 2, is_online: false, }, { id: 3, is_online: false, }, ]);
    });
});

describe('spread', () => {
  it(`can spread keys`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, { [spread([ 'b', 'c', ])]: null, }), { a: 1, b: null, c: null, }));

  it(`can spread keys with array values`,
    () => assert.deepEqual(evolve_wrap({ a: [], }, { [spread([ 'b', 'c', ])]: 1, }), { a: [], b: 1, c: 1, }));

  it(`can spread without overriding`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, { [spread([ 'a', 'b', ], true)]: 2, }), { a: 1, b: 2, }));

  it(`can spread with overriding`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, { [spread([ 'a', 'b', ])]: 2, }), { a: 2, b: 2, }));

  it(`can simply spread an array`,
    () => assert.deepEqual(evolve_wrap([ 1, 2, 3, ], spread([ 4, 5, 6, 7, ])), [ 1, 2, 3, 4, 5, 6, 7, ]));

  it(`can spread an array by index`,
    () => assert.deepEqual(evolve_wrap([], { [spread([ 0, 3, 4, ])]: 1, }), [ 1,,,1,1, ]));

  it(`can soft spread arrays by index`,
    () => assert.deepEqual(evolve_wrap([ 7, 7, 7, ], { [spread([ 0, 3, 4, ], true)]: 1, }), [ 1, 7, 7, 1, 1, ]))

  it(`can simply spread an object`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, spread([ 'b', ])), { a: 1, b: undefined, }));

  it(`can spread on array as a property`, 
    () => assert.deepEqual(evolve_wrap({ a: [ 1, 2, 3, ], }, { a: spread([ 'b', ]), }), { a: [ 1, 2, 3, 'b', ], }));

});

describe('alter', () => {
  it(`can alter the original object`,
    () => assert.deepEqual(evolve_wrap({}, alter((value) => ({ a: 1, }))), { a: 1, }));

  it(`can alter a value in an object`,
    () => assert.deepEqual(evolve_wrap({ a: 10, }, { a: alter((key, value) => value + 1), }), { a: 11, }));

  it(`can alter a value in an array`,
    () => assert.deepEqual(evolve_wrap([ 1, 2, ], alter((key, value) => [ ...value, 3, ]) ), [ 1, 2, 3, ]));

  it(`can do the basic array alteration operations`, () => {
    assert.deepEqual(evolve_wrap([ 1, 2, ], alter((key, value) => { value.push(3); return value; }) ), [ 1, 2, 3, ]);
    assert.deepEqual(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.slice(1)) ), [ 2, 3, ]);
    assert.deepEqual(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.filter((e) => e > 2)) ), [ 3, ]);
    assert.deepEqual(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.map((e) => 4)) ), [ 4, 4, 4, ]);
    assert.deepEqual(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.reduce((sum, e) => sum + e), 0) ), 6);
  });

  it(`can alter an array as a property`,
    () => assert.deepEqual(evolve_wrap({ a: [ 1, 2, 3, ], }, { a: alter((key, value) => [ ...value, 4, ]),}), { a: [ 1, 2, 3, 4, ], }));
});

describe(`merge`, () => {
  it(`can merge objects`, () => {
    const to_merge_with = { a: 4, b: 5, d: 6, };
    assert.deepEqual(evolve_wrap({ a: 1, b: 2, c: 3, },
      { [merge(to_merge_with)]: alter((key, { old, fresh, }) => (old || 0) + (fresh || 0)), }
    ), { a: 5, b: 7, c: 3, d: 6, })
  });

  it(`can merge based on an object`,
    () => assert.deepEqual(evolve_wrap(
      [ { id: 1, a: 1, }, { id: 2, a: 2, }, { id: 3, a: 4, }, ],
      {
        [merge([ { id: 2, a: 3, }, ], { id: true, })]:
          alter((key, { old, fresh, }) => Object.assign(old, fresh, { a: (old ? old.a : 0) + (fresh ? fresh.a : 0), })),
      })
    , [ { id: 1, a: 1, }, { id: 2, a: 5, }, { id: 3, a: 4, }, ]));

  it(`can merge based on a function`,
    () => assert.deepEqual(evolve_wrap(
      [ { id: 1, a: 1, }, { id: 2, a: 2, }, { id: 3, a: 4, }, ],
      {
        [merge([ { id: 2, a: 3, c: 3, }, ], (prev, next) => prev.id === next.id)]:
          alter((key, { old, fresh, }) => Object.assign(old || {}, fresh || {}, { a: (old ? old.a : 0) + (fresh ? fresh.a : 0), })),
      }), 
      [ { id: 1, a: 1, }, { id: 2, a: 5, c: 3, }, { id: 3, a: 4, }, ]));

  it(`can do the test case from readme`, () => {
    const shopping_cart = [ { id: 1, amount: 1, }, { id: 2, amount: 2, }, ];
    const added = [ { id: 2, amount: 1, }, { id: 3, amount: 3, }, ];
    assert.deepEqual(evolve_wrap(shopping_cart, {
      [merge(added, { id: true, })]: alter((key, { old, fresh, }) => Object.assign(old || {}, fresh || {}, { amount: (old ? old.amount : 0) + (fresh ? fresh.amount : 0), })),
    }), [ { id: 1, amount: 1, }, { id: 2, amount: 3, }, { id: 3, amount: 3, }, ]);
  });
});

describe('nesting capabilities', () => {
  it(`can nest trivial`,
    () => assert.deepEqual(evolve_wrap({ a: { b: 1, }, }, { a: { b: 2, }, }), { a: { b: 2, }, }));

  it(`can sequence trivial`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, { a: 2, b: 3, c: 4, }), { a: 2, b: 3, c: 4, }));

  it(`can nest changes requests`,
    () => assert.deepEqual(evolve_wrap(
      { a:
        { b:
          { c:
            { d : 1, },
          },
        },
      },
      { a:
        { b:
          { c:
            { d : alter((key, value) => ({ e: value + 10, })), },
          },
        },
      }),
      { a:
        { b:
          { c:
            { d :
              { e: 11, },
            },
          },
        },
      },
      ));

  it(`can combine where and alter`,
    () => assert.deepEqual(evolve_wrap([ { a: 1, }, { a: 2, }, { a: 3, }, ],
      { [where((key, value) => value.a > 1)]:
          { a : alter((key, value) => value * value), },
      }
    ), [ { a: 1, }, { a: 4, }, { a: 9, }, ]));

  it(`can sequence complex requests`,
    () => assert.deepEqual(evolve_wrap(
      {
        a: 1,
      },
      {
        [spread([ 'b', 'c', 'd', ])]: 0,
        [where((key) => key > 'b')]: 2,
        [where((key, value) => key < 'd' && value > 1)]: 3,
        d: 4,
        e: { f: 5, },
        [where((key) => key > 'd')]: { f: alter((key, value) => value + 1 ), },
      }
    ), { a: 1, b: 0, c: 3, d: 4, e: { f: 6, }, }));

  it(`can sequence and nest complex requests`,
    () => assert.deepEqual(evolve_wrap(
      {
        a: 1,
      },
      {
        [spread([ 'b', 'c', 'd', ])]: 0,
        [where((key) => key > 'b')]: alter((key, value) => ({ e: value + 1, f: value + 2, })),
        d: { f: 3, },
      }
    ), { a: 1, b: 0, c: { e: 1, f: 2, }, d: { e: 1, f: 3, }, }));


  it(`can sequence via arrays`,
    () => assert.deepEqual(evolve_wrap(
      {
        a: 1,
      },
      [
        spread([ 'b', 'c', 'd', ]),
        { [where((key) => key > 'b')]: alter((key, value) => ({ e: (value || 0) + 1, f: (value || 0) + 2, })), },
        { d: { f: 3, }, },
      ]
    ), { a: 1, b: undefined, c: { e: 1, f: 2, }, d: { e: 1, f: 3, }, }));

  it(`can perform the example from readme`, () => {
    const were_logged_in = [ { id: 1, last_seen: 1, session_reference: 'lorem', }, { id: 2, last_seen: 1, }, ];
    const currently_logged_in = [ { id: 1, }, { id: 3, }, { id: 4, }, ];
    const chagnes = [
      merge(currently_logged_in, { id: true, }),
      // say we want to store only currently logged in users
      alter((key, value) => value.filter(({ fresh, }) => !!fresh)),
      { [where(true)]: alter((key, { old, fresh, }) => Object.assign(old || {}, fresh || {}, { last_seen: 2, })), },
    ];
   const updated_logged_in = evolve_wrap(were_logged_in, chagnes);
   assert.deepEqual(updated_logged_in, [ { id: 1, last_seen: 2, session_reference: 'lorem', }, { id: 3, last_seen: 2, }, { id: 4, last_seen: 2, }, ]);
  });
});

describe('remove routine', () => {
  it(`can perform simple remove`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, remove()), null));

  it(`can perform simple remove by a key`,
    () => assert.deepEqual(evolve_wrap({ a: 1, }, { [where(1)]: remove(), }), { a: null, }));

  it(`can perform simple remove in an object`,
    () => assert.deepEqual(evolve_wrap({ a1: { b: 1, }, a2: { b: 2, }, }, { [where({ b: 1, })]: remove(), }), { a1: null, a2: { b: 2, }, }));

  it(`can perform simple remove in an object`,
    () => assert.deepEqual(evolve_wrap({ a1: { b: 1, }, a2: { b: 2, }, }, remove({ b: 1, })), { a2: { b: 2, }, }));

  it(`can remove all`,
    () => assert.deepEqual(evolve_wrap({ a1: { b: 1, }, a2: { b: 2, }, }, remove(true)), { }));

  it(`can remove in an array`,
    () => assert.deepEqual(evolve_wrap([ { b: 1, }, { b: 2, }, ], remove({ b: 1, })), [ { b: 2, }, ]));

  it(`can remove in an array by index`,
    () => assert.deepEqual(evolve_wrap([ { b: 1, }, { b: 2, }, ], [ { 0: remove(), }, where((key, value) => !!value), ]), [ { b: 2, }, ]));
});
