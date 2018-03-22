/*
* Liye Zhu
* CS 275 Homeowrk 4
* 2/27/2018
*
*/


var express = require('express');
var session = require('express-session')
var http = require('http');
var bodyParser = require("body-parser");
const genuuid = require('uid-safe');
const Sequelize = require('sequelize')
const Sha256 = require('sha256')
var fs = require('fs');
var cookieParser = require('cookie-parser');
var hls = require('highlight.js')
var marked = require('marked')

const viewer = fs.readFileSync('./view.html',{ encoding: 'utf8' });

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'some random secret',
  cookie: {maxAge : 60000}
}))

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
      }).catch(function(err) {
        // print the error details
        console.log(err);
        return false;
      });
  return true;
}

async function createPost(user_id, post_content, language){
  var post = await Post.create({
               userId: user_id,
               postContent: post_content,
               language: language
             })
  return post;
}
async function getAccountByUsername(Username){
   return User.find({
     where: {
       username: Username
     }
   }).then(function(account) {
     if (!account){
       console.log('Account does not exist.')
       return false;
     }
     console.log("Account exists.")
     return account;
 });
}

async function getPostById(postId){
   return Post.find({
     where: {
       post_id: postId
     }
   }).then(function(post) {
     if (!post){
       return false
     }
     return post;
 });
}

function isLoggedIn(req){
  if(!req.session.user){
     return false
  } else {
    if(req.session.user){
      return true
    }
    return false
  }
}

//Examples of how to use these functions

//Register would user createUser
//createUser('Test', 'test1234')

//When we need to create a new code post user the below function
//createPost(1, 'Some code test', 'nodejs')

getAllUsers()
//getAllPosts()

app.get("/login", function(req, res, next){
   if(isLoggedIn(req)){
     res.redirect('/dashboard')
   } else {
     console.log("User not logged in. Redirecting..")
     res.redirect("/login.html")
   }
});

app.post("/login", async function(req, res, next){

   var body = req.body;
   console.log(body);

   var username = req.body.username;
   var password = req.body.password;

   if(username && password){
     var hashed_password = Sha256(password);
     console.log("Querying")
     var user = await getAccountByUsername(username);
     console.log("Query done");
     if(user){
      console.log(user)
      console.log(user.username)
-     console.log(user.password)
      console.log(hashed_password)
      if(user.password == hashed_password){
        console.log("Successful login")
        req.session.user = username;
        req.session.userid = user.userId;
        res.redirect('/dashboard')
      } else{
        res.end("Incorrect password")
      }
     } else{
     console.log("Username not found")
     }
   }

});

//app.post("/send", function(req, res){
//  res.redirect("/dashboard")
//});

app.get('/', function(req, res){

   if(isLoggedIn(req)){
     res.redirect('/dashboard.html')
   } else {
     res.redirect('/login')
   }
});

app.get("/post", function(req, res){
  var _id = req.query.id;
  getPostById(_id).then(function(post){
   if(post){
      res.set('Content-Type', 'text/html');
      var highlighted = hls.highlight(post.language, post.postContent).value;
      res.end(marked(viewer.replace('{{id}}', post.postId).replace("{{code}}", highlighted).replace("{{language}}", post.language)))
      //res.end(post.postId + " " +
      //post.userId + " " + post.postContent + " " +
      //post.language)
    } else {
      res.send("Post not found.")
    }
  })

});

app.post('/post', async function(req, res){
  console.log(req.body)
  var code = req.body.post;
  var language = req.body.lan;
  var post = await createPost(req.session.userid, code, language);
  res.redirect('/post?id=' + post.postId)
  //Post created. somehow get ID maybe by latest creation date and redirect to it.
});


app.get('/register', function(req, res){
   res.redirect('/register.html')
});

app.post('/signUp', async function(req,res){
    var name = req.body.stud_name;
    var user_name = req.body.u_name;
    var p_word = req.body.p_word;
    var p_lang = req.body.lang;
    var result = await createUser(user_name, p_word)
    console.log(result)
    if(result){
      res.redirect('/login')
    } else {
      res.end('Username taken')
    }
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


app.get('/dashboard', function(req, res){
   if(isLoggedIn(req)){
     res.redirect('/dashboard.html')
   } else {
     res.redirect('/login')
   }
});

app.get('/logout', function(req, res){
  req.session.destroy();
  res.redirect('/login')
});


app.use(express.static("."));
//app.use(bodyParser.json());

//server.listen(8080);
var server = http.createServer(app);
server.listen(8080, function(){
console.log('Server started...');
});
