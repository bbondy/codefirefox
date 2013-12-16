"use strict";

var acorn = require('acorn'),
  prettyjson = require('prettyjson');

// Overview:
// This module determines if a set of assertions match a sample of code.
// Assertions are simply just source code templates that are matched against
// the sample of source code.
// An assertion abstract syntax tree (AAST) matches a sample AST (SAST) if:
//  - An AAST's parent node matches any SAST node
//  - Each of the AAST subnodes, match against the children of an SAST node
//  - If there are extra nodes in the AAST that do not match, then this is considered to be not a match.

// Design choice consideration:
// There are at least 2 possible ways you can approach validating assertions to sample code:
// 1) Parse the provided source code and list all combinations of possible matches.
//    Check each assertion against each combination.
//    This has the advantage that the sample code tree is walked only once, but the memory usage
//    and combinations processed get exponentially higher as your program grows depending at what
//    depth new lines of code are added.
// 2) For each asssertion, walk the source to see if it is a match.
//    Restart the parse from the SAST parent node for each assertion.
//    This has the advantage that it doesn't use a lot of memory.  And assuming your
//    number of assertions are constant, you only have to walk the SAST tree a constant
//    amount of times to see if it is a match.


function CodeChecker() {
  this.assertions = [];
  this.state = { };  
}

CodeChecker.prototype = {

  /**
   * Adds an array of assertions and parses their abstract syntax tree.
   *
   * @param codeTemplates An array of code templtes. Each item of the array must
   *                      have a code member and may optionally have extra properties
   *                      which will be preserved.
   */
  addAssertions: function(codeTemplates) {
    codeTemplates.forEach(function(obj) {
      this.addAssertion(obj.code, obj);
    }, this);
  },

  /**
   * Adds an assertion and parses its abstract syntax tree
   *
   * @param code The code for the assertion, the sample code must
   *             match everything, but can match it at any level of code.
   * @param obj  An object for state, each property will be copied to the
   *             assertion, accessible through codeChecker.assertions
   *             This object can also specify a property named skip which
   *             is an array of objects of type: { type : "StatementType", prop: "prop" }.
   *             If specified, the specified attribute on the specified element will be skipped.
   *             This is useful to generalize your assertions.
   *             For more information see:
   *             https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
   * 
   */
  addAssertion: function(code, obj) {
    obj = obj || {};
    obj.code = code;
    obj.codeAAST = acorn.parse(code, {});
    obj.hit = false;
    this.assertions.push(obj);
  },

  /**
   * Clears out all added assertions
   */
  clearAssertions: function() {
    this.assertions = [];
  },

  /**
   * Parse the sample code into an abstract syntax tree and start a recursive
   * walk against all assertions.
   */
  parseSample: function(code, doneParsing) {
    var err;
    try {
      // Assume we hit the assertion until we prove otherwise
      //this.resetAssertions(true); 
      this.sampleCodeTree = acorn.parse(code, {});

      //console.log(prettyjson.render(this.sampleCodeTree));

      // Walk through the sampleCodeTree for each assertion we have
      this.assertions.forEach(function(assertion) {
        //console.log(prettyjson.render(assertion.codeAAST));
        this.processNode(assertion, assertion.codeAAST, this.sampleCodeTree, false, 0, 0, 'loc1');
        assertion.hit = this._isAssertionCompletelySatisfied(assertion.codeAAST);
      }, this);
    } catch (e) {
      console.log(e.stack);
      err = e;;
    }

    doneParsing(err);
  },

  /**
   * Array of members in the abstract syntax tree that have followup nodes
   * The type of each of these will be checked to see if they are an array or
   * an object, and will react respectively.
   */
  recursiveProperties: ['body', 'cases', 'declarations', 'consequent', 'params',
    'defaults', 'expression', 'left', 'right', 'test', 'args', 'init', 'update',
    'finalizer', 'block', 'handler', 'guardedHandlers', 'id', 'argument'],

  /**
   * Performs a recursive walk on the abstract syntax tree for the assertion
   * and the sample tree.
   *
   * @param assertion The assertion currently being checked.
   * @param nodeAAST  The assertion abstract syntax tree
   * @param nodeSAST  The sample abststract syntax tree
   * @param isMatchParse If true will try to match every node exactly
   *                     Everytime there is a potential match we set this to true.
   * @param depthAAST Just used for debugging, stores the depth of recursion
   * @param depthSAST Just used for debugging, stores the depth of recursion
   */
  processNode: function(assertion, nodeAAST, nodeSAST, isMatchParse, depthAAST, depthSAST, recursiveLoc) {
    // Nothing more to do if either of the nodes are null
    if (!nodeAAST || !nodeSAST)
      return;

    //console.log(nodeAAST.type + ' DEPTH ' + depthAAST + ' vs. ' + nodeSAST.type + ' DEPTH: ' + depthSAST + ' LOC: ' + recursiveLoc);

    // Ignore Program nodes for AAST because we want matches to be allowed
    // anywhere, not enforced to be toplevel which all AASTs start with.
    if (nodeAAST.type == 'Program') {
      nodeAAST.body.forEach(function(childNodeAAST) {
        this.processNode(assertion, childNodeAAST, nodeSAST, false, depthAAST + 1, depthSAST, 'loc2');
      }, this);
      return;
    }

    // Normalize statements which have followup block statements
    ['consequent', 'body'].forEach(function(prop) {
      [nodeAAST, nodeSAST].forEach(function(n) {
        if (n[prop] && n.type != 'Program' && n.type != 'BLockStatement' &&
            n[prop].constructor != Array && n[prop].type != 'BlockStatement') {
          n[prop] = { type: 'BlockStatement', body: [ n[prop]] };
        }
      }, this);
    }, this);

    // Check if we want to set isMatchParse
    if (nodeAAST.type == nodeSAST.type) {
      //console.log('HIT THE NODE TYPE: ' + nodeAAST.type);
      // First time match parse, let's reset the nodes!
      if (!isMatchParse) {
        //this._resetSatisfied(assertion.codeAAST);
        isMatchParse = true;
      }
      if (nodeAAST.type == 'Identifier' && nodeAAST.name.substring(0, 2) == '__') {
        // Variable names that you want to strictly enforce must
        // start with __, the prefix is ignored, but is otherwise enforced.
        nodeAAST.hit = nodeAAST.name.substring(2, nodeAAST.name.length) == nodeSAST.name;
      } else {
        nodeAAST.hit = true;
      }
    }

    // If we're doing a 'match parse' (previous nodes matched), bail out  and set
    // hit to false as soon as we find something different.
    if (isMatchParse) {

      // Check types that need to be called recursively
      this.recursiveProperties.forEach(function(prop) {
        if (nodeAAST[prop]) {
          if (assertion.skip) {
            assertion.skip.forEach(function (skipObj) {
              if (skipObj.type == nodeAAST.type && prop == skipObj.prop) {
                this._resetSatisfied(nodeAAST[prop], true);
              }
            }, this);
          }
          if (nodeAAST[prop].constructor == Array) {
            nodeAAST[prop].forEach(function(childAASTNode) {
              nodeSAST[prop].forEach(function(childSASTNode) {
                this.processNode(assertion, childAASTNode, childSASTNode, true, depthAAST + 1, depthSAST + 1, 'loc3')
              }, this);
            }, this);
          } else if (typeof nodeAAST[prop] == 'object') {
            this.processNode(assertion, nodeAAST[prop], nodeSAST[prop], true, depthAAST + 1, depthSAST + 1, 'loc4')
          }
        }
      }, this);
    }

    // If we don't have a match, one of our children might still match it!
    this.recursiveProperties.forEach(function(prop) {
      if (nodeSAST[prop] && nodeSAST[prop].constructor == Array) {
        nodeSAST[prop].forEach(function(childSASTNode) {
          this.processNode(assertion, nodeAAST, childSASTNode, false, depthAAST, depthSAST + 1, 'loc5');
        }, this);
      } else if (nodeSAST[prop] && typeof nodeSAST[prop] == 'object') {
        this.processNode(assertion, nodeAAST, nodeSAST[prop], false, depthAAST, depthSAST + 1, 'loc6');
      }
    }, this);
  },


  /**
   * Determines if a node is hit or not
   *
   * @param The starting node to recurse on
   * @return true if all nodes have the hit property set on them
   */
  _isAssertionCompletelySatisfied: function(node) {
    // When a node is explicitly skipped, don't process its children
    if (node.skipped) {
      return true;
    }
    var allHit = node.hit || node.type == 'Program';
    this.recursiveProperties.forEach(function(prop) {
      if (node[prop] && node[prop].constructor == Array) {
        node[prop].forEach(function(childSASTNode) {
          allHit = allHit && this._isAssertionCompletelySatisfied(childSASTNode);
        }, this);
      } else if (node[prop] && typeof node[prop] == 'object') {
        allHit = allHit && this._isAssertionCompletelySatisfied(node[prop]);
      }
    }, this);
    return allHit;
  },

  /**
   * Resets the node's hit states back to false recursively
   *
   * @param The starting node to recurse on
   */
  _resetSatisfied: function(node, val) {
    if (node.constructor == Array) {
      node.forEach(function(n) {
        this._resetSatisfied(n, val);
      }, this);
      return;
    }

    node.hit = val;
    this.recursiveProperties.forEach(function(prop) {
      if (node[prop] && node[prop].constructor == Array) {
        node[prop].forEach(function(childSASTNode) {
          this._isAssertionCompletelySatisfied(childSASTNode);
        }, this);
      } else if (node[prop] && typeof node[prop] == 'object') {
        this._isAssertionCompletelySatisfied(node[prop]);
      }
    }, this);
  },
};

// Export the object prototype, users who use this module should use:
// CodeChecker = require(code_checker); var codeChecker = new CodeChecker();
module.exports = CodeChecker;
