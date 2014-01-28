define(['backbone'], function(_) {

  var CommentModel = Backbone.Model.extend({
    urlRoot: '/comments/' + lessonSlug + '/',
    initialize: function() {
    },
    defaults: {
      text: ''
    },
  });

  var CommentList = Backbone.Collection.extend({
    url: '/comments/' + lessonSlug + '/',
    model: CommentModel
  });

  return {
    CommentModel: CommentModel,
    CommentList: CommentList
  };
});


