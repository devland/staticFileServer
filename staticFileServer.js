const http = require('http');
const fs = require('fs');
const mimes = require('./mimes.js');
const config = require(process.argv[2] || './config.sample.js');
const log = (item) => {
  const now = new Date();
  process.stdout.write(`[${now.toISOString()}]: `);
  console.log(item);
}
const getMimeType = (extension) => {
  for (let item of mimes) {
    if (item.extensions.includes(extension)) {
      return item.type;
    }
  }
  return null;
}
http.createServer((request, response) => {
  try {
    const benchmarkStart = new Date();
    const parts = new URL(`http://localhost:${config.port}${request.url}`).pathname.split('/');
    const pieces = [];
    for (let item of parts) {
      if (item) {
        pieces.push(item);
      }
    }
    let path = pieces.join('/');
    const extension = '.' + pieces.pop().split('.').pop();
    let result;
    if (fs.existsSync(config.base + path)) {
      result = fs.readFileSync(config.base + path, 'binary');
    }
    else {
      path = config['404'];
      result = fs.readFileSync(config.base + path, 'binary');
    }
    const headers = {};
    const mimeType = getMimeType(extension);
    if (mimeType) {
      headers['Content-Type'] = mimeType;
    }
    response.writeHead(200, headers);
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
