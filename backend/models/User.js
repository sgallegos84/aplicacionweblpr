const sql = require('mssql');
const bcrypt = require('bcryptjs');

const User = {
  create: async (username, password, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const request = new sql.Request();
    request.input('username', sql.VarChar, username);
    request.input('password', sql.VarChar, hashedPassword);
    request.input('role', sql.VarChar, role);

    const result = await request.query(`
      INSERT INTO Users (username, password, role) 
      VALUES (@username, @password, @role)
    `);

    return result;
  },
  
  findByUsername: async (username) => {
    const request = new sql.Request();
    request.input('username', sql.VarChar, username);
    
    const result = await request.query(`
      SELECT * FROM PSIM_Users WHERE username = @username
    `);
    
    return result.recordset[0]; // Devuelve el primer usuario encontrado
  }
};

module.exports = User;
