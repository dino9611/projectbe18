const { mysqldb } = require("./../connections");
const { hashPass, createToken, transporter } = require("./../helpers");
const { createTokenEmailVerified, createTokenAccess } = createToken;
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");

let sqlCart = `select cd.id,carts_id,products_id,name,price,image,keterangan,qty,category from carts c 
        join carts_detail cd on c.id = cd.carts_id 
        join products p on cd.products_id = p.id 
        join categories cg on p.categories_id = cg.id
        where ischeckout=0 and cd.isdeleted=0 and users_id = ?`;

module.exports = {
  register: async (req, res) => {
    const { username, password, email } = req.body;
    const conn = await mysqldb.promise().getConnection();
    try {
      // cek username yang sama
      let sql = "select id from users where username = ?";
      const [dataUser] = await conn.query(sql, [username]);
      if (dataUser.length) {
        // username ada yang sama
        throw { message: "username sudah terdaftar" };
      }
      //   username belum terdaftar
      console.log(username, "username belum terdaftar");
      //   insert data to table users
      sql = "insert into users set ?";
      let dataInsert = {
        username,
        password: hashPass(password),
        email,
      };
      const [result] = await conn.query(sql, [dataInsert]);
      //   get data user terdaftar
      sql = `select id,username,email,isVerified,role_id,user_status from users where id = ?`;
      const [userData] = await conn.query(sql, [result.insertId]);
      //   buat token
      const dataToken = {
        id: userData[0].id,
        username: userData[0].username,
        role_id: userData[0].role_id,
      };
      // relesea connection melepaskan koneksi dari pool
      conn.release();
      const emailToken = createTokenEmailVerified(dataToken);
      const accessToken = createTokenAccess(dataToken);
      //?kirim email verifikasi
      let filepath = path.resolve(__dirname, "../template/emailVerif.html");
      // console.log(filepath);
      // ubah html jadi string pake fs.readfile
      let htmlString = fs.readFileSync(filepath, "utf-8");
      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        nama: username,
        token: emailToken,
      });
      console.log(htmlToEmail);
      // email with tamplate html
      // tanpa await jika tidak mau ditunggu kirim emailnya
      transporter.sendMail({
        from: "Naruto <dinotestes12@gmail.com>",
        to: email,
        subject: "Email verifikasi dari hokage Ecommerce",
        html: htmlToEmail,
      });
      // taro token di headers
      res.set("x-token-access", accessToken);
      //   berhasil kirim email baru kasih response
      return res.status(200).send({ ...userData[0], carts: [] });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
  login: async (req, res) => {
    const { username, password, email } = req.body;
    const conn = await mysqldb.promise().getConnection();
    try {
      let sql = `select id,username,email,isVerified,role_id,user_status from users where username = ? and password = ?`;
      const [userData] = await conn.query(sql, [username, hashPass(password)]);
      if (!userData.length) {
        // kalo lengthnya 0 maka masuk sini
        throw { message: "username/email tidak ditemukan" };
      }
      //   buat token
      const dataToken = {
        id: userData[0].id,
        username: userData[0].username,
        role_id: userData[0].role_id,
      };
      // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidXNlcm5hbWUiOiJ1c2VyNSIsInJvbGVfaWQiOjEsImlhdCI6MTYzNTIxNjMwMywiZXhwIjoxNjM1MjU5NTAzfQ.iobIVhb7UJj_AGSPFwW2x2pd6PFx75BxVXYuIEgz1l8
      const accessToken = createTokenAccess(dataToken);
      //? get Cart tolong cari list cart PR
      let [carts] = await conn.query(sqlCart, [userData[0].id]);
      conn.release();
      // kriim token by header
      res.set("x-token-access", accessToken);
      //   berhasil kirim email baru kasih response
      return res.status(200).send({ ...userData[0], carts: carts });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
  keeplogin: async (req, res) => {
    const { id } = req.user;
    const conn = await mysqldb.promise().getConnection();
    try {
      let sql = `select id,username,email,isVerified,role_id,user_status from users where id = ?`;
      const [userData] = await conn.query(sql, [id]);
      if (!userData.length) {
        // kalo lengthnya 0 maka masuk sini
        throw { message: "username tidak ditemukan" };
      }
      //? get Cart tolong cari list cart PR

      let [carts] = await conn.query(sqlCart, [id]);
      conn.release();
      //   berhasil kirim email baru kasih response
      return res.status(200).send({ ...userData[0], carts: carts });
    } catch (error) {
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
};
