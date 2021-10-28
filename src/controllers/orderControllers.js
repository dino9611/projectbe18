const { mysqldb } = require("../connections");

module.exports = {
  checkout: async (req, res) => {
    const { carts_id, alamat, userId, pajak, ongkir, banks_id } = req.body;
    const conn = await mysqldb.promise().getConnection();
    try {
      await conn.beginTransaction();
      // update ischeckout dari 0 jadi satu 1
      let sql = `update carts set ? where id = ?`;
      let dataUpdate = {
        ischeckout: 1,
      };
      await conn.query(sql, [dataUpdate, carts_id]);

      // get carts detail untuk dipindahkan ke orders detail
      sql = `select cd.products_id,p.price,cd.qty 
        from carts_detail cd 
        join products p on cd.products_id = p.id 
        where cd.isdeleted=0 and cd.carts_id=?; `;

      //   carts_detail type datanya adalah array
      let [carts_detail] = await conn.query(sql, [carts_id]);

      let inserDataToOrders = {
        status: 1,
        alamat,
        users_id: userId,
        pajak,
        ongkir,
        banks_id,
      };
      sql = `insert into orders set ? `;
      //   insert data ke table order
      let [dataOrders] = await conn.query(sql, [inserDataToOrders]);
      // array untuk list product yang stocknya kurang
      let stockKurang = [];

      for (let i = 0; i < carts_detail.length; i++) {
        let val = carts_detail[i];
        // cek stock
        sql = `select id,name,stock from products where id = ?`;
        let [result] = await conn.query(sql, val.products_id);
        if (result[0].stock - val.qty < 0) {
          stockKurang.push(result[0]);
        }

        if (!stockKurang.length) {
          //   jika tidak adat stock yang kurang maka
          // bisa insert data dan kurangin stock
          // kurangin stock
          let stockNow = result[0].stock - val.qty;
          let dataUpdate = {
            stock: stockNow,
          };
          sql = `update products set ? where id = ?`;
          await conn.query(sql, [dataUpdate, val.products_id]);
          // insert data to orders_detail
          sql = `insert into orders_detail set ? `;
          let insertData = {
            products_id: val.products_id,
            qty: val.qty,
            price: val.price,
            orders_id: dataOrders.insertId,
          };
          await conn.query(sql, insertData);
        }
      }

      if (stockKurang.length) {
        // array stock kurangnnya true artiyna ada stock yang kurang
        throw { message: "stock products ada yang kurang", data: stockKurang };
      }
      await conn.commit();
      conn.release();
      return res.status(200).send({ message: "berhasil checkout" });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({
        message: error.message || "server error",
        data: error.data || [],
      });
    }
  },
};
