import express from 'express';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import path from 'path';

const sqlite = require('sqlite3').verbose(); //이 명령문이 있어야 sqlite3를 사용할 수 있음 

class Article{
    public name: string;

    public title: string;
    public contents: string;

    public constructor(name: string, title: string, contents: string){
        this.name = name;
        this.title = title;
        this.contents = contents;
    }
}

const forum: Article[] = [
    { name: 'tj', title: 'hello', contents: 'nice to meet you' },
    { name: 'bj', title: 'I\'m new here', contents: 'yoroshiku' },
    { name: 'tj', title: 'here again!', contents: 'anybody here?' },
    { name: 'ts', title: 'rich people', contents: 'money ain\'t an issue' },
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
            forum.push({name: req.session.user.uid, title: req.body.title, contents: req.body.contents});
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
    public stock_code: string;
    public stock_name: string;
    public stock_price: number;
    public stock_start: number;
    public stock_high: number;
    public stock_low: number;
    public stock_volume: number;

    public constructor(stock_code: string, stock_name: string, stock_price: number, stock_start: number, stock_high: number, stock_low: number, stock_volume: number ){
        this.stock_code = stock_code;
        this.stock_name = stock_name;
        this.stock_price = stock_price;
        this.stock_start = stock_start;
        this.stock_high = stock_high;
        this.stock_low = stock_low;
        this.stock_volume = stock_volume;
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
            this.db.run("CREATE TABLE IF NOT EXISTS user_stocks (us_id INTEGER PRIMARY KEY, id TEXT, s_code INTEGER, FOREIGN KEY (id) REFERENCES users (uid), FOREIGN KEY (s_code) REFERENCES stocks (s_code)");
            this.db.run("CREATE TABLE IF NOT EXISTS user_articles (ua_id INTEGER PRIMARY KEY, id TEXT, a_id INTEGER, FOREIGN KEY (id) REFERENCES users (uid), FOREIGN KEY (a_id) REFERENCES articles (a_id)");
            this.db.run("CREATE TABLE IF NOT EXISTS stocks (s_code INTEGER PRIMARY KEY, s_name TEXT, s_price INTEGER, s_start INTEGER, s_high INTEGER, s_low INTEGER, s_vol INTEGER)");
            this.db.run("CREATE TABLE IF NOT EXISTS articles (a_id INTEGER PRIMARY KEY, a_title TEXT, a_content TEXT, a_secret BOOLEAN)");
            // this.db.run("INSERT INTO users (uid, pw) VALUES ('tj', 'foobar')")
        })
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
            } else {
                fn({"uid": uid, "pw": pw, "firstname": firstname, "lastname": lastname, "email": email});
            }
        })
        this.db.all(`SELECT * FROM users`, (err: any, info: any) =>{
            console.log(err, info)
    });
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