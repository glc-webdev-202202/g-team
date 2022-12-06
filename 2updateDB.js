const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./user.db", sqlite3, (err) => {
    if (err) return console.error(err.message);

    console.log("connection succesful");
});

db.serialize(() => {
    //db.run('CREATE TABLE users (first_name TEXT,last_name TEXT, username TEXT, password INT, email TEXT, id INT )');
    const sql = `INSERT INTO users (first_name,last_name, username, password, email, id) VALUES(?,?,?,?,?,?)`;
    db.run(
        sql,
        ["YS","CHO","CHOYS","123","cho@gmail.com",1],
        (err)=> {
            if (err) return console.error(err.message);
            console.log("A new row has been created");
        });

    db.each("SELECT username AS id,password FROM users", (err, row) => {
        console.log(row.id + ": " + row.password);});
    
    db.close((err) => {
        if (err) return console.error(err.message);
    });
});
const usera = [
     { name: 'tj', password: 'foobar' },
     { name: 'bj', password: 'pass' },
     { name: 'kj', password: 'word' },
     { name: 'ts', password: 'ts' },
     { name: 'tl', password: 'tl' },
 ];
const object = { a: 1, b: 2, c: 3 };

for (const x in usera) {
    const a =  
  console.log(`${property}: ${object[property]}`);
