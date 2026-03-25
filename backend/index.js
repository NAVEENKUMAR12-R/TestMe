const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Allow proxying JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Proxy endpoint
app.post('/proxy', async (req, res) => {
  const { url, method = 'GET', headers = {}, body } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Filter out headers that could cause issues when proxied
  const filteredHeaders = { ...headers };
  delete filteredHeaders['host'];
  delete filteredHeaders['content-length'];
  delete filteredHeaders['origin'];
  delete filteredHeaders['referer'];
  delete filteredHeaders['user-agent'];
  delete filteredHeaders['accept-encoding'];

  try {
    const startTime = Date.now();

    const response = await axios({
      url,
      method,
      headers: filteredHeaders,
      data: body,
      validateStatus: () => true, // Resolve for any status code
    });

    const endTime = Date.now();
    const time = endTime - startTime;

    // Send back the response
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      time,
      size: JSON.stringify(response.data)?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      error: 'Proxy Error',
      message: error.message,
      code: error.code
    });
  }
});

app.listen(PORT, () => {
  console.log(`Free Postman proxy server running on http://localhost:${PORT}`);
});
