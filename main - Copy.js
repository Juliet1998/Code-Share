const Sequelize = require('sequelize')
const Sha256 = require('sha256')

//Connect to the users database and store the connection in `users_db`
var users_db = new Sequelize('postgres://postgres:DrexelCS275Project@essence.network:5432/users',    
            {
              define: {
                timestamps: false
              }
            });

//Connect to the posts database and store the connection in `posts_db`
var posts_db = new Sequelize('postgres://postgres:DrexelCS275Project@essence.network:5432/posts');

var User = users_db.define('user', {
  userId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'user_id'
  },
  username: {
    type: Sequelize.STRING,
    field: 'username'
  },
  password: {
    type: Sequelize.STRING,
    field: 'password'
  }
}, {
  freezeTableName: true
});

var Post = posts_db.define('post', {

  postId: {
    primaryKey: true,
    autoIncrement: true,
    type: Sequelize.INTEGER,
    field: 'post_id'
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id'
  },
  postContent: {
    type: Sequelize.STRING,
    field: 'post_content'
  },
  language: {
    type: Sequelize.STRING,
    field: 'language'
  }
}, {
  freezeTableName: true
});

async function getAllUsers(){

   var users = await User.findAll({
              attributes : ['user_id', 'username', 'password']
   });

   for(var i = 0; i < users.length; i++){
     console.log('Username: ' + users[i].username + ' Password Hash: ' + users[i].password)
   }
}

async function getAllPosts(){

   var posts = await Post.findAll({
              attributes : ['userId', 'postId', 'language', 'createdAt', 'postContent']
   });

   for(var i = 0; i < posts.length; i++){
     console.log('User_id: ' + posts[i].userId + ' Post_id: ' + posts[i].postId +
                 ' Post content: ' + posts[i].postContent + ' Language: ' + posts[i].language)
   }
}


async function createUser(username, password){
  var user = await User.create({
               username: username,
               password: Sha256(password) //Password hashes only.
             })
}

async function createPost(user_id, post_content, language){
  var user = await Post.create({
               userId: user_id,
               postContent: post_content,
               language: language
             })
}

//Examples of how to use these functions

//Register would user createUser
//createUser('Test', 'test1234')

//When we need to create a new code post user the below function
//createPost(1, 'Some code test', 'nodejs')

getAllUsers()
getAllPosts()