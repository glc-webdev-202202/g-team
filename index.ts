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

const bbs: Article[] = [
    { name: 'tj', title: 'hello', contents: 'nice to meet you' },
    { name: 'bj', title: 'I\'m new here', contents: 'yoroshiku' },
    { name: 'tj', title: 'here again!', contents: 'anybody here?' },
    { name: 'ts', title: 'rich people', contents: 'money ain\'t an issue' },
];

function listBbs(req: Request, res: Response, next: NextFunction): void{
    try{
        res.render('bbs', {list:bbs});
    }   catch (error){
        next(error);        
    }
};

function writeBbs(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.session.user){
            res.redirect("login"); 
        } else {
            bbs.push({name: req.session.user.name, title: req.body.title, contents: req.body.contents});
            res.redirect("/bbs");  
        }
    }
    catch (error){
        next(error);
    }
}

class User {
    public name: string;

    public password: string;

    public constructor(name: string, password: string) {
        this.name = name;
        this.password = password;
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
            this.db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)")
            this.db.run("INSERT INTO users (name, password) VALUES ('tj', 'foobar')")
        })
    }

    public findUser(name: string, fn:(user: User | null) => void) { 
        this.db.get(`SELECT name, password FROM users WHERE name="${name}"`, (err: any, row: any) => {
            if (!row){
                fn(null);
            } else {
                fn({"name": row.name, "password": row.password});
            }
        })
    } 

    public addUser(name: string, password: string, fn: (user: User | null) => void){
        this.db.run(`INSERT INTO users (name, password) VALUES ("${name}", "${password}")`, (err: any) => {
            if (err){
                fn(null);
            } else {
                fn({"name": name, "password": password});
            }
        })
    }
    
}

class AuthService{
    public authRepository = new AuthRepository();

    public async authenticate(name: string, pass: string, fn: (user: User | null) => void){
        this.authRepository.findUser(name, (user) => {
            if (!user) return fn(null);
            if (pass === user.password) return fn(user);
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
            this.authService.authRepository.addUser(req.body.nusername, req.body.npassword, function (user) {
                if (user) {
                    req.session.regenerate(function () {
                        req.session.success = 'Welcome ' + user.name;
                        res.redirect('/login');
                    });
                } else {
                    req.session.error = 'username already taken!';
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
                        req.session.success = 'username: ' + user.name;
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
                var myPosts = bbs.filter(function (post) {
                    return post.name === req.session.user?.name;
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
        this.app.get('/bbs', listBbs);
        this.app.post('/write', writeBbs); 
        this.app.get('/register', this.authController.register);
        this.app.post('/register', this.authController.registerUser);
        this.app.get('/myPosts', this.authController.myPosts);
    }
}

const app = new App();

app.listen(8080)