const nconf      = require( 'nconf' ),
      nconf_yaml = require( 'nconf-yaml' ),
      Config     = (() => {
	      let filename, cfg;

	      function init_config( f ) {
		      if ( f ) {
			      filename = f;
		      }
		      if ( !cfg ) {
			      cfg = nconf.file( {
				                        file   : filename,
				                        format : nconf_yaml
			                        } );
		      }
		      return cfg;
	      }

	      return {
		      getInstance : ( f ) => {
			      if ( f ) {
				      init_config( f || filename );
			      }

			      return nconf;
		      }
	      };
      })();

module.exports = Config;