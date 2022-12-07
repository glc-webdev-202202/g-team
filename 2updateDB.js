const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./stock.db", sqlite3, (err) => {
    if (err) return console.error(err.message);

    console.log("connection succesful");
});

db.serialize(() => {
    db.run('CREATE TABLE stock (stock_code TEXT,stock_name TEXT, stock_price TEXT, stock_ud TEXT )');
    const sql = `INSERT INTO stock (stock_code, stock_name, stock_price, stock_ud) VALUES(?,?,?,?)`;
    db.run(
        sql,
        ["005930","삼성전자","58900원","-0.51%"],
        (err)=> {
            if (err) return console.error(err.message);
            console.log("A new row has been created");
        });

    db.each("SELECT stock_name AS name,stock_price AS price FROM stock", (err, row) => {
        console.log(row.name + ": " + row.price);});
    
    db.close((err) => {
        if (err) return console.error(err.message);
    });
});

