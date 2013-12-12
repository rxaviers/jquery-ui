define([
	"jquery"
], function( $ ) {

var reset, jshintLoaded;

window.TestHelpers = {};

reset = QUnit.reset;
QUnit.reset = function() {
	// Ensure jQuery events and data on the fixture are properly removed
	jQuery("#qunit-fixture").empty();
	// Let QUnit reset the fixture
	reset.apply( this, arguments );
};


QUnit.config.requireExpects = true;

/*
// TODO: Add back the ability to test against minified files
// see QUnit.urlParams.min usage below
QUnit.config.urlConfig.push({
	id: "min",
	label: "Minified source",
	tooltip: "Load minified source files instead of the regular unminified ones."
});
*/

QUnit.config.urlConfig.push({
	id: "nojshint",
	label: "Skip JSHint",
	tooltip: "Skip running JSHint, e.g. within TestSwarm, where Jenkins runs it already"
});

TestHelpers.onFocus= function( element, onFocus ) {
	var fn = function( event ){
		if( !event.originalEvent ) {
			return;
		}
		element.unbind( "focus", fn );
		onFocus();
	};

	element.bind( "focus", fn )[ 0 ].focus();
};

TestHelpers.forceScrollableWindow = function( appendTo ) {
	return $( "<div>" ).css({
		height: "10000px",
		width: "10000px"
	}).appendTo( appendTo || "#qunit-fixture" );
};

/*
 * Taken from https://github.com/jquery/qunit/tree/master/addons/close-enough
 */
window.closeEnough = function( actual, expected, maxDifference, message ) {
	var passes = (actual === expected) || Math.abs(actual - expected) <= maxDifference;
	QUnit.push(passes, actual, expected, message);
};

});
