import express from 'express'
const app = express();
import * as sqlite from 'sqlite3';
const sqlite3 = sqlite.verbose();


let db: sqlite.Database = new sqlite3.Database('chain.stock', () => {});

let sql = `INSERT INTO stock (stock_code, stock_name, stock_price, stock_ud) VALUES(?,?,?,?)`;


function closeDb() {
    console.log("closeDb");
    db.close();
}


function readStock() {
    db.each("SELECT stock_name AS name,stock_price AS price FROM stock", (err, row) => {
        console.log(row.name + ": " + row.price);});
}

class StockDB {
    private db = new sqlite3.Database("./stock.db", sqlite3);
    private sql = `INSERT INTO stock (stock_code, stock_name, stock_price, stock_ud) VALUES(?,?,?,?)`;
    constructor(){
        this.addStock();
    }

    private addStock(): void{
        this.db.serialize(() => {
            this.db.run(this.sql, ["005930","삼성전자","58900원","-0.51%"],)
        })
    }

    private updateTable(): void{
        this.db.serialize(() => {
            this.db.run("CREATE TABLE IF NOT EXISTS stock (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)")
            this.db.run("INSERT INTO users (name, password) VALUES ('tj', 'foobar')")
        })
    }

    private viewStock(): void{
        this.db.serialize(() => {
            this.db.each("SELECT stock_name AS name,stock_price AS price FROM stock"=> {
                console.log(row.name + ": " + row.price);});
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

readSt








app.listen(8080, () => {
    console.log('Server running on port 8080')
});