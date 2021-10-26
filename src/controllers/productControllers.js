const fs = require("fs");
const { mysqldb } = require("../connections");

module.exports = {
  addProducts: async (req, res) => {
    let path = "/products";
    console.log(req.files);
    console.log(req.body);
    const { image } = req.files; // image karena name di fieldnya image
    // req.body kalo kirim file itu masih json harus kita parse
    const data = JSON.parse(req.body.data);
    // imagepath adalah tempat foto disimpan
    let imagePath = image ? `${path}/${image[0].filename}` : null;
    const { name, price, stock, categories_id, keterangan } = data;
    // kalo mau buat proteksi
    if (!name || !price || !stock || !categories_id) {
      if (imagePath) {
        // hapus filenya jika error
        fs.unlinkSync("./public" + imagePath);
      }
      return res.status(400).send({ message: "kurang input data" });
    }
    // add data product to table products
    let sql = `insert into products set ?`;
    try {
      let dataInsert = {
        name: name,
        price,
        image: imagePath,
        categories_id,
        keterangan,
        stock,
      };
      const [results] = await mysqldb.promise().query(sql, dataInsert);
      console.log(results); // resultsnya insert itu object, property insertId lumayan penting

      return res.status(200).send({ message: "berhasil add products" });
    } catch (err) {
      if (imagePath) {
        // hapus filenya jika error
        fs.unlinkSync("./public" + imagePath);
      }
      console.log("error :", err);
      return res.status(500).send({ message: err.message });
    }
  },
  getProducts: async (req, res) => {
    const { pages, limit, priceMin, priceMax, name, categories_id, sort } =
      req.query;
    const conn = await mysqldb.promise().getConnection();
    let offset = pages * limit; // karena pages dimulai dari 0
    let querySql = "";
    let sortSql = "";
    if (priceMin) {
      querySql += `and price > ${mysqldb.escape(parseInt(priceMin))} `;
    }
    if (priceMax) {
      querySql += `and price < ${mysqldb.escape(parseInt(priceMax))} `;
    }
    if (name) {
      querySql += `and name like ${mysqldb.escape("%" + name + "%")} `;
    }
    if (categories_id) {
      querySql += `and categories_id = ${mysqldb.escape(categories_id)} `;
    }
    if (sort) {
      sortSql += `order by ${sort} `;
    }
    try {
      let sql = `select p.id,name,price,image,stock,keterangan,categories_id,category
            from products p 
            join categories c on p.categories_id = c.id 
            where true ${querySql}
            ${sortSql}
            limit ?,?`;
      console.log(sql);
      const [productsData] = await conn.query(sql, [offset, parseInt(limit)]);
      // total product
      sql = `select count(*) as total_prod from products where true ${querySql}`;
      const [result] = await conn.query(sql, offset, limit);
      res.set("x-total-count", result[0].total_prod);
      conn.release();
      return res.status(200).send(productsData);
    } catch (error) {
      conn.release();
      console.log("error :", error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
};
