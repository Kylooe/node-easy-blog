var fs = require('fs'),
    path = require('path'),
    sha1 = require('sha1'),
    express = require('express'),
    router = express.Router();

var UserModel = require('../models/users'),
    checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('signup');
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {
  var name = req.fields.name,
      password = req.fields.password,
      repassword = req.fields.repassword,
      gender = req.fields.gender,
      avatar = req.files.avatar.path.split(path.sep).pop(),
      bio = req.fields.bio;
      
  // 校验参数
  try {
    if(!(name.length >= 1 && name.length <= 10)) {
      throw new Error('名字请限制在 1-10 个字符');
    }
    if(['m', 'f', 'x'].indexOf(gender) === -1) {
      throw new Error('性别只能是男、女或保密');
    }
    if(!(bio.length >= 1 && bio.length <= 30)) {
      throw new Error('个人简介请限制在 1-30 个字符');
    }
    if(!req.files.avatar.name) {
      throw new Error('缺少头像');
    }
    if(password.length < 6) {
      throw new Error('密码至少 6 个字符');
    }
    if(password !== repassword) {
      throw new Error('两次输入密码不一致');
    }
  } catch(e) {
    fs.unlink(req.files.avatar.path);  // 注册失败，异步删除上传的头像
    req.flash('error', e.message);
    return res.redirect('/signup');
  }

  password = sha1(password);  // 明文密码加密

  // 待写入数据库的用户信息
  var user = {
    name: name,
    password: password,
    gender: gender,
    bio: bio,
    avatar: avatar
  };

  // 用户信息写入数据库
  UserModel.create(user)
    .then(function(result) {
      user = result.ops[0];  // 此user是插入mongodb后的值，包含id
      delete user.password;
      req.session.user = user;  // 将用户信息存入session
      req.flash('success', '注册成功');  // 写入flash
      res.redirect('/posts');  // 跳转到首页
    })
    .catch(function(e) {
      fs.unlink(req.files.avatar.path);  // 注册失败，异步删除上传的头像
      // 用户名被占用则跳回注册页，而不是错误页
      if (e.message.match('E11000 duplicate key')) {
        req.flash('error', '用户名已被占用');
        return res.redirect('/signup');
      }
      next(e);
    });
});

module.exports = router;