const { mysqldb } = require("../connections");

// TODO CART ADD :
//  ? CEK DULU kita ada keranjang
// ? ada keranjang buat keranjang baru
// ? jika tidak ada buat kernajang baru
// ? kalo ada cek dulu apakah barang dikeranjang sama dengan barang yang bakal dimasukkan ke keranajng
// ? jika ada maka tambah quantitynya saja
// ? jika tidak maka tambah list barang di cartnya

let sqlCart = `select cd.id,carts_id,products_id,name,price,stock,image,keterangan,qty,category from carts c 
        join carts_detail cd on c.id = cd.carts_id 
        join products p on cd.products_id = p.id 
        join categories cg on p.categories_id = cg.id
        where ischeckout=0 and cd.isdeleted=0  and users_id = ?`;

module.exports = {
  addToCart: async (req, res) => {
    const { users_id, qty, products_id } = req.body;

    const conn = await mysqldb.promise().getConnection();
    let cartId = 0;
    try {
      // ngecek ada ngga users id didalam cart yang ischekout = 0
      await conn.beginTransaction();

      let sql = `select id from carts where users_id = ? and ischeckout = 0`;
      let [cartsData] = await conn.query(sql, [users_id]);

      //   console.log(cartsData);
      // memulai fiture sql transaction

      if (cartsData.length) {
        // datanya ada kita nggak perlu insert data ke table carts
        // langsung ke table carts detail
        cartId = cartsData[0].id;
      } else {
        // jika kosong belum ada data maka kita akan melakukan insert to carts table
        // masukkan data ke table carts detail
        sql = `insert into carts set ?`;
        let dataInsert = {
          users_id: users_id,
        };
        let [result] = await conn.query(sql, dataInsert);
        cartId = result.insertId;
      }
      //   cek apakah barang sudah ada dikeranjang atau belum
      sql = `select id,qty from carts_detail where carts_id = ? and products_id = ? and isdeleted=0`;
      let [data] = await conn.query(sql, [cartId, products_id]);
      // cek stock
      sql = `select id,stock from products where id = ?`;
      let [products] = await conn.query(sql, [products_id]);
      if (data.length) {
        //   update data cart_detail
        let stock = products[0].stock;
        if (data[0].qty + qty > stock) {
          throw { message: "qty melebihi stock" };
        }
        sql = `update carts_detail set ? where id = ?`;
        let dataUpdate = {
          qty: qty + data[0].qty,
        };
        await conn.query(sql, [dataUpdate, data[0].id]);
      } else {
        let stock = products[0].stock;
        if (qty > stock) {
          throw { message: "qty melebihi stock" };
        }
        //   insert data to carts_detail
        sql = `insert into carts_detail set ? `;
        let dataInsert = {
          qty: qty,
          carts_id: cartId,
          products_id,
        };
        await conn.query(sql, [dataInsert]);
      }
      await conn.commit();
      let [carts] = await conn.query(sqlCart, [users_id]);
      conn.release();
      return res.status(200).send({ carts });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
  getcarts: async (req, res) => {
    const { users_id } = req.params;
    const conn = mysqldb.promise();

    try {
      let [carts] = await conn.query(sqlCart, [users_id]);
      return res.status(200).send({ carts });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
  deleteCarts: async (req, res) => {
    const { carts_detail_id, users_id } = req.params;
    const conn = await mysqldb.promise().getConnection();
    try {
      let dataUpdate = {
        isdeleted: 1,
      };
      let sql = `update carts_detail set ? where id = ?`;
      await conn.query(sql, [dataUpdate, carts_detail_id]);
      let [carts] = await conn.query(sqlCart, [users_id]);
      conn.release();
      return res.status(200).send({ carts });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
  editQtyCarts: async (req, res) => {
    const { users_id, qty, products_id } = req.body;
    const { carts_detail_id } = req.params;
    const conn = await mysqldb.promise().getConnection();

    try {
      if (qty < 1) {
        throw { message: "qty tidak boleh kurang dari 1 atau hapus saja" };
      }
      // cek stok
      let sql = `select id,stock from products where id = ?`;
      let [products] = await conn.query(sql, [products_id]);
      if (products[0].stock < qty) {
        //   jika qty melebihi stock
        throw { message: "qty melebihi stock" };
      }
      sql = `update carts_detail set ? where id = ?`;
      let dataUpdate = {
        qty: qty,
      };
      await conn.query(sql, [dataUpdate, carts_detail_id]);
      let [carts] = await conn.query(sqlCart, [users_id]);
      conn.release();
      return res.status(200).send({ carts });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
};
