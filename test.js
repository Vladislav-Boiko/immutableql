const expect = require('expect');
const deepcopy = require('deepcopy');

const { evolve, where, spread, alter, merge, } = require('./');

// For testing purposes checks that we didn't change the original object.
const evolve_wrap = (original, changes) => {
  const stay_unchanged = deepcopy(original);
  const changed = evolve(original, changes);
  expect(original).toEqual(stay_unchanged);
  return changed;
};

describe('Evolve function', () => {
  it(`copies the original object`, () => { 
      expect(evolve_wrap({ a: 1, b: 2, })).toEqual({ a: 1, b: 2, });
      let first = { a: 1, b: 2, };
      let second = evolve_wrap({ a: 1, b: 2, });
      first.a = 2;
      expect(first).toNotEqual(second);
    });

  it(`replaces values with literals`,
    () => expect(evolve_wrap({}, 2)).toEqual(2));

  it(`replaces null with literals`,
    () => expect(evolve_wrap(null, 2)).toEqual(2));

  it(`replaces undefined with literals`,
    () => expect(evolve_wrap(null, 2)).toEqual(2));

  it(`replaces values with objects,`,
    () => expect(evolve_wrap({ a: 1, }, { a: { b: { c: 2, }, }, })).toEqual({ a: { b: { c: 2, }, }, }));

  it(`replaces nested values with objects,`,
    () => expect(evolve_wrap({ a: { b: 2, }, }, { a: { b: { c: { d: 3, }, }, }, })).toEqual({ a: { b: { c: { d: 3, }, }, }, }));

  it(`treats literals as alters`,
    () => expect(evolve_wrap({}, { a: 2, })).toEqual({ a: 2, }));

  it(`treats arrays as alters`,
    () => expect(evolve_wrap({}, { a: [ 2, 3,], })).toEqual({ a: [ 2, 3, ], }));

  it(`can evolve an array by index`, () => {
    expect(evolve_wrap([], { 0: 2, })).toEqual([ 2, ])
    expect(evolve_wrap([], { 2: 2, })).toEqual([ ,,2, ])
  });
});

describe('where', () => {
  it(`can where key literals`,
    () => expect(evolve_wrap({ a: 1, b: 2, c: 3, }, { b: 4, })).toEqual({ a: 1, b: 4, c: 3, }));

  it(`can where keys`,
    () => expect(evolve_wrap({ a: 1, b: 2, c: 3, }, { [where((key) => key > 'a')]: 4, })).toEqual({ a: 1, b: 4, c: 4, }));

  it(`can where values`,
    () => expect(evolve_wrap({ a: 1, b: 2, c: 3, }, where((key, value) => value > 1))).toEqual({ b: 2, c: 3, })); 

  it(`can where arrays`,
    () => expect(evolve_wrap([ { a: 1, }, { a: 2, }, { a: 3, }, ], where((key, value) => value.a > 2))).toEqual([ { a: 3, }, ]));

  it(`cat where netsted arrays`,
    () => expect(evolve_wrap({ a: [ { b: 1, }, { b: 2 }, ], }, 
      { a: {
        [where((key, value) => value.b > 1)]:
          { c: 3, }
        },
      })).toEqual({ a: [ { b: 1, }, { b: 2, c: 3 }, ], }));
});

describe('spread', () => {
  it(`can spread keys`,
    () => expect(evolve_wrap({ a: 1, }, { [spread([ 'b', 'c', ])]: null, })).toEqual({ a: 1, b: null, c: null, }));

  it(`can spread keys with array values`,
    () => expect(evolve_wrap({ a: [], }, { [spread([ 'b', 'c', ])]: 1, })).toEqual({ a: [], b: 1, c: 1, }));

  it(`can spread without overriding`,
    () => expect(evolve_wrap({ a: 1, }, { [spread([ 'a', 'b', ], true)]: 2, })).toEqual({ a: 1, b: 2, }));

  it(`can spread with overriding`,
    () => expect(evolve_wrap({ a: 1, }, { [spread([ 'a', 'b', ])]: 2, })).toEqual({ a: 2, b: 2, }));

  it(`can simply spread an array`,
    () => expect(evolve_wrap([ 1, 2, 3, ], spread([ 4, 5, 6, 7, ]))).toEqual([ 1, 2, 3, 4, 5, 6, 7, ]));

  it(`can spread an array by index`, 
    () => expect(evolve_wrap([], { [spread([ 0, 3, 4, ])]: 1, })).toEqual([ 1,,,1,1, ]));

  it(`can soft spread arrays by index`, 
    () => expect(evolve_wrap([ 7, 7, 7, ], { [spread([ 0, 3, 4, ], true)]: 1, })).toEqual([ 1,7,7,1,1, ]))

});

describe('alter', () => {
  it(`can alter the original object`,
    () => expect(evolve_wrap({}, alter((value) => ({ a: 1, })))).toEqual({ a: 1, }));

  it(`can alter a value in an object`,
    () => expect(evolve_wrap({ a: 10, }, { a: alter((key, value) => value + 1) })).toEqual({ a: 11, }));

  it(`can alter a value in an array`,
    () => expect(evolve_wrap([ 1, 2, ], alter((key, value) => [ ...value, 3, ]) )).toEqual([ 1, 2, 3, ]));
  
  it(`can do the basic array alteration operations`, () => {
    expect(evolve_wrap([ 1, 2, ], alter((key, value) => { value.push(3); return value; }) )).toEqual([ 1, 2, 3, ]);
    expect(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.slice(1)) )).toEqual([ 2, 3, ]);
    expect(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.filter((e) => e > 2)) )).toEqual([ 3, ]);
    expect(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.map((e) => 4)) )).toEqual([ 4, 4, 4, ]);
    expect(evolve_wrap([ 1, 2, 3, ], alter((key, value) => value.reduce((sum, e) => sum + e), 0) )).toEqual(6);
  });

  it(`can alter an array as a property`,
    () => expect(evolve_wrap({ a: [ 1, 2, 3, ], }, { a: alter((key, value) => [ ...value, 4, ])})).toEqual({ a: [ 1, 2, 3, 4, ], }));
});

describe(`merge`, () => {
  it(`can merge objects`, () => {
    const to_merge_with = { a: 4, b: 5, d: 6, };
    expect(evolve_wrap({ a: 1, b: 2, c: 3, },
    { [merge(to_merge_with, true)]: alter((key, original_value) => (original_value || 0) + (to_merge_with[key] || 0)) }
    )).toEqual({ a: 5, b: 7, c: 3, d: 6, })
  });

  it(`can merge with override`,
    () => expect(evolve_wrap({ a: 1, b: 2, c: 3, }, merge({ a: 3, b: 3, }))).toEqual({ a: 3, b: 3, c: 3, }));

  it(`can merge without override`,
    () => expect(evolve_wrap({ a: 1, b: 2, c: 3, }, merge({ a: 3, b: 3, }, true))).toEqual({ a: 1, b: 2, c: 3, }));
});

describe('nesting capabilities', () => {
  it(`can nest trivial`,
    () => expect(evolve_wrap({ a: { b: 1, }, }, { a: { b: 2, }, })).toEqual({ a: { b: 2, }, }));

  it(`can sequence trivial`,
    () => expect(evolve_wrap({ a: 1, }, { a: 2, b: 3, c: 4, })).toEqual({ a: 2, b: 3, c: 4, }));

  it(`can nest changes requests`,
    () => expect(evolve_wrap(
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
      }))
    .toEqual(
      { a:
        { b:
          { c:
            { d :
              { e: 11, },
            } 
          },
        },
      },
      ));

  it(`can combine where and alter`,
    () => expect(evolve_wrap([ { a: 1, }, { a: 2, }, { a: 3, }],
      { [where((key, value) => value.a > 1)]: 
          { a : alter((key, value) => value * value), },
      }
    )).toEqual([ { a: 1, }, { a: 4, }, { a: 9, }, ]));

  it(`can sequence complex requests`,
    () => expect(evolve_wrap(
      {
        a: 1,
      },
      {
        [spread(['b', 'c', 'd',])]: 0,
        [where((key) => key > 'b')]: 2,
        [where((key, value) => key < 'd' && value > 1)]: 3,
        d: 4,
        e: { f: 5, },
        [where((key) => key > 'd')]: { f: alter((key, value) => value + 1 ), },
      }
    )).toEqual({ a: 1, b: 0, c: 3, d: 4, e: { f: 6, } }));

  it(`can sequence and nest complex requests`,
    () => expect(evolve_wrap(
      {
        a: 1,
      },
      {
        [spread(['b', 'c', 'd',])]: 0,
        [where((key) => key > 'b')]: alter((key, value) => ({ e: value + 1, f: value + 2, })),
        d: { f: 3, },
      }
    )).toEqual({ a: 1, b: 0, c: { e: 1, f: 2, }, d: { e: 1, f: 3, }, }));
});
