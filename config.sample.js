module.exports = {
  ports: {
    http: 8080,
    https: 8443
  },
  base: './base', // web root folder; additional folders need to be created within; one for each request.headers.host; files will be server from those folders for each request.headers.host
  https: { // optional; used to enable https
    key: './keys/privatekey.pem',
    cert: './keys/certificate.pem'
  },
  index: 'index.html',
  '404': '404.html' // file to serve in case of a 404 error; file must be located in the base/<request.headers.host> folder
}
