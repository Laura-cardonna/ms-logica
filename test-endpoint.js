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
    const res = await axios.post('http://localhost:3000/metodo-pago-ciudadano/pagar-directo', {
      tarjetaId: 5,
      monto: 25000,
      tipoPago: 'tarjeta',
      numeroTarjeta: '4575623182290326',
      fechaExpiracion: '12/2027',
      cvv: '123',
      franquicia: 'Visa'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Response /metodo-pago-ciudadano/pagar-directo:', JSON.stringify(res.data, null, 2));

  } catch (err) {
    console.error('Error calling endpoint:', err.response ? { status: err.response.status, data: err.response.data } : err.message);
  }
}

run();
