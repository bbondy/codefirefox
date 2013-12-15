var gLastSubmittedText;

function checkSyntax() {
  var editor = ace.edit("code");
  var code = editor.getSession().getValue();
  if (code == gLastSubmittedText) {
    return;
  }

  gLastSubmittedText = code;
  $.ajax({
    url: "/check-code/" + exerciseSlug,
    type: "post",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ code: code }),
    dataType: "json",
    success: function(response) { 
      response.assertions = response.assertions || [];

      // Format the whitelist
      response.assertions.forEach(function(e) {

        if (!e.blacklist) {
          var element = $("#" + e.slug);
          element.html('<i class="fa ' + (e.hit ? 'fa-check' : 'fa-times') + '"></i>  ' +
            '<span>' + e.title + '.  </span>' +
            (e.hit ? '<span class="good">Completed!</span>' : '<span class="bad">Not yet completed.') );
        } else {
          var element = $("#" + e.slug);
          element.html('<i class="fa ' + (e.hit ? 'fa-times' : 'fa-check') + '"></i>  ' +
            e.title + '.  ' +
            (e.hit ? '<span class="bad">Oops, please fix</span>' : '<span class="good">So far so good.</span>'));
        }
      });

      if (response.status == "okay") {
      } else {
        console.log('Syntax Error on line: ' + response.reason.loc.line +
                    ', column: ' + response.reason.loc.column);
      }
    },
    failure: function(errMsg) {
      alert('err: ' + errMsg);
    }
  });
}

// This button is just for debugging when setInterval is commented out
$("#check-syntax").click(function() {
  checkSyntax();
});

$(function() {
  var editor = ace.edit("code");
  editor.setTheme("ace/theme/TextMate");
  editor.getSession().setMode("ace/mode/javascript");
  setInterval("checkSyntax();", 1000);
});
