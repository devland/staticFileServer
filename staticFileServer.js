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
  if (!pieces.length) {
    return null;
  }
  return '.' + pieces.pop().split('.').pop();
}
const handleRequest = (request, response) => {
  let filePath;
  try {
    const benchmarkStart = new Date();
    let url = new URL(path.join('http://localhost', request.url));
    let extension;
    let result;
    let headers = {};
    filePath = path.join(config.base, request.headers.host, url.pathname);
    let httpCode;
    if (fs.existsSync(filePath)) {
      let stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        url = new URL(path.join(url.href, config.index));
        headers['Location'] = url.pathname;
        httpCode = 301;
        result = '';
      }
      else {
        extension = getExtension(url.pathname);
        httpCode = 200;
        result = fs.readFileSync(filePath, 'binary');
      }
    }
    else {
      url = new URL(path.join(url.origin, config['404']));
      extension = '.' + config['404'].split('/').pop().split('.').pop();
      headers['Location'] = url.pathname;
      httpCode = 301;
      result = '';
    }
    const mimeType = getMimeType(extension);
    if (mimeType) {
      headers['Content-Type'] = mimeType;
    }
    response.writeHead(httpCode, headers);
    response.write(result, 'binary');
    response.end();
    const benchmarkEnd = new Date();
    log(`${filePath} [${httpCode}] (${(benchmarkEnd - benchmarkStart)} ms)`);
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
