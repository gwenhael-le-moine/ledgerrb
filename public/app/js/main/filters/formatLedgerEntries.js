app.filter( 'formatLedgerEntries',
	    [ '$sce',
	      function( $sce ) {
		return function( entries ) {
		    return $sce.trustAsHtml( '<table><tr>'
					     + entries
					     .map( function( entry ) {
						 return '<td>'
						     + entry.account
						     + '</td><td>'
						     + entry.amount
						     +' €</td>';
					     } )
					     .join( '</tr><tr>' )
					     + '</tr></table>' );
		};
	    } ] );
