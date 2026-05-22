const axios = require('axios');

async function test() {
  const routes = [1, 2, 3, 4];
  for (const id of routes) {
    try {
      console.log(`\n=== ROUTE ${id} ===`);
      const resParaderos = await axios.get(`http://localhost:3000/ruta/${id}/paraderos`);
      console.log(`GET /ruta/${id}/paraderos: OK (paraderos count: ${resParaderos.data.rutaParaderos ? resParaderos.data.rutaParaderos.length : 0})`);
      
      const resRecorrido = await axios.get(`http://localhost:3000/ruta/${id}/recorrido`);
      console.log(`GET /ruta/${id}/recorrido: OK (paraderos count: ${resRecorrido.data.paraderos ? resRecorrido.data.paraderos.length : 0})`);
    } catch (err) {
      console.error(`ERROR for Route ${id}:`, err.message);
    }
  }
}

test();
