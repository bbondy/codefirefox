/**
 * @jsx React.DOM
 */

var converter = new Showdown.converter();
var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function (comment) {
      return <Comment name={comment.name}>{comment.text}</Comment>;
    });
    return (
      <div className='commentList'>
        {commentNodes}
      </div>
    );
  }
});

var CommentBox = React.createClass({
  getInitialState: function() {
    return { data: [] };
  },
  handleCommentSubmit: function(comment) {
    try{
    var comments = this.state.data;
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    } catch(e) {
      for (var c in comments) {
        alert(c);
      }
      alert(e);
    }
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        //this.setState({data: data});
      }.bind(this)
    });
  },
  loadCommentsFromServer: function() {
    $.ajax({
      url: '/video/v/comments.json',
      dataType: 'json',
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error('/video/v/comments.json', status, err.toString());
      }.bind(this)
    });
  },
  componentWillMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    if (email) {
      return (
        <div className='commentBox'>
          <h1>Comments</h1>
          <CommentList data={this.state.data} />
          <CommentForm 
            onCommentSubmit={this.handleCommentSubmit}
          />
        </div>
      );
    } else {
      return (
        <div className='commentBox'>
          <h1>Comments</h1>
          <CommentList data={this.state.data} />
          <div className="signInMessage">
            Sign in to post a comment
          </div>
        </div>
      );
    }
  } 
});

var Comment = React.createClass({
  render: function() {
    var rawMarkup = converter.makeHtml(this.props.children.toString());
    return (
      <div className='comment'>
        <h2 className='commentName'>
          {this.props.name}
        </h2>
        <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
      </div>
    );
  }
});

var CommentForm = React.createClass({
  handleSubmit: function() {
    var text = this.refs.text.getDOMNode().value.trim();
    if (!text) {
      return false;
    }
    this.props.onCommentSubmit({text: text});
    this.refs.text.getDOMNode().value = '';
    return false;
  },
  render: function() {
    return (
      <form className='commentForm' onSubmit={this.handleSubmit}>
        <h1> Submit a new comment!</h1>
        <textarea rows='20' cols='80' placeholder='Your comment (markdown acceptable)' ref='text'  />
        <input type='submit' value='Submit' />
      </form>
    );
  }
}); 

React.renderComponent(
    <CommentBox url='/video/v/comments.json' pollInterval={200000} />,
  document.getElementById('comment-content')
);
