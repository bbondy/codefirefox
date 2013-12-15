"use strict";

var acorn = require('acorn'),
  Promise = require('promise'), 
  prettyjson = require('prettyjson');

acorn.walk = require("../node_modules/acorn/util/walk.js");

function CodeChecker() {
  this.assertions = [];
  this.state = { };  
  this.parseItPromise = Promise.denodeify(this.parseIt).bind(this);
  this.addAssertionPromise = Promise.denodeify(this.addAssertion).bind(this);
  this.addAssertionsPromise = Promise.denodeify(this.addAssertions).bind(this);
}

CodeChecker.prototype = {

  /**
   * Recursively adds each assertion, and calls the callback when
   * all assertions are parsed and added.
   *
   * @param codeArray An array of objects each containing at least a code property
   * @param obj An object with extra properties to pass along
   * @callback A function to call when all assertions are added
   */
  addAssertions: function addAssertions(codeArray, callback) {
    if (codeArray.length == 0) {
      callback();
      return;
    }
    var assertionObj = codeArray.pop();
    var self = this;

    self.addAssertion(assertionObj.code, assertionObj, function() {
      self.addAssertions(codeArray, callback);
    });
  },

  /**
   * Starts a parse of the template code and adds it to the list of assertions
   * to check when parsing the mian code.
   *
   * @param code The code assertion to test for
   */
  addAssertion: function(code, obj, callback) {
    console.log('add assertion for slug: ' + obj.slug);
    obj = obj || {};
    obj.assertionParse = true;
    obj.testAgainstLists = false;
    obj.callback = callback;
    this._startParsing(code, obj);
  },

  /**
   * Helper function for parsing the user's source.
   * Calls into acorn.walk and is used by: the assertion adding
   * and user source parsing.
   */
  _startParsing: function(source, extraState) {
    var codeTree = acorn.parse(source, {});
    this.state.context = '';
    
    // Copy in the extra state into the state variable
    for (var prop in extraState) {
      this.state[prop] = extraState[prop];
    }

    // Setup callback functions used for parsing elements into a rough
    // simplified model of what the program actually does.
    this._callbackFunctions = {
      Program: this._parseBlockStatement.bind(this),
      BlockStatement: this._parseBlockStatement.bind(this),
      Function: this._parseStatementWithFollowup.bind(this),
      IfStatement: this._parseStatementWithFollowup.bind(this),
      ForStatement: this._parseStatementWithFollowup.bind(this),
      ForInStatement: this._parseStatementWithFollowup.bind(this),
      DoWhileStatement: this._parseStatementWithFollowup.bind(this),
      WhileStatement: this._parseStatementWithFollowup.bind(this),
      VariableDeclaration: this._parseSimpleStatement.bind(this),
      AssignmentExpression: this._parseSimpleStatement.bind(this),
      UpdateExpression: this._parseSimpleStatement.bind(this),
      BreakStatement: this._parseSimpleStatement.bind(this),
      ContinueStatement: this._parseSimpleStatement.bind(this),
      ReturnStatement: this._parseSimpleStatement.bind(this),
      EmptyStatement: this._parseSimpleStatement.bind(this)
    };

    //console.log(prettyjson.render(this.parsed));
    // Start the recursive walk
    acorn.walk.recursive(codeTree, this.state, this._callbackFunctions, null);
  },


  /**
   * Resets each item in the assertion list to not hit
   */
  _resetList: function() {
    this.assertions.forEach(function(e) {
      e.hit = false;
    });
  },

  /**
   * Performs a test from the assertions against the provided source.  
   * It is called on each combination of the provided source.
   */
  _testAgainst: function(codeToTest, state) {
    if (!state.testAgainstLists) {
      return;
    }

    this.assertions.forEach(function(e) {
      if (e.code == codeToTest) {
        e.hit = true;
      }
    }, this);
  },

  /**
   * Parses a node that has a single statement followup, example: IfStatement, ForStatement
   */
  _parseStatementWithFollowup: function(node, state, c) {
    // Setup a fake block if we don't have one
    var childNode = node.consequent || node.body;
    if (childNode.type == 'BlockStatement') {
      childNode.type = node.type;
      this._callbackFunctions.BlockStatement(childNode, state, c);
    // Otherwise process the block directly
    } else {
      var blockNode = {
        body: [childNode],
        type: node.type
      };
      this._callbackFunctions.BlockStatement(blockNode, state, c);
    }
  },

  /**
   * Parses a node that contains multiple other nodes, example: Program, BlockStatement
   */
  _parseBlockStatement: function (node, state, c) {
    var baseContext = node.type;
    var newContext = [];

    // Parse each child node
    var allSource = '';
    node.body.forEach(function (e) {
      c(e, state);
      state.context = state.context || [ '' ];
      state.context.forEach(function(childContext) {
        allSource += childContext;
        var newContextStr = node.type + '\n' + childContext;
        newContextStr = newContextStr.replace(/\n/g, '\n  ');
        newContext.push(newContextStr);
        this._testAgainst(newContextStr, state);
      }, this);
    }, this);

    // If we are parsing the program node, we're done parsing
    // so setup the assertions list if this was an assertions parse, and
    // call the callback.
    if (node.type == 'Program') {
      if (state.assertionParse) {
        console.log('blacklist: ' + state.blacklist);
        this.assertions.push( { code: allSource,
                                hit: false,
                                title: state.title,
                                slug: state.slug,
                                blacklist: state.blacklist
                               });
      } 

      if (state.callback) {
        state.callback(null, { state: state,
                               assertions: this.assertions,
                              });
      }
    }
    state.context = newContext;
  },

  /**
   * Parses a simple statement with no special handling
   */
  _parseSimpleStatement: function(node, state, c) {
    state.context = [ node.type ];
    this._testAgainst(node.type, state);
  },

  /**
   * Start enumerating the combination of things being done
   */
  parseIt: function(source, doneParsing) {
    this._resetList();
    this._startParsing(source, {
      testAgainstLists: true,
      assertionParse: false,
      callback: doneParsing
    });
  },
};

// Export the object prototype, users who use this module should use:
// CodeChecker = require(code_checker); var codeChecker = new CodeChecker();
module.exports = CodeChecker;
