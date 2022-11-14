var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var MySQLStore = require('express-mysql-session')(session);
var mysql = require('mysql');
var base64 = require('base-64');
var jwt = require('jsonwebtoken');
var conn = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password: 'kyh04138338!!', //비번에 굉장히 신경을 많이 써주어야 한다.
    database: 'assignment2'
});
conn.connect();

var app = express();

var disabled = 'disabled';
var id_disabled = '';
var username_value = '';
var pwd_disabled = 'disabled';

app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    secret: '123412sadfF1312@#!F',
    resave: false,
    saveUninitialized: true,
    store :  new MySQLStore({
        host : 'localhost',
        port : 3306,
        user: 'root',
        password: 'kyh04138338!!',
        database: 'assignment2',
        path : './sessions'})
}));

function starthtml(){ //귀찮은 html도입부 자동작성
    return(`
    <!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>assignment2</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
  </head>
  <body>
    `);
}

function endhtml(){ //귀찮은 html 끝부분 자동 작성
    return(`
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3" crossorigin="anonymous"></script>
  </body>
</html>
    `);
}

app.get('/identify/logout', function(req,res){
    
    req.session.destroy(); //쿠키 지워버려서 지금 유저가 들어온지도 모르게 만든다.

    res.redirect('/');

    //로그아웃 하기 위해선 세션 정보를 지워버려야 한다..
});

app.get('/',function(req,res){
    //여기서 username은 아이디를 의미하며, 
    //session값이 존재하느냐 안하느냐에 따라서 로그인여부 판별할 예정
    //이런식으로 선언만 해놓고 값을 넣어줘도 자동으로 sessions폴더에 들어간다.

    if(req.session.username){ //로그인을 성공한 경우. 즉, req.session.username이 존재하는 경우
        console.log(req.session.username + ' has connected!'); 
       res.send(`
       ${starthtml()}
       <div class="container justify-content-center">
        
       <div class="row text-center" style="width: 100%">

           <div style="width: 100%; float:none; margin:0 auto" >
                   <h1>ASSIGNMENT 2 LOGIN & REGISTER</h1>
                   <h1>HI, ${req.session.username}</h1>
           </div>

           <a href = "/identify/logout">Logout</a>
       </div>
       </div>
        ${endhtml()}
       `);
       
       
        // res.send(`
        // <h1>Hello ${req.session.username}</h1>
        // <a href = "/auth/logout">Logout</a>
        // `);
    }else{ //로그인을 하지 못한 경우 - 로그인 화면으로 이동
        res.redirect('/identify/login');
    }
});

app.post('/identify/login',function(req,res){ //로그인 기능 작성

    conn.query('SELECT * FROM users WHERE username = ?', [req.body.username], function(err,results){
        if(!results[0]){
            return req.session.save( () => {
                            //여기에 경고문 출력한 뒤
                            res.write("<script>alert('NONEXISTENT USERNAME')</script>");
                            res.write("<script>window.location=\"../identify/login\"</script>");
                            });//유저가 없는경우 메세지 출력
        }

            if(base64.encode(results[0].salt+req.body.password) === results[0].password){ //비번이 일치하는 경우
                
                req.session.username = results[0].username; //로그인 인증용 session 값
                
                return req.session.save( () => {
                    res.redirect('/');
                    });
            } 
            //비번이 일치하지 않는 경우
            req.session.save( () => {
                //여기에 경고문 출력한 뒤
                res.write("<script>alert('INVALID PASSWORD!')</script>");
                res.write("<script>window.location=\"../identify/login\"</script>");
                });
        });
});

app.get('/identify/login',function(req,res){ //로그인 폼 작성

    var page = `
    ${starthtml()}
    <div class="container justify-content-center">
        
    <div class="row text-center" style="width: 100%">

        <div style="width: 100%; float:none; margin:0 auto" >
                <h1>ASSIGNMENT 2 LOGIN</h1>
        </div>
    </div>

    <p><br><br></p>

    <div class="row text-center" style="width: 100%">

    <form action = "/identify/login" method = "post">
    <p>
        <input type = "text" name = "username" placeholder = "username">
    </p>
    <p>
        <input type = "password" name = "password" placeholder = "password">
    </p>
    <p>
        <input type = "submit" value = "submit">
    </p>
    </form> 

    <p><a href = "/identify/register">Register</a></p>

    </div>

    </div>
    ${endhtml()}
    `

    res.send(page);
});

const generateRandomString = (num) => { //salt값에 넣을 랜덤 문자열 생성
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < num; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  
    return result;
  }
  
app.post('/identify/register',function(req,res){ //회원가입 기능 처리

    conn.query('SELECT * FROM users WHERE username = ?', [req.body.username], function(err,results){
        if(!req.body.username){
            return req.session.save( () => {
                res.write("<script>alert('PLEASE INSERT USERNAME')</script>");
                res.write("<script>window.location=\"../identify/register\"</script>");
                });
        }
        else if(!results[0] && disabled === "disabled"){ //중복체크에서 id가 존재하지 않는경우
            return req.session.save( () => {
                            console.log('im here');
                            disabled = "";
                            id_disabled = "disabled";
                            username_value = req.body.username;
                            res.write("<script>alert('YOU CAN USE IT')</script>");
                            res.write("<script>window.location=\"../identify/register\"</script>");
                            });
        }else if (disabled === "disabled"){ //중복체크에서 id가 존재하는 경우
            return req.session.save( () => {
                res.write("<script>alert('EXIST USERNAME')</script>");
                res.write("<script>window.location=\"../identify/register\"</script>");
                });
        }

    var input = {
        username : req.body.username,
        password : req.body.password,
        salt : 'test'
    }

    input.salt = generateRandomString(20);

    input.password = base64.encode(input.salt + req.body.password); //비밀번호를 salt값과 합친 뒤 base64로 인코딩

    conn.query(`INSERT INTO users SET ?`, input, function(err, results){
        if(err){
            console.log(err);
        }else{
            req.session.username = req.body.username; //세션에 로그인 완료를 뜻하는 유저네임을 집어넣어준다~.
            id_disabled = "";
            disabled = "disabled";
            username_value = "";

            req.session.save( () => {
                res.redirect('/');
                }); 
        }
    });

});

});

app.get('/identify/register',function(req,res){ //회원가입 화면 출력

    var page = `
    ${starthtml()}

    <div class="container justify-content-center">
        
    <div class="row text-center" style="width: 100%">

        <div style="width: 100%; float:none; margin:0 auto" >
                <h1>ASSIGNMENT 2 REGISTER</h1>
        </div>
    </div>

    <p><br><br></p>

    <div class="row text-center" style="width: 100%">

    <form action = "/identify/register" method = "post" >
    <p>
        <input type = "text" id ="password1" name = "username" placeholder = "username" value = "${username_value}">
    </p>
    <p>
        <input type = "password" id="password2" name = "password" placeholder = "password">
    </p>
    <p>
    <input type = "password"  name = "password_again" placeholder = "password again" onblur="heystop()">
    </p>
    <script>
    </script>
    <p>
        <input type = "submit" name = "id_check" value = "ID 중복 확인" ${id_disabled}>
        <input type = "submit" value = "submit" ${disabled}>
    </form> 

    <p><a href = "/identify/login">Login</a></p>

    </div>

    </div>

    ${endhtml()}
    `;

    res.send(page);
});

app.listen(80,function(){
    console.log('Connected 80 port!!');
});