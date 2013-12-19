var gLastSubmittedText;
var gAssertions;
var gWasSatisfied = false;

// IE8 hack in case I forget to leave some console.log when debugging
if (typeof console == 'undefined') {
  this.console = { log: function() { } };
}

function getCode() {
  var editor = ace.edit("code");
  return editor.getSession().getValue();
}

function submitCode(code) {
  // We already told the user the objectives were satisfied
  // no more server checking for you!
  if (gWasSatisfied)
    return;

  $.ajax({
    url: "/check-code/" + exerciseSlug,
    type: "post",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ code: getCode() }),
    dataType: "json",
    success: function(response) {
      if (response.status === 'okay') {
        if (email) {
          if (response.allSatisfied) {
            gWasSatisfied = true;
            alert('Congratulations, the exercise was marked as complete!');
          }
          else
            alert('The exercise was attempted to be marked as complete, but not all code seems satisfied!');
        } else {
          gWasSatisfied = true;
          alert('Congratulations, the exercise objectives are satisfied!');
        }
      } else {
        alert('There was an error submitting the code: ' + response.reason);
      }
    }
 });
}

function validateAssertions() {
  var code = getCode();
  if (code == gLastSubmittedText) {
    return;
  }
  gLastSubmittedText = code;

  try {
    // TODO: minor opt, don't make a new CodeCheck object each time, and
    // only add/parse assertions once per page.
    var checker = new CodeCheck();
    checker.addAssertions(gAssertions);
    checker.parseSample(code, function(err) { 
      var errLine;
      if (err && err.loc && err.loc.line)
        errLine = err.loc.line;
      updateAssertionResults(errLine, checker.allSatisfied);
    });
  } catch(err) {
    alert(err);
  }
}

function updateAssertionResults(errLine, allSatisfied) {
 // If we're completely satisfied, let the server know so it
  // can do its own check and mark the exercise as complete!
  if (!errLine && allSatisfied) {
    submitCode(code);
  }

  _.each(gAssertions, function(e) {
    if (!e.blacklist) {
      var element = $("#" + e.slug);
      element.html('<i class="fa ' + (e.hit ? 'fa-check' : 'fa-times') + '"></i>  ' +
        e.title + '. ' +
        (e.hit ? '<span class="good">Completed!</span>' : '<span class="bad">Not yet completed.</span>'));
    } else {
      var element = $("#" + e.slug);
      element.html('<i class="fa ' + (e.hit ? 'fa-times' : 'fa-check') + '"></i>  ' +
        e.title + '. ' +
        (e.hit ? '<span class="bad">Oops, please fix</span>' : '<span class="good">So far so good.</span>'));
    }
  });

  var element = $("#no-syntax-errors");
  element.html('<i class="fa ' + (errLine ? 'fa-times' : 'fa-check') + '"></i>' +
    'Do not have any syntax errors' + '.  ' +
    (errLine ? '<span class="bad">Oops, please fix on line: ' + errLine + '.  Above goals will be re-evaluated once fixed.</span>' : '<span class="good">So far so good.</span>'));
}

// This button is just for debugging when setInterval is commented out
$("#check-syntax").click(function() {
  validateAssertions();
});

$(function() {
  var editor = ace.edit("code");
  editor.setTheme("ace/theme/TextMate");
  editor.getSession().setMode("ace/mode/javascript");
});

function beginParse(json) {
  gAssertions = JSON.parse(json);
  if (typeof Worker !== 'undefined') {
    // Check if we have web workers, if we do, do this on a background
    // thread.
    var worker = new Worker('/static/js/exerciseWorker.js');
    worker.addEventListener('message', function(e) {
      switch(e.data.cmd) {
        case 'log':
          console.log(e.data.msg);
        break;
        case 'done':
          gAssertions = e.data.assertions;
          updateAssertionResults(e.data.errLine, e.data.allSatisfied);
          worker.postMessage({cmd: 'start', assertions: gAssertions, code: getCode()});
        break;
      }
    });
    worker.postMessage({cmd: 'start', assertions: gAssertions, code: getCode()});
  } else {
    setInterval("validateAssertions()", 1000);
  }
}
