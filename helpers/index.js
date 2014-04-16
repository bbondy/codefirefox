"use strict";

exports.formatTimeSpan = function(firstDate, secondDate, includeExcessiveDetail, hideSeconds) {
  const SECOND = 1000,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR;

  // Calculate the time diffs
  let diffTime = secondDate.getTime() - firstDate.getTime(),
    diffDays = (diffTime / DAY) | 0,
    diffHours = (diffTime % DAY/ HOUR) | 0,
    diffMinutes = (diffTime % DAY % HOUR/ MINUTE) | 0,
    diffSeconds = (diffTime % DAY % HOUR % MINUTE / SECOND) | 0,
    // Reduce the time diffs and their suffixes to a string
    suffixes = ['day', 'hour', 'minute', 'second'],
    timeDiffs = [diffDays, diffHours, diffMinutes, diffSeconds];
  
  if (!includeExcessiveDetail) {
    // If we have days or hours, don't show seconds
    if (diffDays != 0 || diffHours != 0 || hideSeconds) {
      suffixes.pop();
      timeDiffs.pop();
    }
    // If we have one day or more then don't show minutes
    if (diffDays != 0) {
      suffixes.pop();
      timeDiffs.pop();
    }
  }

  let str = timeDiffs.reduce(function (e1, e2, i) {
    let str = e1,
      suffix = suffixes[i];
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
