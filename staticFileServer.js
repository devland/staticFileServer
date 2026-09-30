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
  const benchmarkStart = performance.now();
  let filePath;
  let httpCode;
  let extension;
  let result = '';
  let headers = {};
  const end = () => {
    response.writeHead(httpCode, headers);
    response.write(result, 'binary');
    response.end();
  }
  try {
    if (!request.url || !request.headers.host) {
      log(`[denied] request denied`);
      httpCode = 500;
      result = '[denied]';
      end();
      return;
    }
    let url = new URL(path.join('http://localhost', request.url));
    const fourOhFourPath = path.join(config.base, request.headers.host, config['404']);
    filePath = path.join(config.base, request.headers.host, url.pathname);
    if (config.ignore && config.ignore.test(filePath)) {
      log(`[ignored] ${filePath}`);
      httpCode = 500;
      result = '[ignored]';
      end();
      return;
    }
    if (fs.existsSync(filePath)) {
      let stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        url = new URL(path.join(url.href, config.index));
        headers['Location'] = url.pathname;
        httpCode = 301;
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
    }
    else {
      httpCode = 404;
      result = '[404]';
    }
    const mimeType = getMimeType(extension);
    if (mimeType) {
      headers['Content-Type'] = mimeType;
    }
    end();
    const benchmarkTime = (performance.now() - benchmarkStart).toFixed(3);
    log(`[${httpCode}] ${filePath} (${benchmarkTime} ms, ${request.socket.remoteAddress})`);
  }
  catch (error) {
    httpCode = 500;
    result = error.message;
    headers = {}
    end();
    const benchmarkTime = (performance.now() - benchmarkStart).toFixed(3);
    log(`[error] ${filePath} (${benchmarkTime} ms, ${request.socket.remoteAddress})`, error);
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
