'use strict';

const P = require('bluebird'),
      fs     = require( 'fs' ),
      url    = require( 'url' ),
      path   = require( 'path' ),
      http   = require( 'http' ),
      ws     = require( 'ws' ),
      Config = require( './lib/config' );

const http_server = ( req, res ) => {
	      const typemap   = {
		            '.html' : 'text/html',
		            '.js'   : 'text/javascript',
		            '.css'  : 'text/css'
	            },
	            parsedUrl = url.parse( req.url );
	      let pathname    = parsedUrl.pathname,
	            ext       = path.parse( pathname ).ext;

	      fs.exists( pathname, ( exists ) => {
		      if ( !exists ) {
			      res.statusCode = 404;
			      res.end( `File ${pathname} not found!` );
		      }

		      if ( fs.statSync( pathname ).isDirectory() ) {
			      pathname += 'index.html';
			      ext = '.html';
		      }

		      fs.readFile( `./static/${pathname}`, ( err, data ) => {
			      if ( err ) {
				      res.statusCode = 500;
				      res.end( `Error getting a file: ${err}` );
			      } else {
				      res.setHeader( 'Content-type', typemap[ ext ] || 'text/plain' );
				      res.end( data );
			      }
		      } );
	      } );
      },
      ws_server   = () => {
      },
			kafka_consumer = () => {

			};


module.exports = {
	start : () => {
		let config = Config.getInstance();
		http.createServer( http_server )
		    .listen( config.get( 'http:listen:port' ),
		             config.get( 'http:listen:host' ),
		             config.get( 'http:listen:backlog' ),
		             () => console.log( 'HTTP worker started on ' + config.get( 'http:listen:port' ) ) );
	}
};