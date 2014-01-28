/**
 * @jsx React.DOM
 */

define(['react', 'jsx!gravatar'], function(React, GravatarIcon) {

  var UserInfoBox = React.createClass({
    getInitialState: function() {
      return { data: [] };
    },
    handleSubmit: function(userInfo) {
      this.setState({data: userInfo});
      $.ajax({
        url: this.props.url,
        dataType: 'json',
        type: 'POST',
        data: userInfo,
        success: function(data) {
          //this.setState({data: data});
        }.bind(this)
      });
    },
    loadFromServer: function() {
      $.ajax({
        url: this.props.url,
        dataType: 'json',
        success: function(data) {
          this.setState({data: data});
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    },
    componentWillMount: function() {
      this.loadFromServer();
    },
    render: function() {
      return (
        <div className='userInfoBox'>
          <h1>User Information</h1>
          <UserInfoForm 
            onUserInfoSubmit={this.handleSubmit}
            userInfo={this.state.data}
          />
        </div>
      );
    } 
  });

  /**
   * Renders a form for the user information
   */
  var UserInfoForm = React.createClass({
    handleSubmit: function() {
      var displayName = this.refs.displayName.getDOMNode().value.trim();
      var website = this.refs.website.getDOMNode().value.trim();
      this.props.onUserInfoSubmit({ displayName: displayName, website: website });
      // Return false to cancel default page submit action
      return false;
    },
    getInitialState: function() {
      // TODO: hmmm this.props.userInfo doesn't exist yet...????
      // Instead I added a hack below in render
      return {displayName: this.props.userInfo.displayName, website: this.props.userInfo.website };
    },
    handleDisplayNameChange: function(event) {
      this.setState({ displayName: event.target.value });
      clearTimeout(this.timeoutID);
      this.timeoutID = window.setTimeout(this.handleSubmit, 1000);
    },
    handleWebsiteChange: function(event) {
      this.setState({ website: event.target.value });
      clearTimeout(this.timeoutID);
      this.timeoutID = window.setTimeout(this.handleSubmit, 1000);
    },
    render: function() {
      // Hack becuase getINitialState doesn't have this.props available
      if (!this.state.displayName)
        this.state.displayName = this.props.userInfo.displayName;
      if (!this.state.website)
        this.state.website = this.props.userInfo.website;

      return (
        <div id='profile-container'>
          <GravatarIcon emailHash={emailHash} size='200' url='http://gravatar.com'/>
          <form className='userInfoForm' onSubmit={this.handleSubmit}>
            <label htmlFor='email'>Email</label>
            <input type='text' placeholder='Email' ref='email' id='email' readOnly value={email} />
            <label htmlFor='displayName'>Display Name</label>
            <input type='text' placeholder='Display name shown for posting comments' ref='displayName' id='displayName' value={this.state.displayName } onChange={this.handleDisplayNameChange} />
            <label htmlFor='website'>Website</label>
            <input type='url' placeholder='Website linked when posting comments' ref='website' id='website' value={this.state.website } onChange={this.handleWebsiteChange} />
          </form>
        </div>
      );
    }
  }); 
  React.renderComponent(
      <UserInfoBox url='/user/info.json' />,
    document.getElementById('user-info')
  );

 return UserInfoBox;
});
