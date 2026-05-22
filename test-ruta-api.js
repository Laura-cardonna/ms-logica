const axios = require('axios');

async function run() {
  for (let id = 1; id <= 5; id++) {
    try {
      const res = await axios.get(`http://localhost:3000/ruta/${id}/recorrido`);
      console.log(`Route ${id}: ${res.data.nombre} has ${res.data.paraderos.length} paraderos.`);
      if (res.data.paraderos.length > 0) {
        console.log(`Stops for route ${id}:`, res.data.paraderos);
      }
    } catch (err) {
      console.log(`Route ${id}: Error: ${err.message}`);
    }
  }
}

run();
