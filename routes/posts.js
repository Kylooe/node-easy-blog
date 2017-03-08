var express = require('express'),
    router = express.Router();

var checkLogin = require('../middlewares/check').checkLogin,
    PostModel = require('../models/posts'),
    CommentModel = require('../models/comments');

// GET /posts 所有用户或者特定用户的文章页
//   eg: GET /posts?author=xxx
router.get('/', function(req, res, next) {
  var author = req.query.author;

  PostModel.getPosts(author)
    .then(function(posts) {
      res.render('posts', {
        posts: posts
      });
    })
    .catch(next);
});

// POST /posts 发表一篇文章
router.post('/', checkLogin, function(req, res, next) {
  var author = req.session.user._id,
      title = req.fields.title,
      content = req.fields.content;

  try {
    if (!title.length) {
      throw new Error('请填写标题');
    }
    if (!content.length) {
      throw new Error('请填写内容');
    }
  } catch(e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  var post = {
    author: author,
    title: title,
    content: content,
    hits: 0
  };

  PostModel.create(post)
    .then(function(result) {
      post = result.ops[0];  // 插入mongodb后的值，包含_id
      req.flash('success', '发表成功');
      res.redirect(`/posts/${post._id}`);  // 发表成功后跳转到该文章页
    })
    .catch(next);
});

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function(req, res, next) {
  res.render('create');
});

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function(req, res, next) {
  var postId = req.params.postId;

  Promise.all([
    PostModel.getPostById(postId),  // 获取文章信息
    CommentModel.getComments(postId),  // 获取该文章所有留言
    PostModel.incHits(postId)  // hits加1
  ])
  .then(function(result) {
    var post = result[0],
        comments = result[1];
    if(!post) {
      throw new Error('该文章不存在');
    }
    res.render('post', {
      post: post,
      comments: comments
    });
  })
  .catch(next);
});

// GET /posts/:postId/edit 编辑文章页
router.get('/:postId/edit', checkLogin, function(req, res, next) {
  var postId = req.params.postId,
      author = req.session.user._id;

  PostModel.getRawPostById(postId)
    .then(function(post) {
      if (!post) {
        throw new Error('该文章不存在');
      }

      if (author.toString() !== post.author._id.toString()) {
        throw new Error('没有权限');
      }

      res.render('edit', {
        post: post
      });
    })
    .catch(next);
});

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function(req, res, next) {
  var postId = req.params.postId,
      author = req.session.user._id,
      title = req.fields.title,
      content = req.fields.content;

  PostModel.updatePostById(postId, author, { title: title, content: content })
    .then(function() {
      req.flash('success', '编辑成功');
      res.redirect(`/posts/${postId}`);  // 编辑成功后跳转到上一页
    })
    .catch(next);
});

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function(req, res, next) {
  var postId = req.params.postId,
      author = req.session.user._id;

  PostModel.delPostById(postId, author)
    .then(function() {
      req.flash('success', '删除成功');
      res.redirect('/posts');  // 删除成功后跳转到主页
    })
    .catch(next);
});

// POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment', checkLogin, function(req, res, next) {
  var author = req.session.user._id,
      postId = req.params.postId,
      content = req.fields.content;
  var comment = {
    author: author,
    postId: postId,
    content: content
  };

  CommentModel.create(comment)
    .then(function() {
      req.flash('success', '留言成功');
      res.redirect('back');
    })
    .catch(next);
});

// GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/:postId/comment/:commentId/remove', checkLogin, function(req, res, next) {
  var commentId = req.params.commentId,
      author = req.session.user._id;

  CommentModel.delCommentById(commentId, author)
    .then(function() {
      req.flash('success', '删除留言成功');
      res.redirect('back');
    })
    .catch(next);
});

module.exports = router;