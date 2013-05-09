/*
 * jQuery UI Hash @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Hash (to be created)
 *
 * Depends:
 *  jquery.ui.core.js
 *  jquery.ui.widget.js
 */
(function( $, undefined ) {

var hashClass = "ui-hash";

$.widget( "ui.hash", {
	version: "@VERSION",
	widgetEventPrefix: "hash",

	options: {
	},

	elements: function() {
		var elements = $([]);
		$.each(this.els, function() {
			elements = elements.add(this);
		});
		return elements;
	},

	set: function(key, el) {
		el = $(el);
		this.destroy(key);
		this.els[key] = el;
		if($.support.transition) {
			el.addClass("fade");
		}
	},

	show: function(key, cb) {
		var self = this;
		this.clear(function() {
			self.element.html(self.els[key]);
			if($.support.transition) {
				self.els[key].addClass("in");
			}
			if(cb) {
				cb();
			}
		});
	},

	clear: function(cb) {
		if($.support.transition && this.elements().hasClass("in")) {
			var self = this;
			this.elements().filter(".in")
				.one($.support.transition.end, function(ev) {
					self.element.children().detach();
					cb && cb();
				})
				.removeClass("in");
		} else {
			this.element.children().detach();
			cb && cb();
		}
	},

	destroy: function(key) {
		if(this.els[key]) {
			this.els[key].remove();
			delete this.els[key];
		}
	},

	destroy_all: function() {
		$.each(this.els, this.destroy);
	},

	_create: function() {
		this.els = {};
	}
});

})( jQuery );
