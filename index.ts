import express from 'express';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import path from 'path';

const sqlite = require('sqlite3').verbose(); //이 명령문이 있어야 sqlite3를 사용할 수 있음 

class Article{
    public name: string;

    public a_id: number;
    public a_title: string;
    public a_content: string;
    public a_secret: boolean;

    public constructor(name: string, a_id: number, a_title: string, a_content: string, a_secret: boolean){ //a_id, a_title, a_content, a_secret
        this.name = name;
        this.a_id = a_id;
        this.a_title = a_title;
        this.a_content = a_content;
        this.a_secret = a_secret;
    }
}

const forum: Article[] = [
    { name: 'tj', a_id: 0, a_title: 'hello', a_content: 'nice to meet you', a_secret: false },
    { name: 'bj', a_id: 1, a_title: 'I\'m new here', a_content: 'yoroshiku', a_secret: false },
    { name: 'tj', a_id: 2, a_title: 'here again!', a_content: 'anybody here?', a_secret: false },
    { name: 'ts', a_id: 3, a_title: 'rich people', a_content: 'money ain\'t an issue', a_secret: false }
];

function listForum(req: Request, res: Response, next: NextFunction): void{
    try{
        res.render('forum', {list:forum});
    }   catch (error){
        next(error);        
    }
};

function writeForum(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session.user){
            res.redirect("login"); 
        } else {
            forum.push({name: req.session.user.uid, a_id: req.body.a_id, a_title: req.body.a_title, a_content: req.body.a_content, a_secret: req.body.a_secret});
            res.redirect("/forum");  
        }
    }
    catch (error){
        next(error);
    }
}

class User {
    public uid: string;  
    public pw: string;
    public firstname: string;
    public lastname: string;
    public email: string;

    public constructor(uid: string, pw: string, firstname: string, lastname: string, email: string) {
        this.uid = uid;
        this.pw = pw;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
    }
}

class Stock{
    public s_code: string;
    public s_name: string;
    public s_price: number;
    public s_start: number;
    public s_high: number;
    public s_low: number;
    public s_vol: number;

    public constructor(s_code: string, s_name: string, s_price: number, s_start: number, s_high: number, s_low: number, s_vol: number ){
        this.s_code = s_code;
        this.s_name = s_name;
        this.s_price = s_price;
        this.s_start = s_start;
        this.s_high = s_high;
        this.s_low = s_low;
        this.s_vol = s_vol;
    }
}

class User_Stocks{
    public us_id: number;
    public id: string;
    public s_code: string;

    public constructor(us_id: number, id: string, s_code: string){
        this.us_id = us_id;
        this.id = id;
        this.s_code = s_code;
    }
}

class User_Articles{
    public ua_id: number;
    public id: string;
    public a_id: number;

    public constructor(ua_id: number, id: string, a_id: number){
        this.ua_id = ua_id;
        this.id = id;
        this.a_id = a_id;
    }
}

declare module 'express-session' {
    interface SessionData {
        user: User;
        error: string;
        success: string;
    }
}


class AuthRepository { 
    private db = new sqlite.Database(path.join(__dirname, "users.db"), (err: any) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the users database :)');  //This log appears on terminal(such as Powershell) if db is successfully connected
    });

    constructor(){
        this.createTable();
    }

    private createTable(): void{
        this.db.serialize(() => {
            this.db.run("CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, pw TEXT, firstname TEXT, lastname TEXT, email TEXT)");
            this.db.run("CREATE TABLE IF NOT EXISTS stocks(s_code TEXT PRIMARY KEY, s_name TEXT, s_price INTEGER, s_start INTEGER, s_high INTEGER, s_low INTEGER, s_vol INTEGER)");
            this.db.run("CREATE TABLE IF NOT EXISTS articles (a_id INTEGER PRIMARY KEY AUTOINCREMENT, a_title TEXT, a_content TEXT, a_secret BOOLEAN)");
            // this.db.close((err: any) => {if (err) return console.error(err.message);});
            // this.db.run("INSERT INTO users (uid, pw, firstname, lastname, email) VALUES ('tj', 'foobar','aa','aa','aa')");
            // this.db.run("INSERT INTO stocks(s_code, s_name, s_price, s_start, s_high, s_low, s_vol) VALUES ('00000','AAA',0,0,0,0,0)");
            // this.db.run("INSERT INTO articles(a_title, a_content, a_secret) VALUES ('a','b',TRUE)");
            // this.db.get(`SELECT * FROM stocks`);
            // this.db.get(`SELECT * FROM users`);
            // this.db.get(`SELECT * FROM articles`);
            // this.db.close((err: any) => {if (err) return console.error(err.message);});
            this.db.run("CREATE TABLE IF NOT EXISTS user_stocks (us_id INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT, s_code TEXT, FOREIGN KEY(id) REFERENCES users(uid), FOREIGN KEY(s_code) REFERENCES stocks(s_code)");
            this.db.run("CREATE TABLE IF NOT EXISTS user_articles (ua_id INTEGER PRIMARY KEY, id TEXT, a_id INTEGER, FOREIGN KEY (id) REFERENCES users (uid), FOREIGN KEY (a_id) REFERENCES articles (a_id)");
            this.db.close((err: any) => {if (err) return console.error(err.message);});
        //     this.db.run("INSERT INTO user_stocks(us_id, id, s_code) VALUES (0, 'tj', '000000')");
        //     this.db.run("INSERT INTO user_articles(ua_id, id, a_id) VALUES (0, 'tj', 0)");

        //     this.db.get(`SELECT * FROM users`, (err: any, info: any) =>{
        //         console.log(err, info)
        // });
        //     this.db.get(`SELECT * FROM stocks`, (err: any, info: any) =>{
        //     console.log(err, info)
        // });
        //     this.db.get(`SELECT * FROM articles`, (err: any, info: any) =>{
        //     console.log(err, info)
        // });
        //     this.db.get(`SELECT * FROM user_stocks`, (err: any, info: any) =>{
        //     console.log(err, info)
        // });
        //     this.db.get(`SELECT * FROM user_articles`, (err: any, info: any) =>{
        //     console.log(err, info)
        // });
        });
    }

    public findUser(name: string, fn:(user: User | null) => void) { 
        this.db.get(`SELECT uid, pw FROM users WHERE name="${name}"`, (err: any, row: any) => {
            if (!row){
                fn(null);
            } else {
                fn({"uid": row.name, "pw": row.pw, "firstname": row.firstname, "lastname": row.lastname, "email": row.email});
            }
        })
    } 

    public addUser(uid: string, pw: string, firstname: string, lastname: string, email: string, fn: (user: User | null) => void){
        this.db.run(`INSERT INTO users (uid, pw, firstname, lastname, email) VALUES ("${uid}", "${pw}", "${firstname}", "${lastname}", "${email}")`, (err: any) => {
            if (err){
                fn(null);
            } 
            else {
                fn({"uid": uid, "pw": pw, "firstname": firstname, "lastname": lastname, "email": email});
            }
        })
        this.db.get(`SELECT * FROM users`, (err: any, info: any) =>{
            console.log(err, info)
    });
        this.db.get(`SELECT * FROM stocks`, (err: any, info: any) =>{
        console.log(err, info)
    });
        this.db.get(`SELECT * FROM articles`, (err: any, info: any) =>{
        console.log(err, info)
    });
    //     this.db.get(`SELECT * FROM user_stocks`, (err: any, info: any) =>{
    //     console.log(err, info)
    // });
    //     this.db.get(`SELECT * FROM user_articles`, (err: any, info: any) =>{
    //     console.log(err, info)
    // });
    }
    
}

class AuthService{
    public authRepository = new AuthRepository();

    public async authenticate(name: string, pass: string, fn: (user: User | null) => void){
        this.authRepository.findUser(name, (user) => {
            if (!user) return fn(null);
            if (pass === user.pw) return fn(user);
            fn(null);
        });
    }
}

class AuthController {
    public authService = new AuthService();

    public index = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //GET /
        try{
            res.redirect('/login');
        } catch (error) {
            next(error);
        }
    };

    public registerUser = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //POST /register
    try {
        this.authService.authRepository.addUser(req.body.nusername, req.body.npassword, req.body.nfirstname, req.body.nlastname, req.body.nemail, function (user) {
            if (user) {
                req.session.regenerate(function () {
                    req.session.success = 'Welcome ' + user.uid;
                    res.redirect('/login');
                });
            } else {
                req.session.error = 'Username already taken!';
                res.redirect('back');
            }
        });
    } catch(error){
        next(error);
    }
};

    public signUp = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //GET /login
        try {
            res.render('login', {loggedin: req.session.user});
        } catch(error){
            next(error);
        }
    };

    public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => { //POST /login
        try {
            await this.authService.authenticate(req.body.username, req.body.password, function (user) {
                if (user) {
                    req.session.regenerate(function () {
                        req.session.user = user;
                        req.session.success = 'username: ' + user.uid;
                        res.redirect('back');
                    });
                } else {
                    req.session.error = '비밀번호가 틀렸습니다. '
                        + ' (use "tj" and "foobar")';
                    res.redirect('/');
                }
            });
        } catch (error) {
            next(error);
        }
    };

    public logOut = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //GET /logout
        try {
            req.session.destroy(function () {
                res.redirect('/');
            });
        } catch (error) {
            next(error);
        }
    };

    public restricted = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //GET /restricted
        try {
            if (req.session.user) {
                res.render("restricted");
            } else {
                req.session.error = '접근 금지!';
                res.redirect('/');
            }
    
        } catch (error) {
            next(error);
        }
    };

    public register = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //GET /register
        try {
            res.render('register'); 
        } catch (error) {
            next(error);
        }
    };

    public myPosts = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //GET /myposts
        try {
            if (!req.session.user){
                res.redirect("login");
            } else {
                var myPosts = forum.filter(function (post) {
                    return post.name === req.session.user?.uid;
                });
                res.render('myposts', {
                    list: myPosts,
                    loggedin: req.session.user
                }); 
            }
        } catch (error) {
            next(error);
        }
    };
}

class App { 
    public app: express.Application; //"app" is the name. Typescript syntax starts with the ":" after which 
                                     // follows a type. which can be typescript interface, data type, object, etc. In this case
                                     // it is an attribute called Application in the import called express.
    public authController; //this is just a declaration

    constructor() { //constructor is a function that is called when an object is created from a class
        this.app = express(); //when an instance of App is made, the express() function is called and the result is stored in the attribute "app"
        this.authController = new AuthController(); //when an instance of App is made, the instance also contains AuthController, which has functions like index, login, and etc.
        this.initializeMiddlewares(); 
        this.initializeRoutes(); 
    }

    public listen(port: number) { 
        this.app.listen(port);
    }

    private initializeMiddlewares() { 
        this.app.set('view engine', 'ejs'); //sets the view engine to ejs
        this.app.set('views', path.join(__dirname, 'views')); //sets the app's views folder as the name "views"
        this.app.use(express.urlencoded({ extended: false }));
        
        this.app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'asdf!@#$qwer'
        }));

        this.app.use(function (req: Request, res: Response, next) { //this is a middleware. middleware is/are function(s) run between the client request and the server answer. The most common middleware functionality needed are error managing, database interaction, getting info from static files or other resources. To move on the middleware stack, the next callback must be called. 
            var err = req.session.error;
            var msg = req.session.success;
            delete req.session.error;
            delete req.session.success;
            res.locals.message = '';
            if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
            if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
            next();
        });
    }

    private initializeRoutes() { //app.get() and app.post() methods used here refer to routes and request received by node.js server. app.get() refers to GET request and app.post() referes to POST request
        this.app.get('/', this.authController.index);
        this.app.get('/login', this.authController.signUp);
        this.app.post('/login', this.authController.logIn);
        this.app.get('/restricted', this.authController.restricted);
        this.app.get('/logout', this.authController.logOut);
        this.app.get('/forum', listForum);
        this.app.post('/write', writeForum); 
        this.app.get('/register', this.authController.register);
        this.app.post('/register', this.authController.registerUser);
        this.app.get('/myPosts', this.authController.myPosts);
        // this.app.get('/stocklist', );
    }
}




const app = new App();

app.listen(8080)