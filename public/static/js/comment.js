/**
 * @jsx React.DOM
 */

 "use strict";

require(['models', 'react', 'showdown', 'jsx!gravatar'], function(models, React, Showdown, GravatarIcon) {


  var CommentModel = models.CommentModel;
  var CommentList = models.CommentList;
  var converter = new Showdown.converter();

  /**
   * Represents an entire comment box
   * Which contains a comment list and a form to submit a new comment.
   */
  var CommentBox = React.createClass({
    getInitialState: function() {
      return { commentList: new CommentList() };
    },
    handleCommentSubmit: function(comment) {
      comment.save().done(function(comment) {
        console.dir(comment);
        this.state.commentList.add(comment);
        this.setState({ commentList: this.state.commentList });
      }.bind(this));
    },
    handleCommentRemove: function(comment) {
      if (!confirm('Are you sure you want to remove this comment?')) {
        return;
      }

      comment.destroy().done(function() {
        this.setState({ commentList: this.state.commentList });
      }.bind(this));
    },
    loadCommentsFromServer: function() {
      var commentList = this.state.commentList;
      commentList.fetch().done(function(){
        this.setState({ commentList: commentList });
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
            <CommentListView
              commentList={this.state.commentList}
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
            <CommentListView commentList={this.state.commentList} 
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
  var CommentListView = React.createClass({
    render: function() {
      var removeComment = this.props.onCommentRemove;
      var commentNodes = this.props.commentList.map(function (comment) {
        return <CommentView
                 comment={comment}
                 onCommentRemove={removeComment}
               />;
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
      this.props.onCommentRemove(this.props.comment);
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
  var CommentView = React.createClass({
    render: function() {
      // This text has HTML manually stripped before it is used
      var rawMarkup = converter.makeHtml(this.props.comment.get('text'));
      var website = this.props.comment.get('website');

      return (
        <div className='comment'>
          <GravatarIcon emailHash={this.props.comment.get('emailHash')} size='60' url={website} />
          <a href={website} target='_blank'>
          <span className='comment-name'>
            {this.props.comment.get('displayName')}
          </span>
          </a>
          <CommentDeleter comment={this.props.comment} onCommentRemove={this.props.onCommentRemove} />
          <div className='comment-date'>
            {this.props.comment.get('daysAgoPosted')} ago
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
      var comment = new CommentModel({text: text});
      this.props.onCommentSubmit(comment);
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

  React.renderComponent(
      <CommentBox url={CommentModel.urlRoot} pollInterval={60000} />,
    document.getElementById('comment-content')
  );
});
