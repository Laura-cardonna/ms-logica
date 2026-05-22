const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Nucita@25-12-06',
    database: 'buses-proyecto'
  });

  try {
    const [c] = await connection.execute('SELECT * FROM `ciudadanos` WHERE id = "bd2d8a86-e275-4bef-8261-6ab5f7594149"');
    console.log('--- CIUDADANO Karen ---');
    console.log(c);

    const [all] = await connection.execute('SELECT * FROM `ciudadanos`');
    console.log('--- ALL CIUDADANOS ---');
    console.log(all);

    const [metodos] = await connection.execute('SELECT * FROM `metodos_pago_ciudadano`');
    console.log('--- ALL METODOS PAGO ---');
    console.log(metodos);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

test();
