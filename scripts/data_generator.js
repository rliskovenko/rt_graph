'use strict';

const _       = require( 'lodash' ),
      fs      = require( 'fs' ),
      path    = require( 'path' ),
      program = require( 'commander' ),
      Kafka   = require( 'kafkajs' ),
      Config  = require( '../lib/config' ),
      UUID    = require( 'uuid' ),
      rwc     = require( 'random-weighted-choice' );

let template_data = undefined,
    config        = undefined,
    broker        = undefined,
    topic         = undefined,
    num_messages  = 120,
    msg_interval  = 1000,
    eventTimer    = undefined;

program
		.version( '0.1.0' )
		.option( '-c --config <path>', 'Message template', config_fname => {
			if ( fs.existsSync( config_fname ) && fs.statSync( config_fname ).isFile() ) {
				config = Config.getInstance( config_fname );
			} else {
				throw new Error( 'Unable to access regular file: ' + config_fname );
			}
		} )
		.option( '-t --template <path>', 'Message template', template_fname => {
			if ( fs.existsSync( template_fname ) && fs.statSync( template_fname ).isFile() ) {
				template_data = JSON.parse( fs.readFileSync( template_fname ) );
			} else {
				throw new Error( 'Unable to access regular file: ' + template_fname );
			}
		} )
		.option( '-m --messages <num_messages>', 'Amount of messages', msgs => {
			num_messages = parseInt( msgs );
		} )
		.option( '-i --interval <msg_interval>', 'Interval between messages in ms', interval => {
			msg_interval = parseInt( interval );
		} )
		.parse( process.argv );

// Support only flat Objects, no recursion parsing
function create_message( template ) {
	let r = {};
	_.forOwn( template, ( v, k ) => {
		if ( typeof v === 'object' && _.has( v, '_type' ) ) {
			if ( _.get( v, '_type' ) === 'list' ) {
				let l  = v.list;
				r[ k ] = v.list[ _.random( 0, v.list.length - 1 ) ];
			}
			if ( _.get( v, '_type' ) === 'map' ) {
				let a  = _.entries( v.map ).map( v => {
					return { weight : v[ 1 ], id : v[ 0 ] };
				} );
				r[ k ] = rwc( a );
			}
			if ( _.get( v, '_type' ) === 'object' ) {
				r[ k ] = {};
				_.forOwn( v, ( v1, k1 ) => {
					if ( k1 !== '_type' ) {
						r[ k ][ k1 ] = create_message( v1 );
					}
				} );
			}
			if ( _.get( v, '_type' ) === 'date' ) {
				r[ k ] = new Date().toISOString();
			}
		} else {
			r[ k ] = v;
		}
	} );
	return r;
}

const run = async () => {
	await producer.connect();
	eventTimer = setInterval( async () => {
		if ( num_messages > 0 ) {
			num_messages--;
			let key = _.random( 0, 10 );
			let msg = {
				topic    : config.get( 'kafka:topic' ),
				messages : [ {
					key   : `key-${key}`,
					value : JSON.stringify( create_message( template_data ) )
				} ]
			};
			console.dir( msg.messages[ 0 ].value );
			producer.send( msg )
			        .catch( e => console.error( `${e.message}`, e ) );
		} else {
			clearInterval( eventTimer );
			producer.disconnect();
			process.exit( 0 );
		}
	}, msg_interval );
};

const kafka    = new Kafka.Kafka( {
	                                  brokers : config.get( 'kafka:brokers' ).split( ',' )
                                  } ),
      producer = kafka.producer();


run().catch( e => console.error( `${e.message}`, e ) );
