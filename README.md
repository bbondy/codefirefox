Code Firefox
===========

Video tutorial site for coding Firefox and other Mozilla related technology

Setting up this project
=======================

1. Fork ```bbondy/codefirefox``` to ```user/codefirefox```
2. Run ```git clone https://github.com/user/codefirefox``` in the required directory.
3. ```cd codefirefox``` , Move present working directory to ```codefirefox```
4. Install and setup redis
5. Run redis-server passing in the command line: redis.conf (listens on port 10226)
6. Copy data/conf.json.sample to data/conf.json, modify it appropriately
7. Install node.js (Current Version: v0.10.20)
8. Run: ```npm install``` in the source code directory
9. Run: ```node app```
10. Once the server is running visit ```localhost:22935/initVideoData```
11. Browser to ```localhost:22935/videos``` to see all of the data or ```localhost:22935/slug``` to see a specific video


Exercise module
===============

The exercise module can be used either client or server side.
Client side supports all modern browser, and also IE8+.

The module is called CodeChecker and it gives the ability to check
a list of whitelist code snippets and blacklist code snippets against
a sample of code.

Each whitelist and blacklist item is generalized to an assertion.
Each assertion is itself a mini JavaScript program to match the structure
of the sample code against.

The API is very simple. It has 2 important methods:

1. `addAssertion` which takes in a sample of code to match again. It also
   takes in an extra object which can carry extra state.
2. `parseSample` which parses the sample and performs a match against all
   added assertions.  Its callback passes an error if one occurs.

The API has 2 important members which should be used after a parseSample call:

1. `assertions` holds an array of assertions that were added. Each one has a `hit` property. This property does not take into consideration if the item is marked as a whitelist or blacklist item.
2. `allSatisfied` will hold true if all whitelist items are matched, and all blacklist items are NOT matched.

**Example Usage of the API:**

    var checker = new CodeChecker();
    checker.addAssertion("x = 3;");
    checker.addAssertion("x++", { blacklist: true, otherProps: "hi" });
    checker.parseSample("if (x) { x = 3; }", function(err) {
      console.log('whitelist hit? ' + checker.assertions[0].hit);
      console.log('blacklist hit? ' + checker.assertions[1].hit);
    });

**Dependencies:**

- acorn.js
- underscore
- promise (server side only)

**Demo:**

http://codefirefox.com/exercise/intro-exercise

**Tests:**

Client side tests for the exercise module can also be run simply by
loading ../test/clientside.html on the browser you want to test the exercise
framework against.

Server side tests are included in the parent module tests


**Assertions:**

Each assertion will match as long as it appears somewhere in the sample of
code.  Even an assertion like `while (x) break;`  will match even if there
is an if statement before the break on the sample code.

Identifier names are ignored unless an `__` prefix is added in the assertion.
If an `__` prefix is found, the identifier name will be matched, but the `__` prefix will be dropped.

An extra property of skip can also be provided for advanced filtering.
It takes a list of abstract node types and properties to ignore and auto-match.

    assertion.skip = [{"type" : "ForInStaTement", "prop": "left"}, {"type" : "ForInStatement", "prop": "right"}]
 

Running tests
=============

Tests are run using the Mocha framework. To get tests working just run:

```npm test````

Setting up redis on Windows
===========================

1. Extract `third_party/redisbin.zip` to a folder on your Desktop
2. Copy `third_party/redis-win/redis.conf` to that same folder on your Desktop

Setting up redis otherwise
===========================

1. See per platform instructions, but use the redis.conf from third_party/redis-win/redis.conf


Proxy note
==========

Note : In case you are behind a proxy connection, before running ```npm install``` run the following command.
```npm config set proxy http://<proxy_name or proxy_url>:<port_number>```

Versions
========

Install node.js (Current Version: v0.10.20)
redis-server: https://github.com/MSOpenTech/redis/ (Windows based on Redis 2.6. The latest version merged in 2.6.12)
