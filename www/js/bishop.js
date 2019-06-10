var app = {
	version: '1.2.0pre14', // change version here and in config.xml, near top
	backFunction: null,
	enableBibleSync : true,
	bibleSyncRefs : [],
	isPopupShowing : false,
	basicStartupStage : 0,
	currentVerseKey : false,
	firstTime: false,
	waitingInstall: null,
	lastDisplayMods: null,
	showingFootnotes: false,
	greekDefMods : [],
	hebrewDefMods : [],
	menuWidth : 16,
	topBarHeight : 3,
	mods : [],
	noCSSTransitions : false,

	// ------------- local sample data for testing in a web browser and not on a phone with a real SWORD engine installation
	localFixup : function() {
console.log('using localFixup instead of real SWORD plugin');
		var sampleModInfo = { category : 'Biblical Texts', name : 'KJV', features: [] };
		var sampleVerseKey = { testament : 2, book : 4, chapter : 3, verse: 16, chapterMax: 23, verseMax: 40, bookName : 'John', osisRef: 'John.3.16', shortText : 'John 3:16', bookAbbrev : 'John' };
		var sampleVerse = { verse : $.extend(true, {}, sampleVerseKey), preVerse : '', text:'For God so loved the world that He gave His only Son that whosoever believes in Him would have everlasting life.'}
		var sampleModule = { name : 'KJV', description : 'King James Version, 1763', direction : 'LtoR', shortCopyright : '(c) 1611, The Crown', features : [], shortPromo:'Visit Great Britain for dreary skies and bad food', setKeyText : function(k, callback) {if(callback)callback();}, getKeyText : function() { return 'Jn.2.2';}, getVerseKey: function(callback) { if(callback)callback(sampleVerseKey);return sampleVerseKey; }, getBookNames : function(callback) { var bn = ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Matt', 'Mark', 'Luke', 'John']; if(callback)callback(bn);  return bn;}, getRenderChapter : function(mod, callback) { var rc = []; for (var i = 0; i<20; ++i) { var v = $.extend(true, {},sampleVerse); v.verse.verse=i+1; rc.push(v); } if(callback)callback(rc);}, getRenderHeader : function(callback) { if(callback)callback('');return '';} };
		SWORD = {
			CATEGORY_BIBLES : 'Biblical Texts',
			version : 'mockup',
			mgr : {
				getModInfoList : function(callback) { if(callback)callback([sampleModInfo]); return [sampleModInfo]; },
				getModuleByName : function(name, callback) { if(callback)callback(sampleModule); return sampleModule; },
				startBibleSyncListener : function(appName, userName, passphrase, callback) {},
				getExtraConfigValue : function(x, y, callback) { callback(y); },
				addExtraConfig : function(x, callback) { callback(); },
				getAvailableLocales : function(callback) { callback([]); },
				setJavascript : function(x) { },
				translate : function(x, y, callback) { callback?callback(x):y(x); },
				setDefaultLocale : function(x, callback) { callback(); }
			},
			installMgr : {
				getRemoteSources : function(callback) { if(callback)callback(['CrossWire']); return ['CrossWire']; }
			}
		};
		MobileAccessibility = {
			setTextZoom : function(zoomLevel, callback) { callback(zoomLevel); }
		};
		app.main();
	},
	// ------------- end of local sample data -----------------------
	activeWindow : null,
	initialize: function() {

		// for old browsers which don't yet support string.startsWith
		if (!String.prototype.startsWith) {
			Object.defineProperty(String.prototype, 'startsWith', {
				value: function(search, pos) {
					pos = !pos || pos < 0 ? 0 : +pos;
					return this.substring(pos, pos + search.length) === search;
				}
			});
		}
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
//if (typeof SWORD == 'undefined') app.localFixup(); else console.log('Using real SWORD plugin');
		$(document).on('click','a', function(e) {
console.log('**** a click event from: ' + $(this).prop('outerHTML'));
			e.preventDefault();
			var elem = $(this);
			var url = elem.attr('href');
			if (url.indexOf('http://') != -1 || url.indexOf('https://') != -1) {
				window.open(url, '_blank');
			}
console.log('**** a click event url: ' + url);
			// check for display verse number click and make this verse the current verse
			if (url == 'javascript:void(0);' && $(this).parent() && $(this).parent().parent() && $(this).parent().parent().hasClass('verse')) {
console.log('**** a click event for updating current verse');
				app.setCurrentVerseNode($(this).parent().parent());
			}
			// check for Bible reference click and jump there
			if (url.indexOf('passagestudy.jsp') !== -1) {
				var b = url.indexOf('key=');
				if (b < 0) b = url.indexOf('value=');
				if (b > -1) {
					b = url.indexOf('=',b)+1;
					var e = url.indexOf('&', b);
					if (e < 0) e = url.indexOf('#', b);
					if (e < 0) e = url.length;
					var key = url.substring(b,e);
					key = decodeURI(key);
console.log('clicked key: ' + key);
					app.setCurrentKey(key, function() {
						app.show();
					});

				}
			}
			return false;
		});
	},
	handleIntent: function(intent) {
console.log('**** Received Intent. Object: ' + JSON.stringify(intent));
		if (intent.extras) {
		var confBlob = intent.extras['android.intent.extra.TEXT'];
console.log('**** Received Intent. confBlob: ' + confBlob);
		if (confBlob) {
			SWORD.mgr.addExtraConfig(confBlob, function(newMods) {
console.log('**** newMods.length: ' + newMods.length);
				app.waitingInstall = newMods;
				setTimeout(function() {
					app.displayCurrentChapter();
				}, 1000);
			});
		}
		}
	},

	installNewModules: function(newMods) {
		var installNewMods = function(mods, i) {
			if (!i) i = 0;
			if (i >= mods.length) {
				app.show();
				return;
			}
console.log('**** installing if mod doesn\'t exist: ' + mods[i]);
			SWORD.mgr.getModuleByName(mods[i], function(n) {
console.log('**** back from getModuleByName: ' + JSON.stringify(n));
				if (!n) {
console.log('**** mod doesn\'t exist: ' + mods[i]);
					app.installModule(mods[i], function() {
						app.setCurrentMod2(mods[i]);
						installNewMods(mods, ++i);
					});
				}
				else {
					app.setCurrentMod2(mods[i]);
					installNewMods(mods, ++i);
				}
			});
		};
		installNewMods(newMods);
	},

	bindEvents: function() {
		document.addEventListener("backbutton", this.handleBackButton, false);
		document.addEventListener("menubutton", function() { app.currentWindow.openMenu(); }, false);
	},
	onDeviceReady: function() {
		app.noCSSTransitions = (device.platform == 'Android' && device.version.startsWith('4.'));
		app.bindEvents();
		app.main();
		window.addEventListener("message", function(event) {
			console.log('received message event: ' + event);
			var msg = event.data;
console.log('message: ' + msg);
			if (msg.action == 'preparingImage') {
				SWORD.mgr.translate('Preparing image for image viewer...', function(t) {
					window.plugins.toast.showLongCenter(t);
				});
			}
			else if (msg.action == 'showImage') {
				var options = {
				    share: true, // default is false
				    closeButton: false, // default is true
				    copyToReference: true, // default is false
				    headers: '',  // If this is not provided, an exception will be triggered
				    piccasoOptions: { } // If this is not provided, an exception will be triggered
				};

				// showImageURL for remote images doesn't seem to work
				if (!msg.imageData) {
console.log('showing image by url: ' + msg.imageURL);
					SWORD.mgr.translate('Preparing image for image viewer...', function(t) {
						window.plugins.toast.showLongCenter(t);
					});
					imageTools.getImageData(msg.imageURL, function(imageData) {
						SWORD.mgr.translate('Loading image into image viewer...', function(t) {
							window.plugins.toast.showLongCenter(t);
console.log('showing image with showImageBase64: ' + imageData.substring(0,5)+'...');
							PhotoViewer.show('data:image/png;base64,'+imageData, msg.name, options);
//							FullScreenImage.showImageBase64(imageData, msg.name, 'png');
						});
					});
				}
				else {
					SWORD.mgr.translate('Loading image into image viewer...', function(t) {
						window.plugins.toast.showLongCenter(t);
console.log('showing image by data: ' + msg.imageData.substring(0,10));
						PhotoViewer.show('data:image/png;base64,'+msg.imageData, msg.name, options);
//						FullScreenImage.showImageBase64(msg.imageData, msg.name, msg.type);
					});
				}
			}
		}, false);
		if (window.plugins.intent) {
			window.plugins.intent.setNewIntentHandler(function(intent) {
				app.handleIntent(intent);
			});
			window.plugins.intent.getCordovaIntent(
				function(intent) {
					app.handleIntent(intent);
				},
				function () {
					alert("Error: Cannot handle open with file intent");
				}
			);
		}
	},
	handleBackButton: function() {
		if (app.backFunction) {
			app.backFunction();
			app.backFunction = null;
		}
		else if (app.isPopupShowing) app.popupHide();
		else if (app.currentWindow != app) app.show();
		else if ($('#openTopBar').is(':checked')) app.closeTopBar();
		else if (!app.closeMenu()) navigator.app.exitApp();
	},
	onMainClick : function(o) {
		// close the menu, if it didn't need to be closed then...
		if (!app.closeMenu()) {
			// close the topBar, if it didn't need to be closed then...
			if (!$('#openTopBar').is(':checked'))	{ app.openTopBar();  }
			else 					{ app.closeTopBar(); }
		}
	},
	show: function() {
		
		if (!window.localStorage.getItem('bibleSyncUserName')) window.localStorage.setItem('bibleSyncUserName', 'BishopUser');
		if (!window.localStorage.getItem('bibleSyncPassphrase')) window.localStorage.setItem('bibleSyncPassphrase', 'BibleSync');
		if (!window.localStorage.getItem('mainViewType')) window.localStorage.setItem('mainViewType', 'Bibles');
		if (!window.localStorage.getItem('appLocale') && navigator.globalization) {
			navigator.globalization.getLocaleName(function(language) {    
				var localeName = language.value;
				if (localeName.indexOf('-') > -1) localeName = localeName.substring(0,localeName.indexOf('-'));
console.log('*********** Initially setting locale to: ' + localeName);
				window.localStorage.setItem('appLocale', localeName);
			},
			function() {
				window.localStorage.setItem('appLocale', 'en');
			});
		}
		app.setAppLocale(false, function() {
			app.showingFootnotes = window.localStorage.getItem('showingFootnotes') == 'true';
console.log('*** read app.showingFootnotes is set to ' + app.showingFootnotes);
			app.mainViewType = window.localStorage.getItem('mainViewType');
			app.setCurrentKey(app.getCurrentKey());
			app.currentWindow = app;
			var main = $('#main');
console.log("*** in show. main.length: " + main.length);
		var t = '';
		t += '<div id="textDisplay"></div>';
		t += '<input type="checkbox" class="openTopBar" id="openTopBar">';
		t += '<div id="topBarBand" class="topBarBand">';
  		t += 	'<div style="display:table-cell;width:3.8em;height:100%;vertical-align:middle;padding-right:.2em;padding-bottom:.4em;">&nbsp;</div>';
  		t += 	'<div style="display:table-cell;padding-left:.2em;height:100%;vertical-align:middle;padding-right:.2em;padding-bottom:.4em;" id="keyDisplay" onclick="app.closeMenu();app.closeTopBar(); app.selectKey(); return false;"></div>';
  		t += 	'<div style="display:table-cell;padding-right:2em;padding-top:.2em;" onclick="app.shareVerse(); return false;"><img style="height:2.3em;opacity:0.80;" src="img/ic_action_share.png"/></div>';
  		t += 	'<div style="display:table-cell;color:white;padding-left:.4em;padding-right:.4em;height:100%;vertical-align:middle;padding-bottom:.4em;font-size: 175%;" class="notesButton">✎</div>';
		t += '</div>';
		t += '<input type="checkbox" class="openSidebarMenu" id="openSidebarMenu">';
		t += '<label for="openSidebarMenu" class="sidebarIconToggle">';
		t += 	'<div class="spinner diagonal part-1"></div>';
		t += 	'<div class="spinner horizontal"></div>';
		t += 	'<div class="spinner diagonal part-2"></div>';
		t += '</label>';
		t += '<div class="menupanel"></div>';
		t += '<div id="footnotes" class="toshow"></div>';
		t += '<div id="altDisplay"></div>';
		t += '<div id="aux" class="dropdown-content"></div>';
/*
  <div class="notesButton" style="display:table-cell;float:right;padding-right:1em;">X⏿<X</div>
  <div id="sidebarMenu">
    <ul class="sidebarMenuInner">
      <li>Jelena Jovanovic <span>Web Developer</span></li>
      <li><a href="https://vanila.io" target="_blank">Company</a></li>
      <li><a href="https://instagram.com/plavookac" target="_blank">Instagram</a></li>
      <li><a href="https://twitter.com/plavookac" target="_blank">Twitter</a></li>
      <li><a href="https://www.youtube.com/channel/UCDfZM0IK6RBgud8HYGFXAJg" target="_blank">YouTube</a></li>
      <li><a href="https://www.linkedin.com/in/plavookac/" target="_blank">Linkedin</a></li>
    </ul>
  </div>
		var t = `
<div id="textDisplay"></div>
<div class="menupanel"></div>
<a href="javascript:void(0);" class="menutab toshow">&nbsp;</a>
<div id="footnotes" class="toshow"></div>
<div id="altDisplay"></div>
<div id="aux" class="dropdown-content"></div>';
`;
*/
			$(main).html(t);
			$('.notesButton').on('click', function() {
				if (!app.showingFootnotes)	{ app.openFootnotes();  }
				else 				{ app.closeFootnotes(); }
			});

			// for old phones which need javascript help for transitions
			if (app.noCSSTransitions) {

				$('#openSidebarMenu').on('change', function() {
					if ($('#openSidebarMenu').is(':checked')) {
console.log('opening sidebar');
						$( ".menutab, .menupanel" ).animate({ left: 0 }, 250, function() {
						});
						// this is for some refresh bug in older
						// Android devices
						$('.menupanel').css('display', 'none');
						setTimeout(function() {
							$('.menupanel').css('display', 'block');
						}, 100);
						// end of silly workaround for older Android devices
					}
					else {
console.log('closing sidebar');
						$( ".menutab, .menupanel" ).animate({ left: '-'+app.menuWidth+'em' }, 250, function() { });
					}
				});
				$('#openTopBar').on('change', function() {
					if ($('#openTopBar').is(':checked')) {
console.log('opening topbar');
						setTimeout(function() {
						$('.topBarBand').animate({ top: 0 }, 250, function() { });
						$('.sidebarIconToggle').animate({ top: '1em' }, 250, function() { });
						}, 100);
						// this is for some refresh bug in older Android devices
						$('.topBarBand, .sidebarIconToggle').css('display', 'none');
						setTimeout(function() {
							$('.topBarBand, .sidebarIconToggle').css('display', 'block');
						}, 100);
						// end of silly workaround for older Android devices
					}
					else {
console.log('closing topbar');
						setTimeout(function() {
						$(".topBarBand, .sidebarIconToggle").animate({ top: '-'+app.topBarHeight+'em' }, 250, function() { });
						}, 100);
					}
				});
				app.closeMenu();
				$('#openSidebarMenu').change();
				app.closeTopBar();
				$('#openTopBar').change();
			}

			var textDisplay = $('#textDisplay');
	console.log("*** in show. after setting textDisplay.length: " + textDisplay.length);
			$(textDisplay).scroll(app.textScroll).on('click', app.onMainClick);
			$('#altDisplay').scroll(app.altScroll).on('click', app.onMainClick);
			SWORD.mgr.getModInfoList(function(mods) {
				app.mods = mods;
				app.setupMenu(function() {
					$('#currentMod1').val(app.getCurrentMod1());
					$('#currentMod2').val(app.getCurrentMod2());
					$('#currentMod3').val(app.getCurrentMod3());
console.log('*** app.showingFootnotes is set to ' + app.showingFootnotes);
					if (app.showingFootnotes) app.openFootnotes();
					else			  app.closeFootnotes();
					if (app.firstTime) app.showFirstTime();
					else app.displayCurrentChapter(function() {
						app.setAppLocale(false, function() {
							$('#keyDisplay').html(app.getCurrentKey());
						});
					});
				});
			});
		});
	},
	setCurrentVerseNode: function(verseNode) {
//console.log('***** setCurrentVerseNode, verseNode:' + $(verseNode).prop('outerHTML'));
		if (!$(verseNode).hasClass('currentVerse')) {
//console.log('***** setCurrentVerseNode: does not have currentVerse class');
			var verseNum = $(verseNode).find('.versenum :first').text().trim();
			var verse = app.currentVerseKey.bookAbbrev+'.'+app.currentVerseKey.chapter+'.'+verseNum;
//console.log('***** setCurrentVerseNode: about to call setCurrentKey to: ' + verse);
			app.setCurrentKey(verse, function() {
//console.log('***** setCurrentVerseNode: setting colors');
//
//				// remove any word marked with currentVerseWord 
				var curSpans = $('.currentVerse span.clk');
				$(curSpans).removeClass('currentVerseWord');

				$('.currentVerse').removeClass('currentVerse').addClass('verse');
				$('.versenum').filter(function(){ return $(this).text().trim() == verseNum; }).parent('.verse').removeClass('verse').addClass('currentVerse');
//console.log('***** setCurrentVerseNode, verseNode:' + $(verseNode).prop('outerHTML'));
//console.log('***** setCurrentVerseNode: about to display footnotes');
				app.requestAuxDisplay();
			});
		}
	},
	textScroll: function() {
		var max = $('#textDisplay').height();
		$('.currentVerse, .verse').each(function() {
			var verseNode = $(this);
			if ($(verseNode).offset().top > 20 && $(verseNode).offset().top < max) {
				app.setCurrentVerseNode(verseNode);
				return false; // stops the iteration after the first one on screen
			}
		});
	},
	setCurrentWordNode: function(wordNode) {
//console.log('***** setCurrentWordNode, wordNode:' + $(wordNode).prop('outerHTML'));
		if (!$(wordNode).hasClass('currentWord')) {
//console.log('***** setCurrentWordNode: does not have currentWord class');
			var wordNum = $(wordNode).find('.wordNum').text().trim();
			var word = 'src='+wordNum;
//console.log('***** setCurrentWordNode: setting colors. word num: ' + word);
			$('#altDisplay').find('tr.currentWord').removeClass('currentWord');
			$('#altDisplay').find('.wordNum').filter(function(){ return $(this).text().trim() == wordNum; }).parent('.wordHeading').addClass('currentWord');
			$('#altDisplay').find('.wordNum').filter(function(){ return $(this).text().trim() == wordNum; }).parent('.wordHeading').next('.def').addClass('currentWord');
			var curSpans = $('.currentVerse span.clk');
//console.log('***** currentVerse spans length: ' + curSpans.length);
//console.log('***** currentVerse node: ' + $('.currentVerse').prop('outerHTML'));
			$(curSpans).removeClass('currentVerseWord');
			if (curSpans.length > wordNum) $(curSpans[wordNum]).addClass('currentVerseWord');
//console.log('***** setCurrentWordNode, wordNode:' + $(wordNode).prop('outerHTML'));
		}
	},
	altScroll: function() {
		if (app.mainViewType !== 'Language Assist') return;
		var max = $('#altDisplay').height();
		$('.wordHeading').each(function() {
			var wordNode = $(this);
			if ($(wordNode).offset().top > 20 && $(wordNode).offset().top < max) {
				app.setCurrentWordNode(wordNode);
				return false; // stops the iteration after the first one on screen
			}
		});
	},
	setCurrentMod1: function(modName) {
		window.localStorage.setItem('currentMod1', modName);
	},
	getCurrentMod1: function() {
		return window.localStorage.getItem('currentMod1');
	},
	setCurrentMod2: function(modName) {
		window.localStorage.setItem('currentMod2', modName);
	},
	getCurrentMod2: function() {
		return window.localStorage.getItem('currentMod2');
	},
	setCurrentMod3: function(modName) {
		window.localStorage.setItem('currentMod3', modName);
	},
	getCurrentMod3: function() {
		return window.localStorage.getItem('currentMod3');
	},
	getCurrentKey: function() { var v = window.localStorage.getItem('currentKey'); if (!v) v = "James 1:19"; return v; },
	_lastVerseKey: null,
	setCurrentKey: function(keyText, callback) {
//try { throw new Error("====================   SetCurrentKey =============================="); } catch (e) { console.log(e.stack); }
console.log('setCurrentKey: ' + keyText);
console.log('setCurrentKey: app.currentVerseKey: ' + app.currentVerseKey);
		if (app._lastVerseKey == keyText && app.currentVerseKey) return callback?callback():null;
		app._lastVerseKey = keyText;
		SWORD.mgr.getModuleByName(app.getCurrentMod1(), function(masterModule) {
			var updateUIKeyText = function() {
				$('#keyDisplay').html(app.getCurrentKey());
				$('#sendBibleSync').text('Send ' + app.getCurrentKey());
				$('#addBookmarkButton').text('Add ' + app.getCurrentKey());
			};
			if (!masterModule) {
console.log('setCurrentKey: no masterModule');
				window.localStorage.setItem('currentKey', keyText);
				updateUIKeyText();
				return callback?callback():null;
			}
			else {
console.log('setCurrentKey: masterModule: ' + JSON.stringify(masterModule));
				masterModule.setKeyText(keyText, function() {
					masterModule.getVerseKey(function(vk) {
						app.currentVerseKey = vk;
console.log('setCurrentKey: setting app.currentVerseKey: ' + JSON.stringify(app.currentVerseKey));
					 	window.localStorage.setItem('currentKey', app.currentVerseKey.shortText);
						updateUIKeyText();
						return callback?callback():null;
					});
				});
			}
		});
	},
	getCurrentVerseKey: function() {
		if (!app.currentVerseKey) app.setCurrentKey(app.getCurrentKey());
		return app.currentVerseKey;
	},
	main: function () {
console.log('****************** ------------- ***********************');
console.log('****************** main called ***********************');
console.log('****************** ------------- ***********************');
		dataStore.init(function() {
			app.updateBookmarkDisplay();
			try {
				app.zoomLevel = parseInt(window.localStorage.getItem('textZoom'));
			} catch (e) {}
			if (!app.zoomLevel) app.zoomLevel = 100;
			app.adjustUIFont(0);
		});

		app.popupHide();

		// first time check
		var firstCheck = function() {
			SWORD.mgr.getModInfoList(function(mods) {
console.log('firstTime check. mods.length: ' + mods.length);
				app.firstTime = !mods.length;
console.log('app.firstTime: ' + app.firstTime);
				app.show();
			});
		};

		app.getLastAppVersion(function(lastVersion) {
			if (lastVersion != app.version) {
				app.copyBundledResources(function() {
					// setting an extraConfig forces a re-init and will pick up newly copied resources
					app.setLastAppVersion(function() {
						return firstCheck();
					});
				});
			}
			else firstCheck();
		
		});
	},
	setLastAppVersion : function(callback) {
console.log('**** setting lastAppVersion: ' + app.version);
		var buffer = '[bishop]\n';
		buffer += 'Version='+app.version;
		SWORD.mgr.addExtraConfig(buffer, function() {
			if (callback) callback();
		});
	},
	getLastAppVersion : function(callback) {
		SWORD.mgr.getExtraConfigValue('bishop', 'version', function(value) {
console.log('**** retrieving lastAppVersion: ' + value);
			if (callback) callback(value);
		});
	},
	copyBundledResources: function(callback) {
		if (typeof cordova == 'undefined') return callback?callback():0;
		var resPath = cordova.file.applicationDirectory + 'www/bundledResources/';
		var destPath = [
			cordova.file.documentsDirectory + 'sword/',
			cordova.file.dataDirectory
		];
console.log('*** copying bundled resources... looking at ' +resPath);
		var entries = [];
		var performCopy = function(resBundle, destBundle) {
console.log('found resource bundle at: '+resBundle.fullPath);
			var copyEntries = function(i) {
				if (!i) i = 0;
				if (i >= entries.length) {
console.log('Done copying bundledResources. Entry count: ' + i);
					if (callback) callback();
					return;
				}
				var copy = function() {
console.log('copying: '+entries[i].fullPath + ' to ' + destBundle.fullPath);
					entries[i].copyTo(destBundle, null, function() {
						copyEntries(++i);
					}, function(err) {
console.log('ERROR copying: '+JSON.stringify(err));
					});
				};
console.log('checking to see if destination already exists: '+destBundle.toURL() + ':'+entries[i].name);
				destBundle.getDirectory(entries[i].name, {create:false,exclusive:false}, function(existing) {
console.log('removing: '+existing.fullPath);
					existing.removeRecursively(copy, copy);
				}, function() {
					copy();
				});
			};
			var resBundleReader = resBundle.createReader();
			var readEntries = function() {
				resBundleReader.readEntries(function(results) {
					if (!results.length) {
						copyEntries();
					} else {
						entries = entries.concat(Array.prototype.slice.call(results || [], 0));
						readEntries();
					}
				}, function(err) {
console.log('ERROR: ' + err);
				});
			};
			readEntries(); // Start reading dirs.
		};

		window.resolveLocalFileSystemURL(resPath, function(resBundle) {
			if (resBundle && resBundle.isDirectory) {
				var findDest = function(i) {
					if (!i) i = 0;
					if (i >= destPath.length) {
					}
					window.resolveLocalFileSystemURL(destPath[i], function(destBundle) {
						performCopy(resBundle, destBundle);
					}, function(err) {
						if (i == destPath.length -1) {
							console.log('ERROR resolving path: '+JSON.stringify(err));
							if (callback) callback();
						}
						findDest(++i);
					});
				};
				findDest();
			}
			else {
console.log('Could NOT find resource bundle at: '+(resBundle ? resBundle.fullPath : 'null'));
				if (callback) callback();
			}
		}, function(err) {
console.log('ERROR resolving path: '+JSON.stringify(err));
			if (callback) callback();
		});
//if (callback) callback();
	},
	setWordStudyBible: function(modName) {
		window.localStorage.setItem('wordStudyBible', modName);
	},
	getWordStudyBible: function() {
		var retVal = window.localStorage.getItem('wordStudyBible');
		if (!retVal) retVal = '';
		return retVal;
	},
	getAppLocale: function() {
		var retVal = window.localStorage.getItem('appLocale');
		if (!retVal) retVal = '';
		return retVal;
	},
	setBibleSyncUserName : function(userName) {
		window.localStorage.setItem('bibleSyncUserName', userName);
		$('#bibleSyncSwitch').prop('checked', false);
		app.stopBibleSync();
	},
	setBibleSyncPassphrase : function(passphrase) {
		window.localStorage.setItem('bibleSyncPassphrase', passphrase);
		$('#bibleSyncSwitch').prop('checked', false);
		app.stopBibleSync();
	},
	toggleBibleSync : function() {
		if ($('#bibleSyncSwitch').is(':checked')) {
			app.startBibleSync();
		}
		else {
			app.stopBibleSync();
		}
	},
	startBibleSync : function() {
console.log('starting BibleSync');
		var bibleSyncAppName = 'Bishop'+device.platform;
			
		var bibleSyncUserName = window.localStorage.getItem('bibleSyncUserName');
		if (!bibleSyncUserName) bibleSyncUserName = 'BishopUser';
		var bibleSyncPassphrase = window.localStorage.getItem('bibleSyncPassphrase');
		if (!bibleSyncPassphrase) bibleSyncPassphrase = 'Default';
		SWORD.mgr.startBibleSync(bibleSyncAppName, bibleSyncUserName, bibleSyncPassphrase, app.bibleSyncListener);
	},
	stopBibleSync : function() {
console.log('stopping BibleSync');
		app.closeBibleSync();
		SWORD.mgr.stopBibleSync();
	},
	popupShow: function(content, skipTranslation) {
		app.isPopupShowing = true;
		$('#popup').html(content);
		if (!skipTranslation) {
			app.setAppLocale(false, function() {
				$('#popup').show();
			});
		}
		else $('#popup').show();
	},
	popupHide: function(content) {
		$('#popup').hide();
		app.isPopupShowing = false;
	},
	selectChapter: function(bookName) {
		SWORD.mgr.getModuleByName(app.getCurrentMod1(), function(masterModule) {
			if (!masterModule) alert ('No Bible Selected.  Please first select an installed module.');
			else {
				masterModule.setKeyText(bookName, function() {
					masterModule.getVerseKey(function(vk) {
						var t = '<div class="center"><div class="bookButton" onclick="app.selectKey(); return false;">'+bookName+'</div> ';
						for (var i = 1; i <= vk.chapterMax; ++i) {
							t += '<div class="bookButton" onclick="app.setCurrentKey(\''+bookName+'.'+i+'.1\', function() { app.displayCurrentChapter(); app.popupHide(); return false; });">'+i+'</div> ';
						}
						t += '</div>';
						app.popupShow(t);
					});
				});
			}
		});
	},
	selectKey: function() {
		SWORD.mgr.getModuleByName(app.getCurrentMod1(), function(masterModule) {
			if (!masterModule) alert ('No Bible Selected.  Please first select an installed module.');
			else {
				masterModule.getBookNames(function(books) {
					var t = '<div class="center" style="width:100%;margin:0px;padding:0px;">';
					var nt = false;
					for (var i = 0; i < books.length; ++i) {
						if (books[i] == "Matt") nt = true;
						t += '<div class="bookButton'+(nt?' ntBook':' otBook')+'" onclick="app.selectChapter(\''+books[i]+'\'); return false;">'+books[i]+'</div> ';
					}
					t += '</div>';
					app.popupShow(t);
				});
			}
		});
	},
	setupMenu: function(callback) {
		var mods = app.mods;
		// see if we have a main module selected...
		var mainMod = app.getCurrentMod1();
console.log('currentMod1 from localStorage: ' + mainMod);
		var modOptions = '';
		var strongsBibleOptions = '<option value="">First Active</option>';
		var appLocaleOptions = '';
		app.greekDefMods = [];
		app.hebrewDefMods = [];
console.log('************ getting available locales');
		SWORD.mgr.getAvailableLocales(function(locales) {
console.log('************ received ' + locales.length + ' locales.');
			var buildLocaleNames = function(i, callback) {
				if (!i) i = 0;
				if (i >= locales.length) {
					if (!appLocaleOptions.length) appLocaleOptions = '<option value="en">English</option>';
					return callback();
				}
				SWORD.mgr.translate(locales[i], 'locales', function(lt) {
					SWORD.mgr.translate(locales[i]+'.en', 'locales', function(lten) {
						if (lt == locales[i] && lten != (lt+'.en')) lt = lten;
						if (lt && lt != locales[i]) {
							appLocaleOptions += '<option value="'+locales[i]+'">' + lt + ' (' + locales[i] + ')</option>';
						}
						else {
							appLocaleOptions += '<option>' + locales[i] + '</option>';
						}
						buildLocaleNames(++i, callback);
					});
				});
			};
			
			buildLocaleNames(0, function() {

				for (var i = 0; i < mods.length; ++i) {
console.log('Installed module: ' + mods[i].name + '; features.length: ' + mods[i].features.length + '; features: ' + mods[i].features);
					if (mods[i].category == SWORD.CATEGORY_BIBLES) {
						if (!mainMod) {
							mainMod = mods[i].name;
							app.setCurrentMod1(mainMod);
						}
						modOptions += '<option>' + mods[i].name + '</option>';
						if (mods[i].features && mods[i].features.indexOf('StrongsNumbers') !== -1) {
							strongsBibleOptions += '<option>' + mods[i].name + '</option>';
						}
					}
					else if (mods[i].category == SWORD.CATEGORY_LEXDICTS) {
						if (mods[i].features && mods[i].features.indexOf('GreekDef') !== -1) {
							app.greekDefMods.push(mods[i].name);
						}
						if (mods[i].features && mods[i].features.indexOf('HebrewDef') !== -1) {
							app.hebrewDefMods.push(mods[i].name);
						}
					}
				}
				var t = '<table class="slidemenu"><tbody>';
				t += '<tr><td>';
/*
				t += '<table class="keySelector"><tbody><tr><td id="keyDisplay" style="height:2.5em;width:100%;" onclick="app.closeMenu(); app.selectKey(); return false;">'+app.getCurrentKey()+'<td style="padding-right:.4em;" onclick="app.shareVerse(); return false;"><img style="height:2.4em;" src="img/ic_action_share.png"/></td></tr></tbody></table>';
				t += '</td></tr>';
				t += '<tr><td>';
*/
				t += '<table class="keySelector" style="width:100%;"><tbody><tr>';
				t += '<td><select id="currentMod1" style="width:100%;" onchange="app.setCurrentMod1($(\'#currentMod1\').val()); app.closeMenu(); app.displayCurrentChapter(); return false;">';
				t += modOptions;
				t += '</select></td>';
				t += '<td><select id="currentMod2" style="width:100%;" onchange="app.setCurrentMod2($(\'#currentMod2\').val()); app.displayCurrentChapter(); return false;"><option></option>';
				t += modOptions;
				t += '</select></td>';
				t += '<td><select id="currentMod3" style="width:100%;" onchange="app.setCurrentMod3($(\'#currentMod3\').val()); app.displayCurrentChapter(); return false;"><option></option>';
				t += modOptions;
				t += '</select></td>';
				t += '</tr></tbody></table>';
				t += '</td></tr>';
				// View Selector
				t += '<tr><td class="menuLabel" onclick="app.toggleViewSelector(); return false;"><img src="img/ic_action_settings.png" style="height:1em;"/> <span id="viewLabel" data-english="View">View</span>: <span style="font-size:70%;" id="mainViewType" data-english="'+app.mainViewType+'">' + app.mainViewType + '</span></td></tr>';
				t += '<tr><td style="width:100%;"><div style="padding-left:1em;" class="viewSelectorPanel toshow">';
				t +=     '<div><input type="radio" id="viewBibles" name="viewSelector" value="Bibles" onclick="app.setViewBibles();return false;"/> <label id="viewBiblesLabel" data-english="Bibles" for="viewBibles">Bibles</label></div>';
				t +=     '<div><input type="radio" id="viewLanguageAssist" name="viewSelector" value="Language Assist" onclick="app.setViewLanguageAssist();return false;"/> <label id="viewLALabel" data-english="Language Assist" for="viewLanguageAssist">Language Assist</label></div>';
				t +=     '<div><input type="radio" id="viewCommentaryAssist" name="viewSelector" value="Commentary Assist" onclick="app.setViewCommentaryAssist();return false;"/> <label id="viewCALabel" data-english="Commentary Assist" for="viewCommentaryAssist">Commentary Assist</label></div>';
				t += '</div></td></tr>';

				// Verse Study
				t += '<tr class="menuLabel" onclick="verseStudy.show();return false;"><td><img src="img/ic_action_location_searching.png" style="height:1em;"/> <span id="verseStudyLabel" data-english="Verse Study">Verse Study</span></td></tr>';

				// Bookmarks
				t += '<tr><td class="menuLabel" onclick="app.toggleBookmarks(); return false;"><img src="img/bookmarks.png" style="height:1em;"/> <span id="bookmarksLabel" data-english="Bookmarks">Bookmarks</span></td></tr>';
				t += '<tr><td style="width:100%;"><div class="bookmarkPanel toshow">';
				t +=     '<div><button id="addBookmarkButton" onclick="app.bookmarkAdd(app.getCurrentKey());return false;">Add Current</button><button id="clearBookmarks" onclick="app.bookmarksClear();return false;">Clear All</button></div>';
				t +=     '<div id="bookmarkResults"></div>';
				t += '</div></td></tr>';

				// Search
				t += '<tr><td class="menuLabel" onclick="app.toggleSearch(); return false;"><img src="img/ic_action_search.png" style="height:1em;"/> <span id="searchLabel" data-english="Search">Search</span></td></tr>';
				t += '<tr><td style="width:100%;"><div class="searchPanel toshow">';
				t +=     '<div><input id="searchExpression" type="search"/><button id="searchButton" onclick="app.search();return false;">Go</button></div>';
				t +=     '<div id="searchResults"></div>';
				t += '</div></td></tr>';

				// BibleSync
			if (app.enableBibleSync) {
				t += '<tr><td class="menuLabel"><div style="display:inline-block" onclick="app.toggleBibleSyncPanel(); return false;"><img src="img/ic_action_group.png" style="height:1em;"/> <span data-english="BibleSync">BibleSync</span></div><label style="float:right;" class="switch"><input id="bibleSyncSwitch" onchange="app.toggleBibleSync(); return false;" type="checkbox"><span class="slider round"></span></label></td></tr>';
				t += '<tr><td style="width:100%;"><div class="bibleSyncPanel toshow">';
				t +=     '<div><button id="sendBibleSync" onclick="app.sendBibleSyncMessage(app.getCurrentVerseKey().osisRef);return false;">Send Current</button><button id="clearBibleSync" onclick="app.bibleSyncClear();return false;">Clear All</button></div>';
				t +=     '<div id="bibleSyncResults"></div>';
				t += '</div></td></tr>';
			}

				// Library
				t += '<tr class="menuLabel" onclick="installMgr.show();return false;"><td><img src="img/ic_action_download.png" style="height:1em;"/> <span data-english="Library">Library</span></td></tr>';

				// Toggle Notes
				t += '<tr class="menuLabel" onclick="app.closeMenu(); app.toggleFootnotes();return false;"><td><img src="img/ic_action_about.png" style="height:1em;"/> <span data-english="Toggle Notes">Toggle Notes</span></td></tr>';

				// Settings
				t += '<tr><td class="menuLabel" onclick="app.toggleSettings(); return false;"><img src="img/ic_action_settings.png" style="height:1em;"/> <span data-english="Settings">Settings</span></td></tr>';
				t += '<tr><td style="width:100%;"><div class="settingsPanel toshow">';
				t +=     '<div>&nbsp;&nbsp;&nbsp;&nbsp;<button id="decreaseUIFontButton" onclick="app.decreaseUIFont();return false;" style="width:2em;font-size:150%"> - </button>&nbsp;&nbsp; <span data-english="Font Size">Font Size</span> &nbsp;&nbsp;<button id="increaseUIFontButton" onclick="app.increaseUIFont();return false;" style="width:2em;font-size:150%"> + </button></div>';
				t += '<div>WordStudy Bible <select style="width:9em;" onchange="app.setWordStudyBible($(this).val()); return false;" id="wordStudyBible"></select></div>';
				t += '<div><span data-english="Language">Language</span> <select style="width:9em;" onchange="app.setAppLocale($(this).val()); return false;" id="appLocale"></select></div>';
				t += '<div><span data-english="BibleSync User">BibleSync User</span> <input style="width:100%;" onchange="app.setBibleSyncUserName($(this).val()); return false;" id="bibleSyncUserName"/></div>';
				t += '<div><span data-english="BibleSync Passphrase">BibleSync Passphrase</span> <input style="width:100%;" onchange="app.setBibleSyncPassphrase($(this).val()); return false;" id="bibleSyncPassphrase"/></div>';
				t += '</div></td></tr>';

				// About
				t += '<tr class="menuLabel" onclick="app.closeMenu(); app.about();return false;"><td><img src="img/ic_action_about.png" style="height:1em;"/> <span data-english="About">About</span></td></tr>';
				t += '<tr class="menuLabel" onclick="app.closeMenu(); app.about();return false;"><td style="padding-left:.3em; padding-bottom:.7em;border-top:1px dotted grey;font-size:75%;font-style:italic;text-align:left;"> <span data-english="Bishop">Bishop</span> '+app.version+'</td></tr>';
				t += '<tr class="menuLabel"><td>&nbsp</td></tr>';
				t += '<tr class="menuLabel"><td>&nbsp</td></tr>';
				t += '</tbody></table>';
				$('.menupanel').html(t);
				$('.menutab').click(function(){
					if ($(this).hasClass('toshow'))	{ app.openMenu();  }
					else 				{ app.closeMenu(); }
				});
				$(window).on('swiperight', function() { app.openMenu();  });
				$(window).on('swipeleft' , function() { app.closeMenu(); });
				$('#searchExpression').keypress(function(e){
					if (e.keyCode == 13) {
						$('#searchButton').focus();
						$('#searchButton').click();
					}
				});
				$('#bibleSyncUserName').val(window.localStorage.getItem('bibleSyncUserName'));
				$('#bibleSyncPassphrase').val(window.localStorage.getItem('bibleSyncPassphrase'));
				$('#wordStudyBible').append(strongsBibleOptions);
				$('#wordStudyBible').val(app.getWordStudyBible());
				$('#appLocale').append(appLocaleOptions);
				$('#appLocale').val(app.getAppLocale());
				$('input[name=viewSelector]').prop('checked', false);
				$('input[name=viewSelector][value="'+app.mainViewType+'"]').prop('checked', true);
				app.updateBibleSyncDisplay();
				app.updateBookmarkDisplay();
				if (!app.getCurrentMod1() && mods.length) app.setCurrentMod1(mods[0].name);
				if (callback) callback();
			});
		}); // getAvailableLocales()

	},
	mainViewType : 'Bibles',
	setViewBibles : function() {
		app.updateMainViewSetting('Bibles');
	},
	setViewLanguageAssist : function() {
		app.updateMainViewSetting('Language Assist');
	},
	setViewCommentaryAssist : function() {
		app.updateMainViewSetting('Commentary Assist');
	},
	updateMainViewSetting : function(viewType) {
console.log('updateMainViewSetting: ' + viewType);
		app.mainViewType = viewType;
		SWORD.mgr.translate(app.mainViewType, function(translated) {
			$('#mainViewType').text(translated);
		});
		window.localStorage.setItem('mainViewType', app.mainViewType);
		$('#altDisplay').html('');
		switch (app.mainViewType) {
		case 'Bibles':
			$('#textDisplay').css('width', '100%');
			break;
		case 'Language Assist':
			$('#textDisplay').css('width', '50%');
			break;
		case 'Commentary Assist':
			$('#textDisplay').css('width', '50%');
			break;
		}
		setTimeout(function() {
			$('input[name=viewSelector]').prop('checked', false);
			$('input[name=viewSelector][value="'+app.mainViewType+'"]').prop('checked', true);
			app.closeMenu();
		}, 200);
		app.displayCurrentChapter();
	},
	decreaseUIFont : function() {
		app.adjustUIFont(-10);
	},
	increaseUIFont : function() {
		app.adjustUIFont(10);
	},
	zoomLevel : 100,
        adjustUIFont : function(step) {
		app.zoomLevel += parseInt(step);
		MobileAccessibility.setTextZoom(app.zoomLevel, function(level) {
			window.localStorage.setItem('textZoom', level);
		});
	},
	toggleFootnotes: function() {
		if (!app.showingFootnotes)	{ app.openFootnotes();  }
		else 				{ app.closeFootnotes(); }
	},
	bookmarksClear: function() {
		dataStore.deleteAllBookmarks(function() {
			app.updateBookmarkDisplay();
		});
	},
	bookmarkAdd: function(osisRef) {
		dataStore.addBookmark(osisRef, function() {
			app.updateBookmarkDisplay();
		});
	},
	updateBookmarkDisplay: function() {
		dataStore.getBookmarks(function(bookmarks) {
			var t = '<table style="width:100%;"><thead><tr><th></th><th></th></tr></thead><tbody>';
			for (var i = 0; i < bookmarks.length; ++i) {
				t += '<tr class="searchHit"><td colspan="2">'+bookmarks[i]+'</td></tr>';
			}
			t += '</tbody></table>';
			$('#bookmarkResults').html(t);
			app.registerSearchHitsHandler();
		});
	},
	bibleSyncClear: function() {
		app.bibleSyncRefs = [];
		app.updateBibleSyncDisplay();
	},
	sendBibleSyncMessage: function(osisRef) {
		var currentMod = app.getCurrentMod1()
		SWORD.mgr.sendBibleSyncMessage(currentMod + ':' + osisRef);
		// add our own reference to the list so we keep our receive list in sync with others
		app.bibleSyncListener(osisRef);
	},
	bibleSyncListener: function(msg) {
		if (msg && msg.cmd) {
		}
		else {
			msg = {
				cmd : 'nav',
				osisRef : msg
			};
		}
		switch (msg.cmd) {
		case 'nav':
			var osisRef = msg.osisRef;
			var index = app.bibleSyncRefs.indexOf(osisRef);
			if (index > 0) {
				app.bibleSyncRefs.splice(index, 1);
			}
			if (index != 0) {
				app.bibleSyncRefs.unshift(osisRef);
			}
			app.updateBibleSyncDisplay();
			break;
		case 'chat':
			window.plugins.toast.showLongCenter('Chat from [' + msg.user + ']: ' + msg.message);
			break;
		}
	},

	updateBibleSyncDisplay: function() {
		if (app.enableBibleSync) {
			var t = '<table style="width:100%;"><thead><tr><th></th><th></th></tr></thead><tbody>';
			for (var i = 0; i < app.bibleSyncRefs.length; ++i) {
				t += '<tr class="searchHit"><td colspan="2">'+app.bibleSyncRefs[i]+'</td></tr>';
			}
			t += '</tbody></table>';
			$('#bibleSyncResults').html(t);
			app.registerSearchHitsHandler();
		}
	},

	registerSearchHitsHandler: function() {
		$('.searchHit').click(function () {
			app.closeMenu();
			var key = $(this).text();
			app.setCurrentKey(key, function() {
				app.displayCurrentChapter();
			});
		});
	},
	toggleSearch: function() {
//		$('.searchPanel').slideToggle('slow');
		if (!$('.searchPanel').hasClass('tohide')) app.openSearch();
		else app.closeSearch();
	},
	openSearch: function() {
		if ($('.searchPanel').hasClass('tohide')) return;
		$(".searchPanel").animate({height: "18em"});
		$('.searchPanel').removeClass('toshow').addClass('tohide');
	},
	closeSearch: function() {
		if ($('.searchPanel').hasClass('toshow')) return false;
		$(".searchPanel").animate({height: "0em"});
		$('.searchPanel').removeClass('tohide').addClass('toshow');    
		return true;
	},
	toggleViewSelector: function() {
//		$('.viewSelectorPanel').slideToggle('slow');
		if (!$('.viewSelectorPanel').hasClass('tohide')) app.openViewSelector();
		else app.closeViewSelector();
	},
	openViewSelector: function() {
		if ($('.viewSelectorPanel').hasClass('tohide')) return;
		$(".viewSelectorPanel").animate({height: "10em"});
		$('.viewSelectorPanel').removeClass('toshow').addClass('tohide');
	},
	closeViewSelector: function() {
		if ($('.viewSelectorPanel').hasClass('toshow')) return false;
		$(".viewSelectorPanel").animate({height: "0em"});
		$('.viewSelectorPanel').removeClass('tohide').addClass('toshow');    
		return true;
	},
	toggleSettings: function() {
		if (!$('.settingsPanel').hasClass('tohide')) app.openSettings();
		else app.closeSettings();
	},
	openSettings: function() {
		if ($('.settingsPanel').hasClass('tohide')) return;
		$(".settingsPanel").animate({height: "17em"});
		$('.settingsPanel').removeClass('toshow').addClass('tohide');
	},
	closeSettings: function() {
		if ($('.settingsPanel').hasClass('toshow')) return false;
		$(".settingsPanel").animate({height: "0em"});
		$('.settingsPanel').removeClass('tohide').addClass('toshow');    
		return true;
	},
	toggleBibleSyncPanel: function() {
		if (!$('.bibleSyncPanel').hasClass('tohide')) app.openBibleSync();
		else app.closeBibleSync();
	},
	openBibleSync: function() {
		if (!$('#bibleSyncSwitch').is(':checked')) return;
		if ($('.bibleSyncPanel').hasClass('tohide')) return;
		$(".bibleSyncPanel").animate({height: "18em"});
		$('.bibleSyncPanel').removeClass('toshow').addClass('tohide');
	},
	closeBibleSync: function() {
		if ($('.bibleSyncPanel').hasClass('toshow')) return false;
		$(".bibleSyncPanel").animate({height: "0em"});
		$('.bibleSyncPanel').removeClass('tohide').addClass('toshow');    
		return true;
	},
	toggleBookmarks: function() {
		if (!$('.bookmarkPanel').hasClass('tohide')) app.bookmarksOpen();
		else app.bookmarksClose();
	},
	bookmarksOpen: function() {
		if ($('.bookmarkPanel').hasClass('tohide')) return;
		$(".bookmarkPanel").animate({height: "18em"});
		$('.bookmarkPanel').removeClass('toshow').addClass('tohide');
	},
	bookmarksClose: function() {
		if ($('.bookmarkPanel').hasClass('toshow')) return false;
		$(".bookmarkPanel").animate({height: "0em"});
		$('.bookmarkPanel').removeClass('tohide').addClass('toshow');    
		return true;
	},
	openMenu: function() {
		if ($('#openSidebarMenu').is(':checked')) return false;
console.log("****** opening menu");
		$('#openSidebarMenu').prop('checked', true).change();
		return true;
	},

	closeMenu: function() {
		if (!$('#openSidebarMenu').is(':checked')) return false;
console.log("****** closing menu");
		$('#openSidebarMenu').prop('checked', false).change();
		return true;
	},

	openTopBar: function() {
		if ($('#openTopBar').is(':checked')) return false;
console.log("****** opening topBar");
		$('#openTopBar').prop('checked', true).change();
		return true;
	},

	closeTopBar: function() {
		if (!$('#openTopBar').is(':checked')) return false;
console.log("****** closing topBar");
		$('#openTopBar').prop('checked', false).change();
		return true;
	},

	openFootnotes: function() {
		$('.notesButton').css('background-color', '#007D48');
		app.showingFootnotes = true;
		window.localStorage.setItem('showingFootnotes', app.showingFootnotes?'true':'false');
		if ($('#footnotes').hasClass('tohide')) return;
console.log('opening footnotes');
		$('#footnotes').removeClass('toshow').addClass('tohide');
		$("#footnotes, #footerBuffer").animate({ height: '8em' }, 350, function() {
		});
		app.displayFootnotes();
	},
	closeFootnotes: function() {
		$('.notesButton').css('background', 'initial');
		app.showingFootnotes = false;
		window.localStorage.setItem('showingFootnotes', app.showingFootnotes?'true':'false');
		if ($('#footnotes').hasClass('toshow')) return false;
console.log('closing footnotes');
		$("#footnotes, #footerBuffer").animate({ height: '0' }, 350, function() {
			$('#footnotes').removeClass('tohide').addClass('toshow');    
		});
		return true;
	},
	auxDisplayCallback : null,
	auxDisplayCountdown : 0,
	auxDisplayIntervalID : setInterval(function() {
		if (app.auxDisplayCountdown > 0) {
			--app.auxDisplayCountdown;
console.log('auxDisplayCountdown: ' + app.auxDisplayCountdown);
			if (app.auxDisplayCountdown < 1) {
				app.displayAux(app.auxDisplayCallback);
				app.auxDisplayCallback = false;
			}
		}
	}, 100),
	requestAuxDisplay : function(callback) {
		app.auxDisplayCountdown = 5;
		if (callback) app.auxDisplayCallback = callback;
	},
	displayAux : function(callback) {
		app.displayFootnotes(function() {
			app.displayAlt(function() {
				if (callback) callback();
			});
		});
	},
	displayAlt: function(callback) {
		switch (app.mainViewType) {
		case 'Bibles':
			break;
		case 'Language Assist':
			verseStudy.wordStudy('#altDisplay', '');
			break;
		case 'Commentary Assist':
			verseStudy.commentary('#altDisplay');
			break;
		}
		
	},
	displayFootnotes: function(callback) {
		if ($('#footnotes').hasClass('toshow')) return callback?callback():null;
		var t = '';
		setTimeout(function() {
		var modulesLoop = function(mods, i) {
			if (!i) i = 0; if (i >= mods.length) {
				$('#footnotes').html(t);
				return callback?callback():null;
			}
			SWORD.mgr.getModuleByName(mods[i], function(mod) {
				if (mod) { 
					mod.setKeyText(app.getCurrentKey(), function() {
						mod.getRenderText(function(unused) {
console.log('building footnotes for: ' + mod.description);
							mod.getEntryAttribute('Footnote', '-', '-', false, function(footnotes) {
console.log('footnotes: ' + footnotes.length);
								if (footnotes.length) {
									t += '<table class="clean nobottom" style="table-layout:fixed;width:100%;"';
									if (mod.name == 'NA28') t += ' onclick="verseStudy.show(\'app\'); return false;"';
									t += '><tbody>';
									var loopFinish = function() {
										t += '</tbody></table>';
										modulesLoop(mods, ++i);
									}
									var loop = function(j) {
										if (!j) j = 0;
										if (j >= footnotes.length) return loopFinish();
										mod.getEntryAttribute('Footnote', footnotes[j], 'body', true, function(fbody) {
											t += '<tr><td>'+fbody+'</td></tr>';
											loop(++j);
										});
									}
									loop();
								}
								else modulesLoop(mods, ++i);
							});
						});
					});
				}
				else modulesLoop(mods, ++i);
			});
		};
		var mods = [];
		if (app.getCurrentMod1()) mods.push(app.getCurrentMod1());
		if (app.getCurrentMod2()) mods.push(app.getCurrentMod2());
		if (app.getCurrentMod3()) mods.push(app.getCurrentMod3());
		modulesLoop(mods);
		}, 1);

	},
	search: function() {
		SWORD.mgr.getModuleByName(app.getCurrentMod1(), function(module) {
			module.search($('#searchExpression').val(), module.SEARCHTYPE_MULTIWORD, module.SEARCHOPTION_ICASE, null, function(e) {
				if (e.status == 'update') {
					$('#searchResults').html(installMgr.getProgressHTML(e.percent + '%', e.percent));
				}
				else if (e.status == 'complete') {
					var t = '<table style="width:100%;"><thead><tr><th>Total Results:</th><th>'+e.results.length+'</th></tr></thead><tbody>';
					for (var i = 0; i < e.results.length; ++i) {
						t += '<tr class="searchHit"><td colspan="'+(e.results[i].score?1:2)+'">'+e.results[i].key+'</td>';
						if (e.results[i].score) t += '<td>'+e.results[i].score+'</td>';
						t += '</tr>';
					}
					t += '</tbody></table>';
					$('#searchResults').html(t);
					app.registerSearchHitsHandler();
				}
			});
		});
	},
	showFirstTime : function() {
console.log("**** showing firstime ****");
		var t = '<div style="margin:1em;"><center><h3>You have no modules installed.</h3>';
		t    += '<p>Select the menu on the left, choose "Library" and press the <button onclick="return false;">Refresh</button> button to see what is available in each module publisher\'s repository.</p>';
		t    += '<p>We would suggest installing from "CrossWire" the KJV, WLC, WHNU, StrongsGreek, and StrongsHebrew modules for a minimal set of modules which allow basic Greek and Hebrew word study.</p>';
		t    += '<p>I can do all of this for you now, if you would like; simply press this button:</p><p><button style="height:3em;" onclick="app.basicStartup(1);return false;">Basic Module Set</button></p></center></div>';
		$('#textDisplay').html(t);
console.log("**** done showing firstime ****");
		app.firstTime = false;
		return;
	},
	showNewUnlockInstall : function(mod) {
		var t = '<div style="margin:1em;"><center><h3><span data-english="New Unlock Key">New Unlock Key</span></h3>';
		t    += '<p><span data-english="Bishop has just received a new unlock code for a module which doesn\'t appear to be installed.">Bishop has just received a new unlock code for a module which doesn\'t appear to be installed.</span> ('+mod+') <span data-english="Would you like to install this module?">Would you like to install this module?</span>';
		t    += '<p><button onclick="app.installModule(\''+mod+'\');return false;"><span data-english="Install Module">Install Module</span></button></p></center></div>';
		$('#textDisplay').html(t);
		app.setAppLocale();
		return;
	},
	installModule: function(mod, callback) {
console.log('**** installing mod: ' + mod);
console.log('**** showing installMgr');
		installMgr.show(function() {
console.log('**** refreshing sources');
			installMgr.refreshSources(function() {
console.log('**** SWORD getting remote sources');
				SWORD.installMgr.getRemoteSources(function(sources) {
					var sourcesLoop = function(srcs, i) {
						if (!i) i = 0; if (i >= srcs.length) {
							alert('Couldn\'t find the module ('+mod+') in any known repo.  Please install manually from publisher');
							if (callback) callback();
							else app.show();
							return;
						}
						SWORD.installMgr.getRemoteModInfoList(srcs[i], function(sourceMods) {
console.log('**** checking for module in source: ' + srcs[i]);
console.log('**** checking for module: ' + mod + ' in set: ' + JSON.stringify(sourceMods));
							var found = false;
							for (var l = 0; l < sourceMods.length; ++l) { if (sourceMods[l].name == mod) { found = true; console.log('found.'); break; }}
							if (found) {
console.log('**** found module in source: ' + srcs[i] + '; installing...');
								installMgr.installModule(srcs[i], mod, function() {
									if (callback) callback();
									else app.show();
								});
							}
							else sourcesLoop(srcs, ++i);
						});
					};
console.log('**** looping sources');
					sourcesLoop(sources);
						
				});
			});
		});
	},
	displayCurrentChapter: function(callback) {
console.log('**** checking if any modules await installation');
		if (app.waitingInstall) { app.installNewModules(app.waitingInstall); app.waitingInstall = null; return; }
		SWORD.mgr.setJavascript(true);
		var onlyOne = app.mainViewType != 'Bibles';
		$('#textDisplay').css('width', onlyOne ? '50%':'100%');
		
		$('#textDisplay').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center></div>');

		// run in background
		setTimeout(function() {
			var parDispModules = [ app.getCurrentMod1() ];
			if (app.getCurrentMod2() && app.getCurrentMod2().length) parDispModules.push(app.getCurrentMod2());
			if (app.getCurrentMod3() && app.getCurrentMod3().length) parDispModules.push(app.getCurrentMod3());

			SWORD.mgr.getModuleByName(parDispModules[0], function(masterModule) {
console.log('masterModule: ' + masterModule);
console.log('parDispModules.length: ' + parDispModules.length);


			if (!masterModule) {
				app.showFirstTime();
				return;
			}
			var usedCV = false;
	//
	// maybe someday we'll support eusebian canon numbers in here
	/*
			var eusVs = SWORD.mgr.getModuleByName("Eusebian_vs");
			var eusNum = SWORD.mgr.getModuleByName("Eusebian_num");
			var lastEusNum = "";
			var myEusNum = "";
	*/

			masterModule.setKeyText(app.getCurrentKey(), function() {
			masterModule.getVerseKey(function(currentVerse) {
			var prevChapterString = currentVerse.bookName + ' ' + (currentVerse.chapter-1) + ':1';
			var nextChapterString = currentVerse.bookName + ' ' + (currentVerse.chapter+1) + ':1';

			var t = '<div id="paralleldisplay">';
			t += '<ul class="booknav">';
			t += '<li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+prevChapterString+'\', function() { app.displayCurrentChapter(); }); return false;"><span data-english="previous chapter" style="white-space:nowrap">previous chapter</span></a></li>';
			t += ' <li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+nextChapterString+'\', function() { app.displayCurrentChapter(); }); return false;"><span data-english="next chapter" style="white-space:nowrap">next chapter</span></a></li>';
			t += '</ul>';

			t += '<h2>'+currentVerse.bookName + ' ' + currentVerse.chapter +'</h2>';

			var mods = [];
			var renderData = [];

		var chapterDisplay = function(htmlText, mods) {
			$('#textDisplay').html(htmlText);
			app.setAppLocale(false, function () {
				app.lastDisplayMods=mods;
				setTimeout(function() {
					if (app.getCurrentVerseKey().verse > 1) {
						var new_position = $('.currentVerse').offset();
						$('#textDisplay').scrollTop(new_position.top-$('#textDisplay').offset().top-35);
					}
					app.requestAuxDisplay(callback);
				}, 500);
			});
		};


		var headerLoopContinue = function() {
console.log('headerLoopContinue. mods.length: ' + mods.length + '; renderData.length: ' + renderData.length);

			// assert we have something to display
			if (!mods.length) {
				return chapterDisplay('<center><h2>Nothing to display.</h2></center>');
			}

	// table which contains all verse items 
			t += '<table><caption></caption>';
			t += '<colgroup><col/>';
			for (var i = 0; i < mods.length; ++i) {
				t += '<col width="'+100/mods.length+'%" />';
			}
			t += '</colgroup><thead><tr><th></th>';

	//insert module names at the top
			for (var i = 0; i < mods.length; ++i) {
				t += '<th>' + mods[i].description.replace(/&/g, '&amp;') + '</th>';
			}
			t += '</tr></thead><tbody>';

			for (var v = 0; v < renderData[0].length; ++v) {
				var intro = false;	// for possible future support of intro
				var verseKey = renderData[0][v].verse;

	/*
				if (eusVs != null) {
					myEusNum = "";
					if (!intro) {
						eusVs.setKeyText(keyText);
						myEusNum = eusVs.getStripText().trim();
						if (!lastEusNum.equals(myEusNum)) {
							lastEusNum = myEusNum;
							eusNum.setKeyText(myEusNum);
							XMLTag d = new XMLBlock(eusNum.getRawEntry());
							myEusNum = myEusNum.substring(myEusNum.indexOf(".")+1) + "<br/>" + d.getAttribute("table");
						}
						else myEusNum = "";
					}
				}
	*/
				t += '<tr'+(!usedCV && verseKey.verse == currentVerse.verse ? ' id="cv"' : '')+'><td style="padding:0;margin:0" valign="top" align="center"><div>';
				if (verseKey.verse == currentVerse.verse) usedCV = true;
	/*
				if (myEusNum.length > 0) {
					t += '<span class="eusnum"><a href="javascript:void(0);" onclick="app.showEusebian('+keyText+')">' + myEusNum + '</a></span>';
				}
	*/
				t += '</div></td>';

				for (var i = 0; i < renderData.length; ++i) {

					var rtol = (mods[i].direction && "RtoL".toUpperCase() == mods[i].direction.toUpperCase());
					var style = (mods[i].font && mods[i].font.length > 0)?('font-family:'+mods[i].font) : '';
					t += '<td style="'+ style +'" ' + (rtol ? 'dir="rtl"' : '') + ' class="' + mods[i].language + ' ' + (verseKey.verse == currentVerse.verse ? 'currentVerse' : 'verse') + '">';

					t += renderData[i][v].preVerse;

					var verseText = '';
					if (verseKey.bookAbbrev != currentVerse.bookAbbrev) verseText += verseKey.bookAbbrev + '.';
					if (verseKey.bookAbbrev != currentVerse.bookAbbrev || verseKey.chapter != currentVerse.chapter) verseText += verseKey.chapter + '.';
					verseText += verseKey.verse;
					t += '<span class="versenum"><a href="javascript:void(0);"> ' + verseText + '</a></span>';
					t += renderData[i][v].text;
					t += '</td>';
				}

				t += '</tr>';
			}


	//insert module names at the top
			t += '<tr><td></td>';
			for (var i = 0; i < renderData.length; ++i) {
				var copyLine = mods[i].shortCopyright;
				if (!copyLine) copyLine = '';
				var promoLine = mods[i].shortPromo;
				if (!promoLine) promoLine = '';
				if (mods[i].category == "Cults / Unorthodox / Questionable Material") {
					copyLine = 'WARNING: This text is considered unorthodox by most of Christendom. ' + copyLine;
				}
				t += '<td>';
				t += '<div class="copyLine">' + copyLine + '</div>';
				t += '<div class="promoLine">' + promoLine +'</div>';
				t += '</td>';
			}

			t += '</tr></tbody></table>';
			t += '<div class="screenPad">';
			t += '<div style="height:3em;">&nbsp;</div>';
			t += '</div>';
			t += '<ul class="booknav">';
			t += '<li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+prevChapterString+'\', function() { app.displayCurrentChapter(); }); return false;"><span data-english="previous chapter" style="white-space:nowrap">previous chapter</span></a></li>';
			t += ' <li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+nextChapterString+'\', function() { app.displayCurrentChapter(); }); return false;"><span data-english="next chapter" style="white-space:nowrap">next chapter</span></a></li>';
			t += '</ul>';
			t += '</div>';
			t += '<div id="footerBuffer"></div>';
			t += '<div style="height:30em;">&nbsp;</div>';
			
			chapterDisplay(t, mods);
		};




			var headerLoop = function (i) {
				if (!i) i = 0; if (i >= parDispModules.length)  { headerLoopContinue(); return; }
console.log('headerLoop : ' + i);
				SWORD.mgr.getModuleByName(parDispModules[i], function(mod) {
					if (!mod) { headerLoop(++i); return; }
console.log('header module retrieved: ' + mod.description);
					mod.getRenderChapter(masterModule, function(chapterData) {
console.log('got chapter data for: ' + mod.description + '; chapterData.length: ' + chapterData.length);
						// only display module if some data for the chapter
						for (var j = 0; j < chapterData.length; ++j) {
							if (chapterData[j].text && chapterData[j].text.length > 0 && (!onlyOne || !renderData.length)) {
console.log('found some data so we should include mod: ' + mod.description + '; getting renderHeader');
								mod.getRenderHeader(function(h) {
console.log('got renderHeader for mod: ' + mod.description);
									t += ('<style>' + h + '</style>');
									mods.push(mod);
									renderData.push(chapterData);
									headerLoop(++i);
									return;
								});
								return;
							}
						}
console.log('calling headerLoop : ' + (i + 1));
						headerLoop(++i);
					});
				});
			};
			headerLoop();

			}); }); });

		}, 1);

	},
	about: function() {
		var t = '<div class="about">';
		t += '<div style="float:right;"><img style="height:5em;margin-top:.7em;" src="img/swordlogo.png"/></div>';
		t += '<div style="width:100%;text-align:center;"><div style="display:inline-block;"><h2><span style="font-size:130%;">Bishop</span> <span style="font-size:70%;">version: '+app.version+'</span></h2>';
		t += '<i><span data-english="SWORD engine version:">SWORD engine version:</span> ' + SWORD.version + '</i></div></div>';
		t += '<br/>';
		t += '<br/>';
		t += '<div style="float:right;padding-left:1em;"><img style="height:5em;margin-top:.5em;" src="img/crosswire_medium.png"/></div>';
		t += '<h3><span data-english="App About Header|The CrossWire Bible Society">The CrossWire Bible Society</span></h3>';
		t += '<p data-english="App About L1|Bishop is a Bible study application from The CrossWire Bible Society and is a member of The SWORD Project family of Bible study tools.">';
		t += 'Bishop is a Bible study application from The CrossWire Bible Society and is a member of The SWORD Project family of Bible study tools.';
		t += '</p>';
		t += '<p data-english="App About L2|To learn more, visit us online">';
		t += 'To learn more, visit us online</p>';
		t += '<p data-english="App About L3|&lt;div style=&quot;margin:auto;width:90%;text-align:center;&quot;&gt;&lt;a href=&quot;http://crosswire.org&quot;&gt;The CrossWire Bible Society&lt;/a&gt;&lt;/div&gt;"><a href="http://crosswire.org">The CrossWire Bible Society</a>';
		t += '</p>';
		t += '<p data-english="App About L4|May God bless you as you seek to know Him more.">May God bless you as you seek to know Him more.</p>';
		t += '<br/>';
		if (app.enableBibleSync) {
			t += '<div style="float:right;"><img style="height:2em;" src="img/biblesync-v1-50.png"/></div>';
		}
		t += '<br/>';
		t += '<h3><span data-english="Installed Modules">Installed Modules</span></h3>';
console.log('About: showing modules, count: ' + app.mods.length);
		for (var i = 0; i < app.mods.length; ++i) {
			var ciphered = app.mods[i].cipherKey !== undefined;
			t += '<h4>' + app.mods[i].name + ' - ' + app.mods[i].description + '<button id="modAboutButton_' + app.mods[i].name + '" style="float:right;" onclick="event.stopPropagation(); app.showModuleAbout(\''+app.mods[i].name+'\', \'modAboutDiv_'+app.mods[i].name+'\', this); return false;">About</button></h4>' + (ciphered?('<button onclick="app.changeCipher(\''+app.mods[i].name+'\', \'' + app.mods[i].cipherKey + '\'); return false;">CipherKey: ' + app.mods[i].cipherKey + '</button><br/><br/>'):'') + '<div id="modAboutDiv_'+app.mods[i].name+'"></div>';
		}
		t += '</div>';
		app.popupShow(t, true);
		$('.about').click(function(){ 
			app.popupHide();
		});

		// show the first 10 modules
		var firstTen = function(i) {
			if (!i) i = 0;
			if (i >= 10 || i >= app.mods.length) {
				app.setAppLocale();
				return;
			}
			var modName = app.mods[i].name;
			app.showModuleAbout(modName, 'modAboutDiv_'+modName, $('#modAboutButton_'+modName), function() {
				firstTen(++i);
			});
		};
		firstTen();

		return;
	},
	showModuleAbout: function(modName, targetElement, toHide, callback) {
		if (toHide) {
			$(toHide).hide();
		}
		if ($('#'+targetElement).text().length > 0) {
			$('#'+targetElement).html('');
			return callback ? callback() : false;
		}
		SWORD.mgr.getModuleByName(modName, function(module) {
			module.getConfigEntry('About', function(about) {
				var t = (about?about:'') + '<br/>';
				if (module.shortPromo && module.shortPromo.length) t += '<div class="promoLine">' + module.shortPromo +'</div>';
				t += '<br/>';
				$('#'+targetElement).html(t);
				callback ? callback() : false;
			});
		});
	},
	shareVerse: function() {
		SWORD.mgr.getModuleByName(app.getCurrentMod1(), function(masterModule) {
			if (masterModule) {
				masterModule.setKeyText(app.getCurrentKey(), function() {
					masterModule.shareVerse();
				});
			}
		});
	},
	changeCipher: function(modName, currentCipher) {
		SWORD.mgr.translate('Unlock key for', function(translation) {
			var cipher = prompt(translation + ' ' + modName, currentCipher);
			if (cipher != null) {
				var buffer = '['+modName+']\n';
				buffer += 'CipherKey='+cipher;
				SWORD.mgr.addExtraConfig(buffer, function(newMods) {
					app.show();
				});
			}
		});
	},
	basicStartup: function(stage) {
console.log('basicStartup called, stage: ' + stage);
		if (stage) app.basicStartupStage = stage;
		switch (app.basicStartupStage) {
		case 1:
console.log('showing installmgr');
			installMgr.show(function() {
console.log('refreshing sources');
				installMgr.refreshSources(function() {
console.log('refreshing sources complete');
					++app.basicStartupStage;
					app.basicStartup();
				});
			});
			break;
		case 2:
			$('#modSource').val('CrossWire');
			installMgr.installModule('CrossWire', 'KJV', function() { ++app.basicStartupStage; app.basicStartup() });
			break;
		case 3:
			installMgr.installModule('CrossWire', 'StrongsGreek', function() { ++app.basicStartupStage; app.basicStartup() });
			break;
		case 4:
			installMgr.installModule('CrossWire', 'StrongsHebrew', function() { ++app.basicStartupStage; app.basicStartup() });
			break;
		case 5:
			installMgr.installModule('CrossWire', 'WHNU', function() { ++app.basicStartupStage; app.basicStartup() });
			break;
		case 6:
			installMgr.installModule('CrossWire', 'WLC', function() { ++app.basicStartupStage; app.basicStartup() });
			break;
		case 7:
			app.setCurrentMod1('KJV');
			app.setCurrentMod2('WHNU');
			app.setCurrentMod3('WLC');
			app.show();
			break;
		}
	},
	setAppLocale: function(localeName, callback) {
		if (!localeName) localeName = app.getAppLocale();
		var englishSpans = $('button[data-english],span[data-english],option[data-english],th[data-english],p[data-english],label[data-english]');
		var reInit = (localeName != app.getAppLocale());
		window.localStorage.setItem('appLocale', localeName);
		SWORD.mgr.setDefaultLocale(localeName, function() {
			var setHTMLControls = function(i) {
				if (!i) i = 0;
				if (i >= englishSpans.length) {
console.log('Finished setting SWORD locale to ' + localeName);
					if (callback) callback();
					return;
				}
				var trKey = $(englishSpans[i]).attr('data-english');
				// if no locale entry, default to data-english
				var trDefault = trKey;
				// if default is supplied in data-english, split with a pipe |, then use this default
				// e.g., data-english="About L1|Bishop is a SWORD Project app."
				if (trKey.indexOf('|') > -1) {
					trDefault = trKey.substring(trKey.indexOf('|')+1);
					trKey = trKey.substring(0, trKey.indexOf('|'));
				}
				SWORD.mgr.translate(trKey, function(translated) {
					if (translated == trKey) translated = trDefault;
console.log('Setting tr key '+trKey+' to: ' + translated);
					$(englishSpans[i]).html(translated);
					setHTMLControls(i+1);
				});
			};
			if (reInit) {
				// setting an extraConfig forces a re-init and will pick up newly copied resources
				app.setLastAppVersion(function() {
					app.setCurrentKey(app.getCurrentKey(), function() {
						setHTMLControls();
					});
				});
			}
			else setHTMLControls();
		});
	}
};

app.initialize();
