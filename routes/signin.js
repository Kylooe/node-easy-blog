var sha1 = require('sha1'),  // sha1 加密，用于密码加密
    express = require('express'),
    router = express.Router();

var UserModel = require('../models/users'),
    checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signin 登录页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('signin');
});

// POST /signin 用户登录
router.post('/', checkNotLogin, function(req, res, next) {
  var name = req.fields.name,
      password = req.fields.password;

  UserModel.getUserByName(name).then(function (user) {
    if(!user) {
      req.flash('error', '用户不存在');
      return res.redirect('back');
    }
    // 检查密码是否匹配
    if(sha1(password) !== user.password) {
      req.flash('error', '用户名或密码错误');
      return res.redirect('back');
    }
    req.flash('success', '登录成功');
    delete user.password;
    req.session.user = user;  // 用户信息写入 session
    res.redirect('/posts');  // 跳转到主页
  }).catch(next);
});

module.exports = router;