const { execSync } = require('child_process');
const url = 'http://localhost:3000';
const command = process.platform === 'win32' ? `start ${url}` : `open ${url}`;
try {
  execSync(command, { stdio: 'ignore' });
} catch (e) {
  console.log('Open this URL in your browser:', url);
}
