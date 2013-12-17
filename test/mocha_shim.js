var passCount = 0, failCount = 0;

var tests = [];
function describe(desc, c) {
  c();
}

function it(desc, c) {
  tests.push({desc: desc, c: c });
}

this.assert = {};
assert.ok = function(test) {
  if (test)
    passCount++;
  else
    failCount++;
}

var require = function() { };

assert.equal = function(a, b) {
  if (a === b)
    passCount++;
  else
    failCount++;
}
