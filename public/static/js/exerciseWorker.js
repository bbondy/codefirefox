window = this; // Trick CodeCheck into knowing this is clientside

// Hack in a console.log
if (typeof console == 'undefined') {
  this.console = {
    log: function(msg) {
      window.postMessage({cmd: 'log', msg: 'thread: ' + msg});
    }
  };
}

importScripts('/static/js/acorn.js',
  '/static/js/underscore-min.js',
  '/static/js/codecheck.js');

self.addEventListener('message', function(e) {
  switch (e.data.cmd) {
    case 'start':
      self.assertions = e.data.assertions;
      self.code = e.data.code;
      setTimeout("self.validateAssertions()", 200);
      break;
    case 'stop':
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage({ status: 'failure', 
                         err: 'Unknown command: ' + e.data.cmd});
  };
}, false);


self.validateAssertions = function() {
  try {
    var checker = new CodeCheck();
    checker.addAssertions(self.assertions);
    checker.parseSample(self.code, function(err) {
      var errLine;
      if (err && err.loc && err.loc.line)
        errLine = err.loc.line;
      self.postMessage({ cmd: 'done',
                         status: 'okay',
                         allSatisfied: checker.allSatisfied,
                         assertions: checker.assertions,
                         errLine: errLine
                       });
    });
  } catch(err) {
    console.log('the err: ' + err + ' was thrown');
    self.postMessage({ status: 'failure',
                       allSatisfied: false,
                     });
  }
}
