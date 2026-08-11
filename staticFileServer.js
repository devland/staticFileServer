const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const mimes = require('./mimes.js');
const config = require(process.argv[2] || './config.sample.js');
const options = {
  key: fs.readFileSync(config.https.key),
  cert: fs.readFileSync(config.https.cert)
}
const log = function () {
  const now = new Date();
  process.stdout.write(`[${now.toISOString()}]: `);
  for (let item of arguments) {
    console.log(item);
  }
}
const getMimeType = (extension) => {
  for (let item of mimes) {
    if (item.extensions.includes(extension)) {
      return item.type;
    }
  }
  return null;
}
const getExtension = (path) => {
  const parts = path.split('/');
  const pieces = [];
  for (let item of parts) {
    if (item) {
      pieces.push(item);
    }
  }
  return '.' + pieces.pop().split('.').pop();
}
const handleRequest = (request, response) => {
  let filePath;
  try {
    const benchmarkStart = new Date();
    const url = new URL(`http://localhost/${request.url}`);
    filePath = path.join(config.base, request.headers.host, url.pathname);
    const extension = getExtension(url.pathname);
    let result;
    const headers = {};
    let httpCode = 200;
    if (fs.existsSync(filePath)) {
      result = fs.readFileSync(filePath, 'binary');
    }
    else {
      log('[404] ' + filePath);
      filePath = path.join(config.base, request.headers.host, config['404']);
      result = fs.readFileSync(filePath, 'binary');
      extension = '.' + config['404'].split('/').pop().split('.').pop();
      headers['Location'] = '/404.html';
      httpCode = 301;
    }
    const mimeType = getMimeType(extension);
    if (mimeType) {
      headers['Content-Type'] = mimeType;
    }
    response.writeHead(httpCode, headers);
    response.write(result, 'binary');
    response.end();
    const benchmarkEnd = new Date();
    log(`${filePath} (${(benchmarkEnd - benchmarkStart)} ms)`);
  }
  catch (error) {
    log(filePath, error);
    response.writeHead(500);
    response.write(error.toString(), 'binary');
    response.end();
  }
}
http.createServer(handleRequest).listen(parseInt(config.ports.http));
log(`static file server running at http://localhost:${config.ports.http}`);
if (fs.existsSync(config.https.key) && fs.existsSync(config.https.cert)) {
  https.createServer(options, handleRequest).listen(parseInt(config.ports.https));
  log(`and at https://localhost:${config.ports.https}`);
}
log('using config');
log(config);
