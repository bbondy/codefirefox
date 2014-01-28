/**
 * @jsx React.DOM
 */

 "use strict";

define(['react'], function(React) {
  var GravatarIcon = React.createClass({
    render: function() {
      if (!this.props.size)
        this.props.size = 80;

      var url = 'http://www.gravatar.com/avatar/' + this.props.emailHash + '?s=' + this.props.size;
      if (this.props.url) {
        return (
          <div>
            <a href={this.props.url} target='_blank'><img src={url} className='gravatar-image' /></a>
          </div>
        );
      } else {
        return (
          <div>
            <img src={url} className='gravatar-image' />
          </div>
        );
      }
    }
  });

  return GravatarIcon;
});
