
const sqlite3 = require("sqlite3").verbose();
let dbstock= new sqlite3.Database("./stock.db", sqlite3, () => {});

let sql = `INSERT INTO stock (stock_code, stock_name, stock_price, stock_start , stock_high, stock_low, stock_volume) VALUES(?,?,?,?,?,?,?)`;


function closeDb() {
    console.log("closeDb");
    dbstock.close();
}

function addStock(code:string,sname:string,price:number,start:number,high:number,low:number,volume:number) {
    dbstock.serialize(() => {
        let dbstock= new sqlite3.Database("./stock.db", sqlite3, () => {});
        dbstock.run(sql,[code,sname,price,start,high,low,volume],
                (err:any)=> {
                    if (err) return console.error(err.message);
                    console.log("A new row has been created");
                });
        dbstock.close((err: any) => {
            if (err) return console.error(err.message);
        });
    }
    )};
    
function readStock() {
    dbstock.serialize(() => {
    let dbstock= new sqlite3.Database("./stock.db", sqlite3, () => {});
    dbstock.each("SELECT stock_name AS name,stock_price AS price FROM stock", (err:any,row: any) => {
        console.log(row.name + ":" + row.price);});
    dbstock.close((err: any) => {
        if (err) return console.error(err.message);
    });
}
)};


readStock();



