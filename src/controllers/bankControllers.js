const { mysqldb } = require("../connections");

let bankControllers = {};

bankControllers.getBank = async (req, res) => {
  const conn = mysqldb.promise();
  try {
    let [banks] = await conn.query("select * from banks");
    return res.status(200).send(banks); // udah pasti responnya array
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || "server error" });
  }
};

module.exports = bankControllers;
