const { mysqldb } = require("../connections");

module.exports = {
  getCategories: async (req, res) => {
    const conn = mysqldb.promise();
    try {
      let [categories] = await conn.query(`select * from  categories`);

      return res.status(200).send(categories);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || "server error" });
    }
  },
};
