const axios = require('axios');

const token = 'eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQWRtaW5pc3RyYWRvciIsIm5hbWUiOiJLQVJFTiBEQUhJQU5BIEJVU1RBTUFOVEUgVEFNQVlPIiwiaWQiOiJiZDJkOGE4Ni1lMjc1LTRiZWYtODI2MS02YWI1Zjc1OTQxNDkiLCJlbWFpbCI6ImthcmVuLmJ1c3RhbWFudGU0MDA3MEB1Y2FsZGFzLmVkdS5jbyIsInN1YiI6IktBUkVOIERBSElBTkEgQlVTVEFNQU5URSBUQU1BWU8iLCJpYXQiOjE3NzkzODMyNTYsImV4cCI6MTc3OTM4Njg1Nn0.QL7X_Igyz1g1Xu7FxplAI24kb1lXWm9n3erJONqU7NegMZ-hBTis9YlMWDoQD4Y1';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/boletos/mis-tarjetas', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

test();
