const axios = require('axios');
const fs = require('fs');
async function fetchHTML() {
  try {
    const res = await axios.get('https://www.moraremfranca.com.br');
    fs.writeFileSync('moraremfranca.html', res.data);
    console.log('moraremfranca HTML fetched.');
  } catch (e) {
    console.log('error fetching', e.message);
  }
}
fetchHTML();
