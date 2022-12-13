import express from 'express';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import path from 'path';

const sqlite = require('sqlite3').verbose(); //이 명령문이 있어야 sqlite3를 사용할 수 있음 

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

    public constructor(s_code: string, s_name: string, s_price: number, s_start: number, s_high: number, s_low: number, s_vol: number) {
        this.s_code = s_code;
        this.s_name = s_name;
        this.s_price = s_price;
        this.s_start = s_start;
        this.s_high = s_high;
        this.s_low = s_low;
        this.s_vol = s_vol;
    }
}

class Article{
    public a_title: string;
    public a_content: string;
    public a_secret: boolean;

    public constructor(a_title: string, a_content: string, a_secret: boolean){ //a_id는 자동으로 증가하므로 생성자에서는 받지 않음
        this.a_title = a_title;
        this.a_content = a_content;
        this.a_secret = a_secret;
    }
}

declare module 'express-session' {
    interface SessionData {
        user: User;
        error: string;
        success: string;
    }
}

class AuthRepository{
    private db = new sqlite.Database('stock.db', sqlite.OPEN_READWRITE, (err: any) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Connected to stock database. :)');
    });

    private dbrank = new sqlite.Database('stock_supply.db', sqlite.OPEN_READWRITE, (err: any) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Connected to stock_supply database. :)');
    });
    constructor(){
        this.createTable();
    }

    private createTable(): void{
        this.db.serialize(() => {
            // this.db.run("DROP TABLE users")
            // this.db.run("DROP TABLE articles")
            this.db.run("CREATE TABLE IF NOT EXISTS users(uid varchar(16) PRIMARY KEY, pw TEXT NOT NULL, firstname TEXT, lastname TEXT, email TEXT)")
            this.db.run("CREATE TABLE IF NOT EXISTS articles(a_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, a_title TEXT, a_content TEXT, a_secret BOOLEAN)");
            this.db.run("CREATE TABLE IF NOT EXISTS user_stocks (us_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, id TEXT, s_code TEXT, FOREIGN KEY(id) REFERENCES users(uid), FOREIGN KEY(s_code) REFERENCES stock(stock_code))");
            this.db.run("CREATE TABLE IF NOT EXISTS user_articles (ua_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, id TEXT, a_id INTEGER, FOREIGN KEY (id) REFERENCES users(uid), FOREIGN KEY (a_id) REFERENCES articles (a_id))");
        })
    }

    public findUser(uid: string, fn:(user: User | null) => void){
        this.db.get(`SELECT uid, pw, firstname, lastname, email FROM users WHERE uid="${uid}"`, (err: any, row: any) => {
            if (!row){
                fn(null);
            } else {
                fn({"uid": row.uid, "pw": row.pw, "firstname": row.firstname, "lastname": row.lastname, "email": row.email});
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
    }

    public profileInfo(callback:any){ //return user info
        this.db.all(`SELECT * FROM users`, function(err: any, row: any) {
            callback(row);
        });
    }

    public allstock_data(callback:any){
        this.db.all("SELECT * FROM stock", function(err:any, row:any){
            callback(row);
        });
    }

    public agency_data(callback:any){
        this.dbrank.all("SELECT * FROM agency_data order by cast(d as INTEGER)", function(err:any, row:any){
            callback(row);
        });
    }
    
    public foreigner_data(callback:any){
        this.dbrank.all("SELECT * FROM foreigner_data order by cast(d as INTEGER)", function(err:any, row:any){
            callback(row);
        });
    }
 
    public addArticle(a_title: string, a_content: string, a_secret: boolean, fn: (articles: Article | null) => void){
        this.db.run(`INSERT INTO articles (a_title, a_content, a_secret) VALUES ("${a_title}", "${a_content}", "${a_secret}")`, (err: any) => {
            if (err){
                fn(null);
            } else {
                fn({"a_title": a_title, "a_content": a_content, "a_secret": a_secret});
            }
        })
    }

    public forum(callback:any){
        this.db.all("SELECT * FROM articles", function(err:any, row:any){
            callback(row);
        });
    }

}

class AuthService{
    public authRepository = new AuthRepository();

    public async authenticate(uid: string, pw: string, fn: (user: User | null) => void){
        this.authRepository.findUser(uid, (user) =>{
            if (!user) return fn(null);
            if (pw === user.pw) return fn(user);
            fn(null);
        });
    }
}

class AuthController{
    public authService = new AuthService();

    public index = async(req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            res.redirect('/allstock_data');
        } catch (error) {
            next(error);
        }
    };

    public allstock_dataPage = async(req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            this.authService.authRepository.allstock_data(function(result:any){
                res.render('allstock_data', {loggedin: req.session.user, stocks: result});
            });
        } catch (error) {
            next(error);
        }
    };

    public agency_rankPage = async(req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            this.authService.authRepository.agency_data(function(result:any){
                res.render('agency_rank', {loggedin: req.session.user, stocks: result});
            });
        } catch (error) {
            next(error);
        }
    };

    public foreigner_rankPage = async(req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            this.authService.authRepository.foreigner_data(function(result:any){
                res.render('foreigner_rank', {loggedin: req.session.user, stocks: result});
            });
        } catch (error) {
            next(error);
        }
    };
    
    public register = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('register');
        } catch (error) {
            next(error);
        }
    };

    public registerUser = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {uid, pw, firstname, lastname, email} = req.body; 
            this.authService.authRepository.findUser(uid, (user) => {
                if (user){
                    req.session.error = 'Username already taken';
                    res.redirect('/register');
                } else {
                    this.authService.authRepository.addUser(uid, pw, firstname, lastname, email, (user) => {
                        if (user){
                            req.session.user = user;
                            req.session.success = 'Welcome new user, ' + user.uid + '. Please login.';
                            res.redirect('/login');
                        } else {
                            req.session.error = 'Registration failed';
                            res.redirect('/register');
                        }
                    });
                }
            });
        } catch (error) {
            next(error);
        }
    }

    public login = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.render('login', {loggedin: req.session.user});
        } catch (error) {
            next(error);
        }
    }

    public loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            await this.authService.authenticate(req.body.uid, req.body.pw, function (user) {
                if (user) {
                    req.session.regenerate(function () {
                        req.session.user = user;
                        res.redirect('/');
                        req.session.success = 'Logged in as ' + user.uid;
                    });
                } else {
                    req.session.error = 'Please check your username and password.';
                    res.redirect('/login');
                }
            });
        } catch (error) {
            next(error);
        }
    }

    public logOut = async(req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            req.session.destroy(function () {
                res.redirect('/');
            });
        } catch (error) {
            next(error);
        }
    };

    public profile = async(req: Request, res: Response, next: NextFunction): Promise<void> => {  
        try {
            this.authService.authRepository.profileInfo( function(result:any){
                res.render('profile', {loggedin: req.session.user, profiles: result});
            });
        } catch (error) {
            next(error);
        }
    };

    public writePost = async(req: Request, res: Response, next: NextFunction): Promise<void> => { 
        try {
            const {a_title, a_content, a_secret} = req.body; 
                this.authService.authRepository.addArticle(a_title, a_content, a_secret, (articles) => {
                    if (articles){
                        req.session.success = 'Post added';
                        res.redirect('/forum');
                    } else {
                        req.session.error = 'Post failed';
                        res.redirect('/forum');
                    }
                });
            } catch (error) {
            next(error);
        }
    };

    public forum = async(req: Request, res: Response, next: NextFunction): Promise<void> => {  
        try {
            this.authService.authRepository.forum( function(result:Article){
                res.render('forum', {loggedin: req.session.user, articles: result});
            });
        } catch (error) {
            next(error);
        }
    };

}


class App {
    public app: express.Application;
    public authController;

    constructor(){
        this.app = express();
        this.authController = new AuthController();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    public listen(port: number) {
        this.app.listen(port);
    }

    private initializeMiddlewares(){
        this.app.set('view engine', 'ejs'); 
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.use(express.urlencoded({extended: false}));

        this.app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'asdf!@#$qwer'
        }));

        this.app.use(function(req: Request, res: Response, next){ //middleware
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

    private initializeRoutes(){
        this.app.get('/', this.authController.index);
        this.app.get('/allstock_data', this.authController.allstock_dataPage);
        this.app.get('/agency_rank', this.authController.agency_rankPage);
        this.app.get('/foreigner_rank', this.authController.foreigner_rankPage);
        this.app.get('/register', this.authController.register);
        this.app.post('/registerUser', this.authController.registerUser);
        this.app.get('/login', this.authController.login);
        this.app.post('/loginUser', this.authController.loginUser);
        this.app.get('/logout', this.authController.logOut);
        this.app.get('/profile', this.authController.profile);
        this.app.get('/forum', this.authController.forum);
        this.app.post('/writePost', this.authController.writePost);

    }
}

const app = new App();

app.listen(80)