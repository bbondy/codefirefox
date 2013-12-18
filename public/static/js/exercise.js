var gLastSubmittedText;
var gChecker;
var gAssertions;
var gWasSatisfied = false;

function submitCode(code) {
  // We already told the user the objectives were satisfied
  // no more server checking for you!
  if (gWasSatisfied)
    return;

  $.ajax({
    url: "/check-code/" + exerciseSlug,
    type: "post",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ code: code }),
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
          alert('Congratulations, the exercise objectives are satisfied!');
          gWasSatisfied = true;
        }
      } else {
        alert('There was an error submitting the code: ' + response.reason);
      }
    }
 });
}

function validateAssertions() {
console.log('Validate assertions!');
  var editor = ace.edit("code");
  var code = editor.getSession().getValue();
  if (code == gLastSubmittedText) {
    return;
  }
  gLastSubmittedText = code;

  try {
    // TODO: minor opt, don't make a new CodeChecker object each time, and
    // only add/parse assertions once per page.
    gChecker = new CodeChecker;
    gChecker.addAssertions(gAssertions);
    gChecker.parseSample(code, function(err) {
      // If we're completely satisfied, let the server know so it
      // can do its own check and mark the exercise as complete!
      if (!err && gChecker.allSatisfied) {
        submitCode(code);
      }
      updateAssertionDisplay(err);
    });
  } catch(err) {
    alert(err);
  }
}

function updateAssertionDisplay(err) {
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
  element.html('<i class="fa ' + (err ? 'fa-times' : 'fa-check') + '"></i>' +
    'Do not have any syntax errors' + '.  ' +
    (err ? '<span class="bad">Oops, please fix on line: ' + err.loc.line + '.  Above goals will be re-evaluated once fixed.</span>' : '<span class="good">So far so good.</span>'));
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
  setInterval("validateAssertions()", 1000);
}
