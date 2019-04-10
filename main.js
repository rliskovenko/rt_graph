'use strict';

const fs      = require( 'fs' ),
      pmx     = require( 'pmx' ),
      program = require( 'commander' ),
      P       = require( 'bluebird' ),
      Config  = require( './lib/config' ),
      server  = require( './server.js' );

let config_filename = undefined,
    config          = undefined;

P.config( {
	          warnings        : true,
	          longStackTraces : true,
	          cancellation    : false,
	          monitoring      : false
          } );

program
		.version( '0.1.0' )
		.option( '-c --config <filename>', 'Configuration file', ( filename ) => {
			if ( fs.existsSync( filename ) && fs.statSync( filename ).isFile() ) {
				config_filename = filename;
			} else {
				throw new Error( 'Unable to access regular file: ' + filename );
			}
		} )
		.parse( process.argv );

config = Config.getInstance( config_filename );

pmx.init( { network : true, ports : true } );

server.start();

