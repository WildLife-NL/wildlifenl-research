const dotenv = require('dotenv');
dotenv.config();

if (!process.env.REACT_APP_BASE_URL) {
  console.error('Error: REACT_APP_BASE_URL is not defined. Build failed...');
  process.exit(1);
}
console.log('REACT_APP_BASE_URL found ' + process.env.REACT_APP_BASE_URL);
