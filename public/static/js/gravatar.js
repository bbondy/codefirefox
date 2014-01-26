/**
 * @jsx React.DOM
 */

define(['react'], function(React) {
  var GravatarIcon = React.createClass({
    render: function() {
      if (!this.props.size)
        this.props.size = 80;
      if (!this.props.url)
        this.props.url = 'http://gravatar.com/';

      var url = 'http://www.gravatar.com/avatar/' + this.props.emailHash + '?s=' + this.props.size;
      return (
        <div>
          <a href={this.props.url} target='_blank'><img src={url} className='gravatar-image' /></a>
        </div>
      );
    }
  });

  return GravatarIcon;
});
