var gLastSubmittedText;

function checkSyntax() {
  var editor = ace.edit("code");
  var code = editor.getSession().getValue();
  if (code == gLastSubmittedText) {
    return;
  }

  gLastSubmittedText = code;
  $.ajax({
    url: "/check-code",
    type: "post",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ code: code }),
    dataType: "json",
    success: function(response) { 
      if (response.whitelist && response.whitelist.length) {
        // Format the whitelist
        response.whitelist.forEach(function(e) {
          var element = $("#" + e.slug);
          if (!element.length) {
            element = $("<li/>").attr('id', e.slug);
            element.appendTo("#whitelist");
          }
          element.html('<i class="fa ' + (e.hit ? 'fa-check' : 'fa-times') + '"></i>  ' +
            e.title + '.  ' +
            (e.hit ? '<span class="good">Completed!</span>' : '<span class="bad">Not yet Completed.') );
        });
      }

      if (response.blacklist && response.blacklist.length) {
        // Format the blacklist
        response.blacklist.forEach(function(e) {
          var element = $("#" + e.slug);
          if (!element.length) {
            element = $("<li/>").attr('id', e.slug);
            element.appendTo("#blacklist");
          }
          element.html('<i class="fa ' + (e.hit ? 'fa-times' : 'fa-check') + '"></i>  ' +
            e.title + '.  ' +
            (e.hit ? '<span class="bad">Oops, please fix</span>' : '<span class="good">So far so good.</span>'));
        });

      }
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

$("#check-syntax").click(function() {
  checkSyntax();
});

$(function() {
  setInterval("checkSyntax();", 1000);
  //setInterval("checkSyntax();", 1000);
});
