const http = require('http');
const fs = require('fs');
const { execSync } = require("child_process");
const config = require(process.argv[2] || './config.sample.js');
const log = (item) => {
  const now = new Date();
  process.stdout.write(`[${now.toISOString()}]: `);
  console.log(item);
}
const getMimeType = (path) => {
  return execSync(`mimetype -b ${path}`).toString().replace('\n', '');
}
http.createServer((request, response) => {
  try {
    const benchmarkStart = new Date();
    const parts = request.url.split('/');
    const pieces = [];
    for (let item of parts) {
      if (item) {
        pieces.push(item);
      }
    }
    let path = config.base + pieces.join('/');
    let result;
    const headers = {};
    let httpCode = 200;
    if (fs.existsSync(path)) {
      result = fs.readFileSync(path, 'binary');
    }
    else {
      log(`${path} not found`);
      path = config.base + config['404'];
      if (fs.existsSync(path)) {
        result = fs.readFileSync(path, 'binary');
        headers['Location'] = '/404.html';
        httpCode = 301;
      }
      else {
        throw '404_file_not_found';
      }
    }
    const mimeType = getMimeType(path);
    if (mimeType) {
      headers['Content-Type'] = mimeType;
    }
    response.writeHead(httpCode, headers);
    response.write(result, 'binary');
    response.end();
    const benchmarkEnd = new Date();
    log(`${path} (${(benchmarkEnd - benchmarkStart)} ms)`);
  }
  catch (error) {
    log(error);
    response.writeHead(500);
    response.write(error.toString(), 'binary');
    response.end();
  }
}).listen(parseInt(config.port));
log(`static file server running at http://localhost:${config.port}`);
log('using config');
log(config);
