import express from 'express';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import path from 'path';

const sqlite = require('sqlite3').verbose();

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

// const users: User[] = [
//     { name: 'tj', password: 'foobar' },
//     { name: 'bj', password: 'pass' },
//     { name: 'kj', password: 'word' },
//     { name: 'ts', password: 'ts' },
//     { name: 'tl', password: 'tl' },
// ];

// function findUser(name: string): User | null {
//     var user = users.find(user => user.name === name);
//     if (!user) return null;
//     else return user;
// }

// function authenticate(name: string, pass: string, fn: (user: User | null) => void) {
//     var user = findUser(name);
//     if (!user) return fn(null);
//     if (pass === user.password) return fn(user);
//     fn(null);
// }

function index(req: Request, res: Response, next: NextFunction): void {
    try {
        res.redirect('/login');
    } catch (error) {
        next(error);
    }
};

class AuthRepository { //console.log로 확인
    private db = new sqlite.Database(path.join(__dirname, "user.db"));

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
        this.db.get('SELECT name, password FROM users WHERE name="${name}"', (err: any, row: any) => {
            if (!row){
                fn(null);
            } else {
                fn({"name": row.name, "password": row.password});
            }
        })
    }
    //private db 때문에 여기에 ADD USER 
    public registerUser(req: Request, res: Response, next: NextFunction) { //this is for making a new account where new username and password are pushed into the users array
        try {
            if (!req.session.user){ //로그인이 안되어있으면 
                // user.push({name: req.body.nusername, password: req.body.npassword}); // <-- 이 부분을 SQL로 회원가입 정보 입력 
                res.redirect('/login');
            } else { //로그인 되어있으면 기본 창으로 
                res.redirect('/login');
            }
        } catch (error) {
            next(error);
        }
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

    public index = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try{
            res.redirect('/login');
        } catch (error) {
            next(error);
        }
    };

    public signUp = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('login', {loggedin: req.session.user});
        } catch(error){
            next(error);
        }
    };

    public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    public logOut = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.session.destroy(function () {
                res.redirect('/');
            });
        } catch (error) {
            next(error);
        }
    };

    public restricted = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    public register = async(req: Request, res: Response, next: NextFunction): Promise<void> => { //get request을 통해서 회원가입 페이지 불러오기?
        try {
            res.render('register'); //register.ejs로 이동?
        } catch (error) {
            next(error);
        }
    };

    public myPosts = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    public app: express.Application;
    public authController;

    constructor() {
        this.app = express();
        this.authController = new AuthController();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    public listen(port: number) {
        this.app.listen(port);
    }
    private initializeMiddlewares() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));

        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'asdf!@#$qwer'
        }));
        this.app.use(function (req: Request, res: Response, next) {
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

    private initializeRoutes() {
        this.app.get('/', index);
        this.app.get('/login', this.authController.signUp);
        this.app.post('/login', this.authController.logIn);
        this.app.get('/restricted', this.authController.restricted);
        this.app.get('/logout', this.authController.logOut);
        this.app.get('/bbs', listBbs);
        this.app.post('/write', writeBbs); 
        this.app.get('/register', this.authController.register);
        // this.app.post('/register', this.authController.registerUser);
        this.app.get('/myPosts', this.authController.myPosts);
    }
}

const app = new App();

app.listen(8080)