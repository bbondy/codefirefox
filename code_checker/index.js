var acorn = require('acorn'),
  prettyjson = require('prettyjson');

acorn.walk = require("../node_modules/acorn/util/walk.js");

function CodeChecker() {
  this.whitelist = [];
  this.blacklist = [];
  this.state = { self: this };
  
  // Setup callback functions used for parsing elements into a rough
  // simplified model of what the program actually does.
  this._callbackFunctions = {
    Program: this._parseBlockStatement,
    BlockStatement: this._parseBlockStatement,
    IfStatement: this._parseStatementWithFollowup,
    ForStatement: this._parseStatementWithFollowup,
    VariableDeclaration: this._parseSimpleStatement,
    AssignmentExpression: this._parseSimpleStatement,
    EmptyStatement: this._parseSimpleStatement
  };
  //console.log(prettyjson.render(this.parsed));
}

CodeChecker.prototype = {
  /**
   * Starts a parse of the template code and adds it to the whitelist
   * Note: Even if the user's source code changes, this is only parsed once.
   *
   * @param obj An object with a code property which contains a string of the code
   */
  addSampleToWhitelist: function(obj) {
    obj.addToWhitelist = true;
    obj.addToBlacklist = false;
    obj.testAgainstLists = false,
    this._startParsing(obj.code, obj);
  },

  /**
   * Starts a parse of the template code and adds it to the blacklist
   * Note: Even if the user's source code changes, this is only parsed once.
   *
   * @param obj An object with a code property which contains a string of the code
   */
  addSampleToBlacklist: function(obj) {
    obj.addToWhitelist = false;
    obj.addToBlacklist = true;
    obj.testAgainstLists = false,
    this._startParsing(obj.code, obj);
  },

  /**
   * Helper function for parsing the user's source.
   * Calls into acorn.walk and is used by: the whitelist adding, blacklist adding,
   * and user source parsing.
   */
  _startParsing: function(source, extraState) {
    var codeTree = acorn.parse(source, {});
    console.log('code Tree: ' + codeTree);
    this.state.context = '';
    
    // Copy in the extra state into the stae variable
    for (var prop in extraState) {
      this.state[prop] = extraState[prop];
    }

    // Start the recursive walk
    acorn.walk.recursive(codeTree, this.state, this._callbackFunctions, null);
  },


  /**
   * Resets each item in the white and black list to not hit
   *
   * @param arr A whitelist or blacklist to reset
   */
  _resetList: function(arr) {
    arr.forEach(function(e) {
      e.hit = false;
    });
  },

  /**
   * Performs a test from the white list and black list against the
   * provided source.  It is called on each combination of the provided source.
   */
  _testAgainst: function(codeToTest, state) {
    if (!state.testAgainstLists) {
      console.log('skipping test against lists');
      return;
    }

    console.log('Processing test against lists');
    // Go through both the whitelist and the blacklist
    [state.self.whitelist, state.self.blacklist].forEach(function(arr) {
      console.log('Checking for matches!!');

      // Go through each element of the list and mark it as hit if a match
      // is found.
      arr.forEach(function(e) {
        console.log("Checking to see if ------" + e.code + ' === ' + codeToTest + '-----...');
        if (e.code == codeToTest) {
          console.log('match was found!');
          e.hit = true;
        }
      });
    });
  },

  /**
   * Parses a node that has a single statement followup, example: IfStatement, ForStatement
   */
  _parseStatementWithFollowup: function(node, state, c) {
    // Setup a fake block if we don't have one
    var childNode = node.consequent || node.body;
    if (childNode.type == 'BlockStatement') {
      childNode.type = node.type;
      this.BlockStatement(childNode, state, c);
    // Otherwise process the block directly
    } else {
      var blockNode = {
        body: [childNode],
        type: node.type
      };
      this.BlockStatement(blockNode, state, c);
    }
  },

  /**
   * Parses a node that contains multiple other nodes, example: Program, BlockStatement
   */
  _parseBlockStatement: function (node, state, c) {
    console.log('block statement');
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
        state.self._testAgainst(newContextStr, state);
      });
    });

    // Check if we need to add the modelt to the whitelist
    // or black list if we are parsing the Program node.
    if (node.type == 'Program') {
      if (state.addToWhitelist) {
        state.self.whitelist.push( { code: allSource,
                                     hit: false,
                                     title: state.title,
                                     slug: state.slug
                                   });
      } else if (state.addToBlacklist) {
        console.log('====adding to black list');
        state.self.blacklist.push( { code: allSource,
                                     hit: false,
                                     title: state.title,
                                     slug: state.slug
                                   });
      }

      if (state.callback) {
        state.callback(state);
      }
    }
    state.context = newContext;
  },

  /**
   * Parses a simple statement with no special handling
   */
  _parseSimpleStatement: function(node, state, c) {
    state.context = [ node.type ];
    state.self._testAgainst(node.type, state);
  },

  /**
   * Start enumerating the combination of things being done
   */
  parseIt: function(source, doneParsing) {

    [this.whitelist, this.blacklist].forEach(this._resetList);
    this._startParsing(source, {
      testAgainstLists: true,
      addToWhitelist: false,
      addToBlacklist: false,
      callback: doneParsing
    });
  },
};

// Export the object prototype, users who use this module should use:
// CodeChecker = require(code_checker); var codeChecker = new CodeChecker();
module.exports = CodeChecker;
