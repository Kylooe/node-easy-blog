var express = require('express'),
    router = express.Router();

var checkLogin = require('../middlewares/check').checkLogin;

// GET /signout 登出
router.get('/', checkLogin, function(req, res, next) {
  req.session.user = null;  // 清空 session 中用户信息
  req.flash('success', '登出成功');
  res.redirect('/posts');  // 登出成功后跳转到主页
});

module.exports = router;