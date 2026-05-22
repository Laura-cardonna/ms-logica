const axios = require('axios');

async function test() {
  try {
    const resRutas = await axios.get('http://localhost:3000/ruta');
    console.log('--- GET /ruta ---');
    console.log(JSON.stringify(resRutas.data, null, 2));

    const resParaderos = await axios.get('http://localhost:3000/ruta/1/paraderos');
    console.log('--- GET /ruta/1/paraderos ---');
    console.log(JSON.stringify(resParaderos.data, null, 2));

    const resRecorrido = await axios.get('http://localhost:3000/ruta/1/recorrido');
    console.log('--- GET /ruta/1/recorrido ---');
    console.log(JSON.stringify(resRecorrido.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

test();
