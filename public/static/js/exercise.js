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
          element.html(e.title + '.  ' +
            (e.hit ? 'Completed!' : 'Not yet Completed.') );
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
          element.html(e.title + '.  ' +
            (e.hit ? 'Oops, please fix' : 'So far so good.'));
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
