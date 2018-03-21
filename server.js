/*
* Liye Zhu
* CS 275 Final Project
* 3/21/2018
*
*/


var express = require('express');
var http = require('http');
var bodyParser = require("body-parser");
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


var app = express();
var server = http.createServer(app);

app.use(express.static("."));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

server.listen(8080);
server.listen(8080, function(){
console.log('Server started...');
});


app.post("/login", function(req, res){
  //put session code here
  res.redirect("/home");
});

app.post('/signUp', function(req,res){
    var name = req.body.stud_name;
    var user_name = req.body.u_name;
    var p_word = req.body.p_word;
    var p_lang = req.body.lang;
    createUser(user_name, p_word);
});

app.get("/create", function(red, res){
  //redirect user to edit page
  res.redirect('./edit.html');
});

app.get("/home", function(red, res){
  //redirect user to home page
  res.redirect('./dashboard.html');
});

app.get("/mypost", function(red, res){
  //redirect user to home page
  res.redirect('./mypost.html');
});

app.get("/success", function(req, res){
  //redirect user to the success page
  res.redirect("./success.html");
});

app.get("/view", function(req, res){
  //put actions here when a post is submitted by user
  console.log(req.query.id); //id for post
  res.send("Hello"); //send post content back here
});

app.post("/post", function(req, res){
  //put actions here when a post is submitted by user
  console.log(req.body.post); //content of post
  console.log(req.body.lan); //language of post
  res.redirect("/success");
});


app.get("/logout", function(req, res){
  //put actions here to logoff an user
  res.send("Not done");
});

