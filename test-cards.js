const jwt = require('jsonwebtoken');
const axios = require('axios');

const secret = 'mySuperSecretKeyThatIsAtLeast32CharactersLongForJWT';
const payload = {
  id: 'bd2d8a86-e275-4bef-8261-6ab5f7594149',
  email: 'karen.bustamante40070@ucaldas.edu.co'
};

const token = jwt.sign(payload, secret);
console.log('Generated Token:', token);

async function run() {
  try {
    const res = await axios.get('http://localhost:3000/boletos/mis-tarjetas', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Response /boletos/mis-tarjetas:', JSON.stringify(res.data, null, 2));

  } catch (err) {
    console.error('Error calling endpoint:', err.response ? err.response.data : err.message);
  }
}

run();
