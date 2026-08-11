A simple, no dependency static file server that runs on NodeJS.  
Place your web files in the `base` web root folder. Files will be server from the `base/<host>` folder for each requested host.  
Optionally place your https keys (`privatekey.pem` & `certificate.pem`) in the `keys` folder to allow serving files via https.  
Start via `node staticFileServer.js` and point your browser to http://localhost:8080/hello.txt to test if the server is running provided that the `base/localhost:8080/hello.txt` file exists.  
You can create a custom `config.js` file anywhere and start the server via `node staticFileServer.js path/to/your/config.js` to replace the default config values from [config.sample.js](config.sample.js).
