const axios = require('axios');

const apiKey = 'sk-cp-sPgdKbqLq4Ms_K5vTJUw6bJS3WjGmmbrvCQ8CNUyLyHZzACF_44tRK4oqcWNq5zCsjPANYk_oruPGv2m3_VGqjayHyZ07JSf8fUpbwcPhOx5vOAVNhUSZps';

async function test() {
  console.log('Testing MiniMax API...');

  try {
    const response = await axios.post(
      'https://api.minimax.chat/v1/text/chatcompletion_v2',
      {
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, respond with just OK' }
        ],
        max_tokens: 10,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

test();