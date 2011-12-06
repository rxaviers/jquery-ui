/*
 * jQuery UI Editable @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Editable (to be created)
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.button.js
 *	jquery.ui.datepicker.js
 */
(function( $, undefined ) {

var editableClass = "ui-editable ui-widget",
	formClass = "ui-editable-form",
	buttonClass = "ui-editable-button",
	buttonsAreaClass = "ui-editable-buttons-area",
	cancelClass = "ui-editable-cancel",
	inputClass = "ui-editable-input",
	inputAreaClass = "ui-editable-input-area",
	placeholderClass = "ui-editable-placeholder",
	saveClass = "ui-editable-save",
	hoverableClass = "ui-widget-content ui-state-default ui-corner-all",

	cancelIconClass = "ui-icon-closethick",
	saveIconClass = "ui-icon-disk",

	activeStateClass = "ui-state-active",
	highlightStateClass = "ui-state-highlight"

$.widget( "ui.editable", {
	version: "@VERSION",
	widgetEventPrefix: "edit",

	options: {
		event: "click",
		editor: "text",
		placeholder: "Click to edit"
	},

	start: function() {
		if ( !this._editing ) {
			this._edit();
		}
	},

	save: function() {
		$( "form", this.element ).submit();
	},

	cancel: function() {
		this._cancel();
	},

	_create: function() {
		var custom_events = {};
		// Show placeholder if this.element is empty.
		if ( !this.value( $.trim( this.element.text() ) ) ) {
			this._show();
		}
		this._z_index = this.element.css( "z-index" );
		this._getButtonOptions();
		this._getEditorOptions();
		// First bind custom_events, then this._events. Changing that order may cause problems (_start must precede _events[click] when this.options.event is click).
		custom_events[this.options.event] = "_start";
		this._bind( custom_events );
		this._bind( this._events );
		this.element.addClass( editableClass );
	},

	_getButtonOptions: function() {
		this._buttonsPosition = "e";
		if( typeof this.options.buttons === "undefined" ) {
			this.options.buttons = {
				save: $.ui.editable.defaults.saveButton,
				cancel: $.ui.editable.defaults.cancelButton
			};
		}
	},

	_getEditorOptions: function() {
		var i;
		if ( typeof this.options.editor === "string" ) {
			this._editor = $.ui.editable.editors[ this.options.editor ];
			this._editorOptions = {};
		}
		else if ( typeof this.options.editor === "object" ) {
			for(i in this.options.editor) {
				this._editor = $.ui.editable.editors[ i ];
				this._editorOptions = this.options.editor[i];
			}
		}
		if ( ! ( typeof this._editor === "object" && this._editor.element && this._editor.bind && this._editor.value ) ) {
			throw "jQuery UI Editable: \"" + ( i || this.options.editor ) + "\" is an invalid editor.";
		}
	},

	_events: {
		click: function( event ) {
			var $this = $( event.target );
		
			if ( !this._editing ) {}
			else if ( $this.hasClass( saveClass ) || $this.parent().hasClass( saveClass ) ) {
				this.save();
				return false;
			}
			else if ( $this.hasClass( cancelClass ) || $this.parent().hasClass( cancelClass ) ) {
				this._cancel( event );
				return false;
			}
		},
		mouseenter: function( event ) {
			if ( !this._editing ) {
				this.element.addClass( highlightStateClass );
			}
		},
		mouseleave: function( event ) {
			this.element.removeClass( highlightStateClass );
		},
		keydown: function( event ) {
			var keyCode = $.ui.keyCode;
			switch ( event.keyCode ) {
				case keyCode.ENTER:
					if(this._skipEnterSubmit) {
						break;
					}
					this.save();
					return false;
				case keyCode.ESCAPE:
					this._cancel();
					return false;
			}
		}
	},
	
	_start: function( event ) {
		if ( !this._editing ) {
			this.element.removeClass( highlightStateClass );
			this._edit();
		}
	},

	_show: function() {
		this._editing = undefined;
		if ( this._z_index == "auto" ) {
            // Rolling back element z-index.
			this.element.css( "z-index", "auto" );
		}
		this.element.html( this.value() || this._placeholder() );
	},

	_edit: function() {
		this._editing = true;
		if ( this._z_index == "auto" ) {
            // Create a new stacking context on element by setting its z-index from auto to 0.
			this.element.css( "z-index", 0 );
		}
		this.element.html( this._form() );
		this._adjustInputWidth();
		this._formEvents();
	},

	_placeholder: function() {
		return $( "<span></span>" )
			.addClass( placeholderClass )
			.html( this.options.placeholder );
	},

	_form: function() {
		var form = $( "<form></form>" ).addClass( formClass );
		this.frame = form;
		this._hoverable( this.frame.addClass( hoverableClass ) );
		$( "<div></div>" )
			.addClass( inputAreaClass )
			.append( this._editor.element( this ) )
			.appendTo( form );
		if( this.options.buttons ) {
			this._drawButtons().appendTo( form );
		}
		return form;
	},

	_drawButtons: function( form ) {
		var i, buttons = {}, ordered_buttons = $([]),
			buttonsArea = $( "<div></div>" ).addClass( buttonsAreaClass );
		for( i in this.options.buttons ) {
			buttons[ i ] = this._drawButton[ i ]( this.options.buttons[ i ] )
				.appendTo( buttonsArea );
			ordered_buttons = ordered_buttons.add( buttons[ i ] );
		}
		if( /s/.test(this._buttonsPosition) ) {
			buttonsArea.css({bottom: 0});
		}
		else {
			buttonsArea.css({top: 0});
		}
		if( /e/.test(this._buttonsPosition) ) {
			buttonsArea.css({right: 0});
		}
		else if( /w/.test(this._buttonsPosition) ) {
			buttonsArea.css({left: 0});
		}
		return buttonsArea;
	},

	_drawButton: {
		save: function( options ) {
			// Using A links, so it doesn't count on form tab order.
			return $( "<a></a>" )
				.button( options )
				.removeClass( "ui-corner-all" )
				.addClass( saveClass );
		},

		cancel: function( options ) {
			return $( "<a></a>" )
				.button( options )
				.removeClass( "ui-corner-all" )
				.addClass( cancelClass );
		}
	},

	_adjustInputWidth: function() {
		var buttonsWidth, buttonsHeight, margin = {},
			buttonsArea = $( "." + buttonsAreaClass, this.frame );
		if( /n/.test(this._buttonsPosition) ) {
			margin["margin-top"] = buttonsArea.outerHeight();
		}
		else if( /s/.test(this._buttonsPosition) ) {
			margin["margin-bottom"] = buttonsArea.outerHeight();
		}
		else if( /e/.test(this._buttonsPosition) ) {
			margin["margin-right"] = buttonsArea.outerWidth();
		}
		else if( /w/.test(this._buttonsPosition) ) {
			margin["margin-left"] = buttonsArea.outerWidth();
		}
		$( "." + inputAreaClass, this.frame ).css( margin );
	},

	_formEvents: function() {
		var self = this;
		$( "form", this.element )
			.submit( function( event ) {
				self._save.call( self, event, self._editor.value( self, this ) );
				return false;
			});
		this._editor.bind( this );
	},

	_save: function( event, newValue ) {
		var hash = {
			value: newValue
		};

		if ( this._trigger( "save", event, hash ) === false ) {
			return;
		}
		if ( this.value() !== newValue ) {
			if ( this._trigger( "change", event, hash ) === false ) {
				return;
			}
			this.value( newValue );
		}
		this._show();
	},

	_cancel: function( event ) {
		this._show();
		this._trigger( "cancel", event );
	},

	value: function( newValue ) {
		if ( arguments.length ) {
			this._value = newValue;
		}
		return this._value;
	}
});

$.ui.editable.editors = {
	text: {
		element: function( editable ) {
			return $( "<input/>" )
				.attr( "type", "text" )
				.val( editable.value() )
				.addClass( inputClass );
		},
		bind: function( editable ) {
			var self = editable;
			$( "input", editable.element )
				.focus( function() {
					self.frame.addClass( activeStateClass );
				})
				.blur( function() {
					self.frame.removeClass( activeStateClass );
				})
				.focus();
		},
		value: function( editable, form ) {
			return $( "input", form ).val();
		}
	},
	textarea: {
		element: function( editable ) {
			editable._skipEnterSubmit = true;
			editable._buttonsPosition = "se";
			return $( "<textarea></textarea>" )
				.val( editable.value().replace(/<br>|<br\/>|<br \/>/gi, "\n") )
				.addClass( inputClass );
		},
		bind: function( editable ) {
			var self = editable;
			$( "textarea", editable.element )
				.focus( function() {
					self.frame.addClass( activeStateClass );
				})
				.blur( function() {
					self.frame.removeClass( activeStateClass );
				})
				.focus();
		},
		value: function( editable, form ) {
			return $( "textarea", form ).val().replace(/\r\n|\r|\n/g, "<br/>");
		}
	},
	select: $.noop,
	spinner: $.noop,
	datepicker: {
		element: function( editable ) {
			return $.ui.editable.editors.text.element( editable );
		},
		bind: function( editable ) {
			$( "input", editable.element ).datepicker( editable._editorOptions );
			$.ui.editable.editors.text.bind( editable );
		},
		value: function( editable, form ) {
			return $.ui.editable.editors.text.value( editable, form );
		}
	}
};

$.ui.editable.defaults = {
	saveButton: {
		label: "Save",
		icons: {
			primary: saveIconClass
		},
		text: false
	},
	cancelButton: {
		label: "Cancel",
		icons: {
			primary: cancelIconClass
		},
		text: false
	}
};

})( jQuery );
