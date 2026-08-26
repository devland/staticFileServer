const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const mimes = require('./mimes.js');
const config = require(process.argv[2] || './config.sample.js');
const options = {
  key: config.https.key ? fs.readFileSync(config.https.key) : null,
  cert: config.https.cert ? fs.readFileSync(config.https.cert) : null
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
    const benchmarkStart = performance.now();
    if (!request.url || !request.headers.host) {
      log('[nope] wrong request');
      response.end();
      return;
    }
    let url = new URL(path.join('http://localhost', request.url));
    let extension;
    let result;
    let headers = {};
    const fourOhFourPath = path.join(config.base, request.headers.host, config['404']);
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
    else if (fs.existsSync(fourOhFourPath)) {
      url = new URL(path.join(url.origin, config['404']));
      extension = getExtension(url.pathname);
      headers['Location'] = url.pathname;
      httpCode = 301;
      result = '';
    }
    else {
      httpCode = 404;
      result = 'nope :(';
    }
    const mimeType = getMimeType(extension);
    if (mimeType) {
      headers['Content-Type'] = mimeType;
    }
    response.writeHead(httpCode, headers);
    response.write(result, 'binary');
    response.end();
    const benchmarkEnd = performance.now();
    log(`${filePath} [${httpCode}] (${(benchmarkEnd - benchmarkStart)} ms)`);
  }
  catch (error) {
    response.writeHead(500);
    response.write(error.message, 'binary');
    response.end();
    const benchmarkEnd = performance.now();
    log(`[error] ${filePath} (${(benchmarkEnd - benchmarkStart)} ms)`, error);
  }
}
http.createServer(handleRequest).listen(parseInt(config.ports.http));
log(`static file server running at http://localhost:${config.ports.http}`);
if (options.key && options.cert) {
  https.createServer(options, handleRequest).listen(parseInt(config.ports.https));
  log(`and at https://localhost:${config.ports.https}`);
}
log('using config');
log(config);
