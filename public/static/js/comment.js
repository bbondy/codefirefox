/**
 * @jsx React.DOM
 */

require(['react', 'showdown', 'jsx!gravatar'], function(React, Showdown, GravatarIcon) {

  var converter = new Showdown.converter();

  /**
   * Represents an entire comment box
   * Which contains a comment list and a form to submit a new comment.
   */
  var CommentBox = React.createClass({
    getInitialState: function() {
      return { data: [] };
    },
    handleCommentSubmit: function(comment) {
      var comments = this.state.data;
      var newComments = comments.concat([comment]);
      $.ajax({
        url: this.props.url,
        dataType: 'json',
        type: 'POST',
        data: comment,
        success: function(data) {
          //this.setState({data: data});
        }.bind(this)
      });
      this.loadCommentsFromServer();
    },
    handleCommentRemove: function(commentID) {
      if (!confirm('Are you sure you want to remove this comment?')) {
        return;
      }

      $.ajax({
        url: this.props.url + commentID,
        type: 'DELETE',
        contentType: 'application/json',
        dataType: 'json',
        success: function(data) {
          console.log('onSuccess data: ' + data);
          this.loadCommentsFromServer();
        }.bind(this)
      });
    },
    loadCommentsFromServer: function() {
      $.getJSON(this.props.url, function(data) {
        this.setState({data: data});
      }.bind(this));
    },
    componentWillMount: function() {
      this.loadCommentsFromServer();
      setInterval(this.loadCommentsFromServer, this.props.pollInterval);
    },
    signIn: function() {
      $('#login').click();
    },
    render: function() {
      if (email) {
        return (
          <div className='commentBox'>
            <h1>Comments</h1>
            <CommentList
              data={this.state.data}
              onCommentRemove={this.handleCommentRemove}
            />
            <CommentForm 
              onCommentSubmit={this.handleCommentSubmit}
            />
          </div>
        );
      } else {
        return (
          <div className='commentBox'>
            <h1>Comments</h1>
            <CommentList data={this.state.data} 
              onCommentRemove={this.handleCommentRemove}
            />
            <div className='signInMessage'>
              <a href='#' onClick={this.signIn}>Sign in</a> to post a comment
            </div>
          </div>
        );
      }
    } 
  });

  /**
   * Represents a list of comments
   */
  var CommentList = React.createClass({
    render: function() {
      var removeComment = this.props.onCommentRemove;
      var commentNodes = this.props.data.map(function (comment) {
        return <Comment
                 displayName={comment.displayName}
                 daysAgoPosted={comment.daysAgoPosted}
                 emailHash={comment.emailHash}
                 commentID={comment.id}
                 website={comment.website}
                 onCommentRemove={removeComment}
               >{comment.text}</Comment>;
      });
      return (
        <div className='commentList'>
          {commentNodes}
        </div>
      );
    }
  });


  var CommentDeleter = React.createClass({
    removeComment: function() {
      console.log('removeComment: ' + this.props.commentID);
      this.props.onCommentRemove(this.props.commentID);
      console.log('aftercommentremove');
      return false;
    },
    render: function() {
      // The server only allows comment deletion if you're logged
      // in and you're an admin, so don't show it otherwise
      if (email && isAdmin) {
        return (
        <span>
           (<a href='#' onClick={this.removeComment}>Delete</a>)
         </span>
        );
      } else {
        return (
          <span/>
        );
      }
    }
  });

  /**
   * Represents an individual comment item.
   */
  var Comment = React.createClass({
    render: function() {
      // This text has HTML manually stripped before it is used
      var rawMarkup = converter.makeHtml(this.props.children.toString());
      var website = this.props.website;
      if (!website)
        website = '#';

      return (
        <div className='comment'>
          <GravatarIcon emailHash={this.props.emailHash} size='60' url={website} />
          <a href={website} target='_blank'>
          <span className='comment-name'>
            {this.props.displayName}
          </span>
          </a>
          <CommentDeleter commentID={this.props.commentID} onCommentRemove={this.props.onCommentRemove} />
          <div className='comment-date'>
            {this.props.daysAgoPosted} ago
          </div>
          <div className='clear' />
          <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
        </div>
      );
    }
  });

  /**
   * The HTML form for filling out the comment
   */
  var CommentForm = React.createClass({
    handleSubmit: function() {
      var text = this.refs.text.getDOMNode().value.trim();
      text = text.replace(/(<([^>]+)>)/ig,'');
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
          <textarea rows='6' cols='200' placeholder='Your comment (markdown, but no tags)' ref='text'  />
          <input type='submit' value='Submit' />
        </form>
      );
    }
  }); 

  var url = '/comments/' + lessonSlug + '/';
  React.renderComponent(
      <CommentBox url={url} pollInterval={60000} />,
    document.getElementById('comment-content')
  );
});
