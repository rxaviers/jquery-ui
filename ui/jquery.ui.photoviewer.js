/*
 * jQuery UI Photoviewer @VERSION
 *
 * Copyright (c) 2009 AUTHORS.txt (http://ui.jquery.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *  jquery.effects.core.js
 *  jquery.effects.drop.js
 *  jquery.mousewheel.js (optional)
 */
(function($) {
	
	$.widget('ui.photoviewer', {
        version: "@VERSION",
        widgetEventPrefix: "photoviewer",
		_create: function() {
			var self = this;
			$.extend(this.options, $.ui.photoviewer.defaults);
			// consider event delegation to make this more dynamic
			this._anchors().click(function(event) {
				event.preventDefault();
				if (self.overlayElement || self.viewerElement)
					return;
				self._display(this);
				return false;
			});
			$(document).click(function(event) {
				// ignore right click
				if (event.button != 2)
					self.close();
			}).keydown(function(event) {
				if (!self.currentAnchor)
					return;
				switch(event.keyCode) {
					case $.ui.keyCode.ESCAPE:
						self.close();
						break;
					case $.ui.keyCode.LEFT:
						self.prev("left");
						event.preventDefault();
						break;
					case $.ui.keyCode.UP:
						self.prev("up");
						event.preventDefault();
						break;
					case $.ui.keyCode.RIGHT:
						self.next("right");
						event.preventDefault();
						break;
					case $.ui.keyCode.DOWN:
						self.next("down");
						event.preventDefault();
						break;
				}
			});
			$(window).resize(function() {
				if (!self.currentAnchor)
					return;
				self._resize(self._viewer().find("img"));
				self._position(self._viewer());
				self._shadow(self._viewer());
			});
			if ($.fn.mousewheel) {
				$(document).mousewheel(function(event, delta) {
					if (!self.currentAnchor)
						return;
					event.preventDefault();
					if (self.viewerElement.is(":animated"))
						return;
					if (delta < 0) {
						self.next("down");
					}
					if (delta > 0) {
						self.prev("up");
					}
				});
			}
		},
		
		_showLoadingIndicator: function() {
			var self = this;
			this.loadingIndicatorTimeout = setTimeout(function() {
				if (!self.loadingIndicator) {
					self.loadingIndicator = self._element("div", "ui-loading-indicator ui-corner-all").appendTo(document.body);
				}
				self._position(self.loadingIndicator);
				self.loadingIndicator.fadeIn("slow");
			}, 250);
		},
		
		_hideLoadingIndicator: function() {
			clearTimeout(this.loadingIndicatorTimeout);
			this.loadingIndicator && this.loadingIndicator.hide();
		},
		
		close: function() {
			if (!this.currentAnchor)
				return;
			var self = this;
			var anchor = this.currentAnchor;
			this.currentAnchor = null;
			
			// client has to invoke callbacks, but scope/args don't matter
			var viewer = this._viewer();
			this.options.hide.call(viewer[0], anchor, function() {
				viewer.remove();
				self.viewerElement = null;
			});
			var overlay = this._overlay();
			this.options.hideOverlay.call(overlay[0], function() {
				overlay.remove();
				self.overlayElement = null;
			});
            this._trigger( "close" );
		},
		
		next: function(direction) {
			this._rotate(":gt(", ":first", direction || "up");
		},
		
		prev: function(direction) {
			this._rotate(":lt(", ":last", direction || "down");
		},
		
		_anchors: function() {
			// if deemed necessary, cache selection here
			return this.element.find(this.options.selector);
		},
		
		_display: function(anchor, direction) {
			if (!anchor)
				return;
				
			var self = this,
				visible = this.viewerElement && this.viewerElement.is(":visible");
				
			this.currentAnchor = anchor;
			
			if (direction) {
				var previous = this._viewer();
				this.options.rotateOut.call(previous[0], {
						up: "down",
						down: "up",
						left: "right",
						right: "left"
					}[direction], function() {
					previous.remove();
				});
			}
			this._showLoadingIndicator();
			
			this._viewer("new").attr("title", anchor.title + this.options.titleSuffix).children("img").one("load", function() {
				var $this = $(this).parent();
				self._hideLoadingIndicator();
				self._resize($(this));
				self._position($this);
				self._shadow($this);
				self._overlay().attr("title", anchor.title + self.options.titleSuffix)
				if (visible) {
					self.options.rotateIn.call($this[0], direction);
				} else {
					self._overlay().css({
						left: $(window).scrollLeft(),
						top: $(window).scrollTop()
					}).each(self.options.showOverlay);
					self.options.show.call($this, anchor);
				}
				self._preloadNeighbours();
			}).attr("src", anchor.href);
            this._trigger( "display" );
		},
		
		_preloadNeighbours: function() {
			var anchors = this._anchors(),
				index = anchors.index(this.currentAnchor);
			anchors.filter(this._neighbours(anchors.length, index)).each(function() {
				new Image().src = this.href;
			});
		},
		
		_neighbours: function(index, length) {
			return ":eq(" + (index == 0 ? length - 1 : index - 1) + "), :eq(" + (index == length - 1 ? 0 : index + 1) + ")";
		},
		
		_position: function(img) {
			img.css({
				left: $(window).width() / 2 - img.outerWidth() / 2 + $(window).scrollLeft(),
				top: $(window).height() / 2 - img.outerHeight() / 2 + $(window).scrollTop()
			});
		},
		
		_resize: function(img) {
			// TODO cleanup
			var imgx = img.parent();
			if ($.browser.msie) {
				img.css("width", "auto");
			}
			imgx.css("width", "").css("height", "");
			var outerWidth = imgx.width(),
				outerHeight = imgx.height(),
				ratio = Math.min(Math.min($(window).width() - 36, outerWidth) / outerWidth, Math.min($(window).height() - 60, outerHeight) / outerHeight);
			img.css("width", "");
			//console.log(imgx.outerWidth(), imgx.outerHeight(), imgx.width(), imgx.height())
			//console.log(img, outerWidth, outerHeight, borderWidth, borderHeight, ratio)
			ratio = Math.min(ratio, 1);
				imgx.css({
					width: Math.round(ratio * outerWidth),
					height: Math.round(ratio * outerHeight)
				});
		},
		
		_rotate: function(selectorA, selectorB, direction) {
			if (!this.currentAnchor)
				return;
			var anchors = this._anchors();
			var target = anchors.filter(selectorA + anchors.index(this.currentAnchor) + ")" + selectorB)[0];
			if (!target && this.options.loop && anchors.length > 1) {
				target = anchors.filter(selectorB)[0];
			}
			this._display(target, direction);
		},
		
		_viewer: function(create) {
			if (create || !this.viewerElement) {
				this.viewerElement = this._element("div", "ui-photoviewer-container").append(this._element("img", "ui-photoviewer ui-corner-all").show()).appendTo(document.body);
			}
			return this.viewerElement;
		},
		
		_overlay: function() {
			if (!this.options.overlay)
				return $([]);
			if (!this.overlayElement) {
				this.overlayElement = this._element("div", "ui-widget-overlay").appendTo(document.body);
			}
			return this.overlayElement;
		},
		
		_element: function(type, clazz) {
			return $("<" + type + "/>").addClass(clazz).hide();
		},
		
		_shadow: function(viewer) {
			if (!$.support.canvas)
				return;
			
			viewer.children("canvas").remove();
			
			// TODO compute these hardcoded values
			var width = viewer.width() + 45,
				height = viewer.height() + 45,
				cradius = 10; 
			var canvas = $("<canvas/>").addClass("ui-photoviewer-shadow").appendTo(this._viewer())[0];
			canvas.width = width; canvas.height = height;
			var ctx = canvas.getContext("2d");
			
			
			for (var i = 0; i < 15; i++) {
				ctx.fillStyle = "rgba(150, 150, 150, " + (0.2/15*i) + ")";
				ctx.beginPath();
				ctx.moveTo(cradius + i, i);
				ctx.quadraticCurveTo(i, i, i, cradius + i);
				
				// wrong
				ctx.lineTo(i, height - cradius);
				ctx.quadraticCurveTo(i, height, cradius + i, height);
				
				ctx.lineTo(width - cradius, height);
				ctx.quadraticCurveTo(width, height, width, height - cradius);
				
				// wrong
				ctx.lineTo(width, cradius + i);
				ctx.quadraticCurveTo(width, i, width - cradius, i);
				
				ctx.lineTo(cradius, i);
				ctx.fill();
				width--;
				height--;
			}
			// TODO refactor into drawRoundedBox(width, height, cradius)
			i=0;
			ctx.fillStyle = "white";
			ctx.beginPath();
			ctx.moveTo(cradius + i, i);
			ctx.quadraticCurveTo(i, i, i, cradius + i);
			
			// wrong
			ctx.lineTo(i, height - cradius);
			ctx.quadraticCurveTo(i, height, cradius + i, height);
			
			ctx.lineTo(width - cradius, height);
			ctx.quadraticCurveTo(width, height, width, height - cradius);
			
			// wrong
			ctx.lineTo(width, cradius + i);
			ctx.quadraticCurveTo(width, i, width - cradius, i);
			
			ctx.lineTo(cradius, i);
			ctx.fill();
		}
	});
	
	$.support.canvas = !!$("<canvas/>")[0].getContext

	$.extend($.ui.photoviewer, {
		defaults: {
			loop: true,
			overlay: true,
			selector: "a[href]:has(img[src])",
			titleSuffix: " - Click anywhere to close (or press Escape), use keyboard arrows or mousewheel to rotate images",
			rotateIn: function(direction) {
				$(this).effect("drop", {
					direction: direction,
					mode: "show"
				});
			},
			rotateOut: function(direction, finished) {
				$(this).effect("drop", {
					direction: direction
				}, "normal", finished);
			},
			show: function(anchor) {
				var thumb = $(anchor),
					offset = thumb.offset();
				// TODO refactor
				var start = {
					left: offset.left,
					top: offset.top,
					width: thumb.width(),
					height: thumb.height(),
					opacity: 0
				}
				var img = $(this);
				var stop = {
					left: img.css("left"),
					top: img.css("top"),
					width: img.width(),
					height: img.height(),
					opacity: 1
				}
				$(this).css(start).show().animate(stop);
			},
			showOverlay: function() {
				$(this).fadeIn();
			},
			hide: function(anchor, finished) {
				var thumb = $(anchor),
					offset = thumb.offset();
				// TODO refactor (see above)
				var stop = {
					left: offset.left,
					top: offset.top,
					width: thumb.width(),
					height: thumb.height(),
					opacity: 0
				}
				$(this).animate(stop, finished);
			},
			hideOverlay: function(finished) {
				$(this).fadeOut(finished);
			}
		}
	});

})(jQuery);
