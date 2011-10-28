/*
 * jQuery UI Stack @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Stack (to be created)
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

var hashClass = "ui-stack";

$.widget( "ui.stack", {
	version: "@VERSION",
	widgetEventPrefix: "stack",

	options: {
	},

	push: function(content) {
		this.content_els.push(content);
		this.element.children().detach();
		this.element.html(content);
	},

	pop: function(ev) {
		this.content_els.pop();
		this.element.html(this.content_els[this.content_els.length - 1]);
		this.content_ready();
	},

	_create: function() {
		this._reset();
	},

	_reset: function() {
		this.content_els = [];
	}
});

})( jQuery );
