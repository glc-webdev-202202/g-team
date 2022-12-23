class search {
    private db = new sqlite.Database('stock.db')
    public searchStockName = async (stock_name: string, callback: (result: any) => void) => {
        this.db.all('SELECT * FROM stock WHERE stock_name = ?', stock_name, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                callback(result);
            }
        });
    }
}