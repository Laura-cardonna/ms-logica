const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Nucita@25-12-06',
    database: 'buses-proyecto'
  });

  try {
    const [ciudadanos] = await connection.execute('SELECT * FROM `ciudadanos`');
    console.log('--- CIUDADANOS ---');
    console.log(ciudadanos);

    const [metodos] = await connection.execute('SELECT * FROM `metodos_pago_ciudadano`');
    console.log('--- METODOS PAGO CIUDADANO ---');
    console.log(metodos);

    const [metodosPagoBase] = await connection.execute('SELECT * FROM `metodos_pago`');
    console.log('--- METODOS PAGO BASE ---');
    console.log(metodosPagoBase);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

test();
