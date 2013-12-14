"use strict";

exports.formatTimeSpan = function(firstDate, secondDate, includeExcessiveDetail) {
  var SECOND = 1000;
  var MINUTE = 60 * SECOND;;
  var HOUR = 60 * MINUTE;
  var DAY = 24 * HOUR;

  // Calculate the time diffs
  var diffTime = secondDate.getTime() - firstDate.getTime();
  var diffDays = (diffTime / DAY) | 0;
  var diffHours = (diffTime % DAY/ HOUR) | 0;
  var diffMinutes = (diffTime % DAY % HOUR/ MINUTE) | 0;
  var diffSeconds = (diffTime % DAY % HOUR % MINUTE / SECOND) | 0;

  // Reduce the time diffs and their suffixes to a string
  var suffixes = ['day', 'hour', 'minute', 'second']
  var timeDiffs = [diffDays, diffHours, diffMinutes, diffSeconds];
  
  if (!includeExcessiveDetail) {
    // If we have days or hours, don't show seconds
    if (diffDays != 0 || diffHours != 0) {
      suffixes.pop();
      timeDiffs.pop();
    }
    // If we have one day or more then don't show minutes
    if (diffDays != 0) {
      suffixes.pop();
      timeDiffs.pop();
    }
  }

  var i = 0;
  var str = timeDiffs.reduce(function (e1, e2) {
    var str = e1;
    
    var suffix = suffixes[i++];
    // If the other element is non 0, then include it in the span string
    if (e2 !== 0) {
      if (str)
        str += ', '; // coma separate if needed
      str += e2 + ' ' + suffix;
      if (e2 != 1)
        str += 's'; // append s to the suffix
    }

    return str;
  }, '');

  if (!str)
    return  '0 ' + suffixes[suffixes.length - 1] + 's'
  return str;
};
