var config = require('config-lite'),  // 读取配置文件
    moment = require('moment'),  // 时间格式化
    objectIdToTimestamp = require('objectid-to-timestamp'),  // 根据 ObjectId 生成时间戳
    Mongolass = require('mongolass'),  // mongodb 驱动
    mongolass = new Mongolass();
mongolass.connect(config.mongodb);

// 根据id生成创建时间createdAt
mongolass.plugin('addCreatedAt', {
  afterFind: function(results) {
    results.forEach(function(item) {
      item.createdAt = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
    });
    return results;
  },
  afterFindOne: function (result) {
    if(result) {
      result.createdAt = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
    }
    return result;
  }
});

exports.User = mongolass.model('User', {
  name: { type: 'string' },
  password: { type: 'string' },
  avatar: { type: 'string' },
  gender: { type: 'string', enum: ['m', 'f', 'x'] },
  bio: { type: 'string' }
});
exports.User.index({ name: 1 }, { unique: true }).exec();  // 根据用户名找到用户，用户名全局唯一

exports.Post = mongolass.model('Post', {
  author: { type: Mongolass.Types.ObjectId },
  title: { type: 'string' },
  content: { type: 'string' },
  hits: { type: 'number' }
});
exports.Post.index({ author: 1, _id: -1 }).exec();  // 按创建时间降序查看用户的文章列表

exports.Comment = mongolass.model('Comment', {
  author: { type: Mongolass.Types.ObjectId },
  content: { type: 'string' },
  postId: { type: Mongolass.Types.ObjectId }
});
exports.Comment.index({ postId: 1, _id: 1 }).exec();  // 通过文章id获取该文章下所有留言，按留言创建时间升序
exports.Comment.index({ author: 1, _id: 1 }).exec();  // 通过用户id和留言id删除一个留言