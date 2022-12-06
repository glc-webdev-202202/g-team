import express from 'express'
const app = express();

const sqlite3 = require("sqlite3").verbose();



class Stock {
    private db = new sqlite3.Database("./stock.db", sqlite3);
    private sql = `INSERT INTO stock (code,nprice, updown) VALUES(?,?,?)`;
    constructor(){
        this.createTable();
    }
    private createTable(): void{
        this.db.serialize(() => {
            this.db.run(this.sql,["005980","89100","2.5"])
        })
    }

    private updateTable(): void{
        this.db.serialize(() => {
            this.db.run("CREATE TABLE IF NOT EXISTS stock (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)")
            this.db.run("INSERT INTO users (name, password) VALUES ('tj', 'foobar')")
        })
    }

    public findstock(code:string): void{
        this.db.get('SELECT code, price FROM stock WHERE code="${code}"', (err: any, row: any) => {
            if (!row){
                console.log("["+row.code + "]/Current Price:" +row.price)
            } else {
                console.log("["+row.code + "]/Current Price:" +row.price)
            }
        })
    }

}


app.listen(8080, () => {
    console.log('Server running on port 8080')
});