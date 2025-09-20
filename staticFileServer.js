const http = require('http');
const fs = require('fs');
const mimes = require('./mimes.js');
const port = process.argv[2] || 8080;
const log = (item) => {
  const now = new Date();
  process.stdout.write(`[${now.getTime()}.${now.getMilliseconds()}]: `);
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
    const parts = new URL(`http://localhost:${port}${request.url}`).pathname.split('/');
    const pieces = [];
    for (let item of parts) {
      if (item) pieces.push(item);
    }
    const path = pieces.join('/');
    const extension = '.' + pieces.pop().split('.').pop();
    const result = fs.readFileSync(path, 'binary');
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
}).listen(parseInt(port));
log(`static file server running at http://localhost:${port}`);
