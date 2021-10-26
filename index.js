const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5005;
const cors = require("cors");
const bearerToken = require("express-bearer-token");
const morgan = require("morgan");
const { mysqldb } = require("./src/connections");
morgan.token("date", function (req, res) {
  return new Date();
});

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

app.use(express.json());
// klo corsnya "cors()" artinya allow semua ip
app.use(
  cors({
    exposedHeaders: ["x-token-access", "x-token-refresh", "x-total-count"],
  })
);
// untuk membuat token masuk kedalam variable req.token
app.use(bearerToken());
//? parse form data berguna untuk upload file /
app.use(express.urlencoded({ extended: false }));
// untuk serving file statis contoh file statis adalah foto akrena dia statis/tidak berubah di kondisi apapun
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("<h1>WELCOME TO API ECOMMERCE</h1>");
});
// contoh penggunakan mysql pooling
app.get("/role", async (req, res) => {
  try {
    const conn = await mysqldb.promise();
    const [result] = await conn.query("select * from role");
    // conn.release(); //jika menggunakan getconncetion
    res.send(result);
  } catch (error) {
    console.log(error);
    conn.release();
    res.status(500).send(result);
  }
});

const {
  authRoutes,
  categoriesRoutes,
  productsRoutes,
} = require("./src/routes");

app.use("/auth", authRoutes);
app.use("/categories", categoriesRoutes);
app.use("/products", productsRoutes);

app.listen(PORT, () => console.log(`API JALAN DI PORT ${PORT}`));
