$(document.links).filter(function() {
    return this.hostname != window.location.hostname;
}).attr('target', '_blank');

/* Persona/Browser ID stuff */

$('#login').click(function() {
  navigator.id.request();
});

$('#logout').click(function() {
  console.log('logging out!');
  $.ajax({
    url: '/persona/logout',
    type: 'POST',
    success: function(response) {
      console.log('reporting logout for user: ' + email);
      if (location.pathname.substring(0, 6) != '/stats' && 
          location.pathname.substring(0, 6) != '/admin') {
        console.log('reloading because pathname is: ' + location.pathname.substring(0, 6));
        location.reload(); 
      } else {
        console.log('redirecting to /');
        location.href = '/';
      }
    }
  });
  navigator.id.logout();
});

$('#del-stats').click(function() {
  if (!confirm('Are you sure you want to completely nuke all of your user data?')) {
    return;
  }

  $.ajax({
    url: '/stats',
    type: 'DELETE',
    contentType: 'application/json',
    dataType: 'json',
    success: function(response) {
      if (response.status === 'okay') {
        console.log('Data was successfully deleted');
        $('#logout').click();
      }
    }
  });
});

$('#subtitles').click(function() {
  document.cookie = "useAmara=1";
  location.reload();
});

$('#no-subtitles').click(function() {
  document.cookie = "useAmara=0";
  location.reload();
});

$(function() {
  // By default, express-persona adds the users email address to req.session.email when their email is validated.
  navigator.id.watch({
    onlogin: function(assertion) {
      console.log('onlogin');
      // Check for already logged in
      if (email) {
        return;
      }
      $.ajax({
        url: '/persona/verify',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({assertion: assertion}),
        success: function(response) {
          if (response.status === 'okay') {
            console.log('reporting login for user: ' + email);
            location.reload(); 
          }
        }
      });
    },

    onlogout: function() {
      // For some reason we're getting onlogout calls when we shouldn't.
      // To avoid this I put the actual xhr calls inside the logout button
      // handler.
      if (!email) {
        console.log('persona calling onlogout with known email');
      } else {
        console.log('persona calling onlogout with unknown email');
      }
    }
  });
});
