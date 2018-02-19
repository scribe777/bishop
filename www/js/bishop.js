var app = {
	isPopupShowing : false,
	basicStartupStage : 0,
	currentVerseKey : false,
	bibleSyncRefs : [],
	firstTime: false,
	waitingInstall: null,
	lastDisplayMods: null,
	showingFootnotes: false,

	// ------------- local sample data for testing in a web browser and not on a phone with a real SWORD engine installation
	localFixup : function() {
console.log('using localFixup instead of real SWORD plugin');
		var sampleModInfo = { category : 'Biblical Texts', name : 'KJV' };
		var sampleVerseKey = { testament : 2, book : 4, chapter : 3, verse: 16, chapterMax: 23, verseMax: 40, bookName : 'John', osisRef: 'John.3.16', shortText : 'John 3:16', bookAbbrev : 'John' };
		var sampleVerse = { verse : $.extend(true, {}, sampleVerseKey), preVerse : '', text:'For God so loved the world that He gave His only Son that whosoever believes in Him would have everlasting life.'}
		var sampleModule = { name : 'KJV', description : 'King James Version, 1763', direction : 'LtoR', shortCopyright : '(c) 1611, The Crown', shortPromo:'Visit Great Britain for dreary skies and bad food', setKeyText : function(k, callback) {if(callback)callback();}, getKeyText : function() { return 'Jn.2.2';}, getVerseKey: function(callback) { if(callback)callback(sampleVerseKey);return sampleVerseKey; }, getBookNames : function(callback) { var bn = ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Matt', 'Mark', 'Luke', 'John']; if(callback)callback(bn);  return bn;}, getRenderChapter : function(mod, callback) { var rc = []; for (var i = 0; i<20; ++i) { var v = $.extend(true, {},sampleVerse); v.verse.verse=i+1; rc.push(v); } if(callback)callback(rc);}, getRenderHeader : function(callback) { if(callback)callback('');return '';} };
		SWORD = {
			CATEGORY_BIBLES : 'Biblical Texts',
			version : 'mockup',
			mgr : {
				getModInfoList : function(callback) { if(callback)callback([sampleModInfo]); return [sampleModInfo]; },
				getModuleByName : function(name, callback) { if(callback)callback(sampleModule); return sampleModule; },
				registerBibleSyncListener : function(callback) {}
			},
			installMgr : {
				getRemoteSources : function(callback) { if(callback)callback(['CrossWire']); return ['CrossWire']; }
			}
		};
		app.main();
	},
	// ------------- end of local sample data -----------------------
	activeWindow : null,
	initialize: function() {
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
//if (typeof SWORD == 'undefined') app.localFixup(); else console.log('Using real SWORD plugin');
		$(document).on('click','a', function(e) {
console.log('**** a click event from: ' + $(this).prop('outerHTML'));
			e.preventDefault();
			var elem = $(this);
			var url = elem.attr('href');
			if (url.indexOf('http://') !== -1) {
				window.open(url, '_system');
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
	handleIntent(intent) {
		var confBlob = intent.extras['android.intent.extra.TEXT'];
console.log('**** Received Intent. Object: ' + JSON.stringify(intent));
console.log('**** Received Intent. confBlob: ' + confBlob);
		if (confBlob) {
			SWORD.mgr.addExtraConfig(confBlob, function(newMods) {
console.log('**** newMods.length: ' + newMods.length);
				
				app.waitingInstall = newMods;

			});
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
		app.bindEvents();
		app.main();
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
	},
	handleBackButton: function() {
		if (app.isPopupShowing) app.popupHide();
		else if (app.currentWindow != app) app.show();
		else if (!app.closeMenu()) navigator.app.exitApp();
	},
	show: function() {
		app.showingFootnotes = window.localStorage.getItem('showingFootnotes');
		app.setCurrentKey(app.getCurrentKey());
		app.currentWindow = app;
		var main = $('#main');
console.log("*** in show. main.length: " + main.length);
		$(main).html('<div id="textDisplay"></div><div class="menupanel"></div><a href="javascript:void(0);" class="menutab toshow">&nbsp;</a><div id="footnotes" class="toshow"></div>');
		var textDisplay = $('#textDisplay');
console.log("*** in show. after setting textDisplay.length: " + textDisplay.length);
		$(textDisplay).scroll(app.textScroll);
		SWORD.mgr.getModInfoList(function(mods) {
			app.setupMenu(mods);
			$('#currentMod1').val(app.getCurrentMod1());
			$('#currentMod2').val(app.getCurrentMod2());
			$('#currentMod3').val(app.getCurrentMod3());
		});
		if (app.showingFootnotes) app.openFootnotes();
		if (app.firstTime) app.showFirstTime();
		else app.displayCurrentChapter();
	},
	setCurrentVerseNode: function(verseNode) {
console.log('***** setCurrentVerseNode, verseNode:' + $(verseNode).prop('outerHTML'));
		if (!$(verseNode).hasClass('currentverse')) {
console.log('***** setCurrentVerseNode: does not have currentverse class');
			var verseNum = $(verseNode).find('.versenum :first').text().trim();
			var verse = app.currentVerseKey.bookAbbrev+'.'+app.currentVerseKey.chapter+'.'+verseNum;
console.log('***** setCurrentVerseNode: about to call setCurrentKey to: ' + verse);
			app.setCurrentKey(verse, function() {
console.log('***** setCurrentVerseNode: setting colors');
				$('.currentverse').removeClass('currentverse').addClass('verse');
				$('.versenum').filter(function(){ return $(this).text().trim() == verseNum; }).parent('.verse').removeClass('verse').addClass('currentverse');
console.log('***** setCurrentVerseNode, verseNode:' + $(verseNode).prop('outerHTML'));
console.log('***** setCurrentVerseNode: about to display footnotes');
				app.displayFootnotes();
			});
		}
	},
	textScroll: function() {
		var max = $('#textDisplay').height();
		$('.currentverse, .verse').each(function() {
			var verseNode = $(this);
			if ($(verseNode).offset().top > 20 && $(verseNode).offset().top < max) {
				app.setCurrentVerseNode(verseNode);
				return false; // stops the iteration after the first one on screen
			}
		});
	},
	setCurrentMod1: function(modName) {
		window.localStorage.setItem('currentMod1', modName);
	},
	getCurrentMod1: function() {
		var mod = window.localStorage.getItem('currentMod1');
console.log('currentMod1 from localStorage: ' + mod);
		if (!mod) {
			var mods = SWORD.mgr.getModInfoList();
			for (var i = 0; i < mods.length; ++i) {
				if (mods[i].category == SWORD.CATEGORY_BIBLES) {
					app.setCurrentMod1(mods[i].name);
					return mods[i].name;
				}
			}
		}
console.log('returning currentMod1: ' + mod);
		return mod;
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
		});
		app.popupHide();
		// first time check
		SWORD.mgr.getModInfoList(function(mods) {
console.log('firstTime check. mods.length: ' + mods.length);
			app.firstTime = !mods.length;
console.log('app.firstTime: ' + app.firstTime);
			app.show();
			SWORD.mgr.registerBibleSyncListener(app.bibleSyncListener);
		});
	},
	popupShow: function(content) {
		app.isPopupShowing = true;
		$('#popup').html(content);
		$('#popup').show();
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
	setupMenu: function (mods) {
        var modOptions = '';
        for (var i = 0; i < mods.length; ++i) {
            if (mods[i].category == SWORD.CATEGORY_BIBLES) {
                modOptions += '<option>' + mods[i].name + '</option>';
            }
        }
		var t = '<table class="slidemenu"><tbody>';
		t += '<tr><td><table class="keySelector"><tbody><tr><td id="keyDisplay" style="width:100%;border-right-width:0;" onclick="app.closeMenu(); app.selectKey(); return false;">'+app.getCurrentKey()+'<td style="border-left-width:0;" onclick="app.shareVerse(); return false;"><img style="height:1em;" src="img/ic_action_share.png"/></td></tr></tbody></table></td></tr>';
		t += '<tr><td style="vertical-align:bottom"><table style="width:100%;" class="keySelector"><tbody><tr>';
		t += '<td><select id="currentMod1" style="width:100%;" onchange="app.setCurrentMod1($(\'#currentMod1\').val()); app.closeMenu(); app.displayCurrentChapter(); return false;">';
		t += modOptions;
		t += '</select></td>';
		t += '<td><select id="currentMod2" style="width:100%;" onchange="app.setCurrentMod2($(\'#currentMod2\').val()); app.displayCurrentChapter(); return false;"><option></option>';
		t += modOptions;
		t += '</select></td>';
		t += '<td><select id="currentMod3" style="width:100%;" onchange="app.setCurrentMod3($(\'#currentMod3\').val()); app.displayCurrentChapter(); return false;"><option></option>';
		t += modOptions;
		t += '</select></td>';
		t += '</tr></tbody></table></td></tr>';
		t += '<tr class="menuLabel" onclick="verseStudy.show();return false;"><td><img src="img/ic_action_location_searching.png" style="height:1em;"/> Verse Study</td></tr>';
		t += '<tr><td class="menuLabel" onclick="app.toggleBookmarks(); return false;"><img src="img/bookmarks.png" style="height:1em;"/> Bookmarks</td></tr>';
		t += '<tr><td style="width:100%;"><div class="bookmarkPanel toshow">';
		t +=     '<div><button id="addBookmarkButton" onclick="app.bookmarkAdd(app.getCurrentKey());return false;">Add Current</button><button id="clearBookmarks" onclick="app.bookmarksClear();return false;">Clear All</button></div>';
		t +=     '<div id="bookmarkResults"></div>';
		t += '</div></td></tr>';
		t += '<tr><td class="menuLabel" onclick="app.toggleSearch(); return false;"><img src="img/ic_action_search.png" style="height:1em;"/> Search</td></tr>';
		t += '<tr><td style="width:100%;"><div class="searchPanel toshow">';
		t +=     '<div><input id="searchExpression" type="search"/><button id="searchButton" onclick="app.search();return false;">Go</button></div>';
		t +=     '<div id="searchResults"></div>';
		t += '</div></td></tr>';
		t += '<tr><td class="menuLabel" onclick="app.toggleBibleSync(); return false;"><img src="img/ic_action_group.png" style="height:1em;"/> BibleSync</td></tr>';
		t += '<tr><td style="width:100%;"><div class="bibleSyncPanel toshow">';
		t +=     '<div><button id="sendBibleSync" onclick="app.sendBibleSyncMessage(app.getCurrentKey());return false;">Send Current</button><button id="clearBibleSync" onclick="app.bibleSyncClear();return false;">Clear All</button></div>';
		t +=     '<div id="bibleSyncResults"></div>';
		t += '</div></td></tr>';
		t += '<tr class="menuLabel" onclick="installMgr.show();return false;"><td><img src="img/ic_action_download.png" style="height:1em;"/> Library</td></tr>';
		t += '<tr class="menuLabel" onclick="app.closeMenu(); app.toggleFootnotes();return false;"><td><img src="img/ic_action_about.png" style="height:1em;"/> Toggle Notes</td></tr>';
		t += '<tr class="menuLabel" onclick="app.closeMenu(); app.about();return false;"><td><img src="img/ic_action_about.png" style="height:1em;"/> About</td></tr>';
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
		app.updateBibleSyncDisplay();
		app.updateBookmarkDisplay();
		if (!app.getCurrentMod1() && mods.length) app.setCurrentMod1(mods[0].name);

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
		SWORD.mgr.sendBibleSyncMessage(osisRef);
		// add our own reference to the list so we keep our receive list in sync with others
		app.bibleSyncListener(osisRef);
	},
	bibleSyncListener: function(osisRef) {
		var index = app.bibleSyncRefs.indexOf(osisRef);
		if (index > 0) {
			app.bibleSyncRefs.splice(index, 1);
		}
		if (index != 0) {
			app.bibleSyncRefs.unshift(osisRef);
		}
		app.updateBibleSyncDisplay();
	},
	updateBibleSyncDisplay: function() {
		var t = '<table style="width:100%;"><thead><tr><th></th><th></th></tr></thead><tbody>';
		for (var i = 0; i < app.bibleSyncRefs.length; ++i) {
			t += '<tr class="searchHit"><td colspan="2">'+app.bibleSyncRefs[i]+'</td></tr>';
		}
		t += '</tbody></table>';
		$('#bibleSyncResults').html(t);
		app.registerSearchHitsHandler();
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
	toggleBibleSync: function() {
		if (!$('.bibleSyncPanel').hasClass('tohide')) app.openBibleSync();
		else app.closeBibleSync();
	},
	openBibleSync: function() {
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
		if ($('.menutab').hasClass('tohide')) return;
		$( ".menutab, .menupanel" ).animate({ left: "+=18em" }, 350, function() { });
		$('.menutab').removeClass('toshow').addClass('tohide');
	},
	closeMenu: function() {
		if ($('.menutab').hasClass('toshow')) return false;
		$( ".menutab, .menupanel" ).animate({ left: "-=18em" }, 350, function() { });
		$('.menutab').removeClass('tohide').addClass('toshow');    
		return true;
	},
	openFootnotes: function() {
		app.showingFootnotes = true;
		window.localStorage.setItem('showingFootnotes', app.showingFootnotes);
		if ($('#footnotes').hasClass('tohide')) return;
console.log('opening footnotes');
		$('#footnotes').removeClass('toshow').addClass('tohide');
		$("#footnotes, #footerBuffer").animate({ height: '8em' }, 350, function() {
		});
		app.displayFootnotes();
	},
	closeFootnotes: function() {
		app.showingFootnotes = false;
		window.localStorage.setItem('showingFootnotes', app.showingFootnotes);
		if ($('#footnotes').hasClass('toshow')) return false;
console.log('closing footnotes');
		$("#footnotes, #footerBuffer").animate({ height: '0' }, 350, function() {
			$('#footnotes').removeClass('tohide').addClass('toshow');    
		});
		return true;
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
		var t = '<div style="margin:1em;"><center><h3>New Unlock Code</h3>';
		t    += '<p>Bishop has just received a new unlock code for a module ('+mod+') which doesn\'t appear to be installed.  Would you like to install this module?';
		t    += '<p><button onclick="app.installModule(\''+mod+'\');return false;">Install Module</button></p></center></div>';
		$('#textDisplay').html(t);
		return;
	},
	installModule(mod, callback) {
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
	displayCurrentChapter: function() {
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
			t += '<li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+prevChapterString+'\', function() { app.displayCurrentChapter(); }); return false;">previous chapter</a></li>';
			t += '<li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+nextChapterString+'\', function() { app.displayCurrentChapter(); }); return false;">next chapter</a></li>';
			t += '</ul>';

			t += '<h2>'+currentVerse.bookName + ' ' + currentVerse.chapter +'</h2>';

			var mods = [];
			var renderData = [];



		var headerLoopContinue = function() {
console.log('headerLoopContinue. mods.length: ' + mods.length + '; renderData.length: ' + renderData.length);

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

					var rtol = ("RtoL".toUpperCase() == mods[i].direction.toUpperCase());
					var style = (mods[i].font && mods[i].font.length > 0)?('font-family:'+mods[i].font) : '';
					t += '<td style="'+ style +'" ' + (rtol ? 'dir="rtl"' : '') + ' class="' + mods[i].language + ' ' + (verseKey.verse == currentVerse.verse ? 'currentverse' : 'verse') + '">';

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
				var promoLine = mods[i].shortPromo;
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
				t += '<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>';
				t += '</div>';
				t += '<ul class="booknav">';
				t += '<li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+prevChapterString+'\', function() { app.displayCurrentChapter(); }); return false;">previous chapter</a></li>';
				t += '<li><a href="javascript:void(0);" onclick="app.setCurrentKey(\''+nextChapterString+'\', function() { app.displayCurrentChapter(); }); return false;">next chapter</a></li>';
				t += '</ul>';
				t += '</div>';
				t += '<div id="footerBuffer"></div>';
				$('#textDisplay').html(t);
				app.lastDisplayMods=mods;
				setTimeout(function() {
					if (app.getCurrentVerseKey().verse > 1) {
						var new_position = $('.currentverse').offset();
						$('#textDisplay').scrollTop(new_position.top-$('#textDisplay').offset().top-35);
					}
					app.displayFootnotes(function() {
console.log('**** checking if any modules await installation');
						if (app.waitingInstall) { app.installNewModules(app.waitingInstall); app.waitingInstall = null; }
					});
				}, 500);
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
							if (chapterData[j].text && chapterData[j].text.length > 0) {
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
		t += '<center><h2>Bishop version: 1.0</h2></center>';
		t += '<center><i>SWORD engine version: ' + SWORD.version + '</i></center>';
		t += '<h3>The CrossWire Bible Society</h3>';
		t += '<p>Bishop is a Bible study application from The CrossWire Bible Society and is a member of The SWORD Project family of Bible study tools.</p>';
		t += '<p>To learn more, visit us online<br/><center><a href="http://crosswire.org">The CrossWire Bible Society</a></center></p>';
		t += '<p>May God bless you as you seek to know Him more.</p>';
		t += '<h3>Modules</h3>';
		SWORD.mgr.getModInfoList(function(allMods) {
console.log('About: showing modules, count: ' + allMods.length);
			var getConfigsLoop = function(mods, i) {
				if (!i) i = 0;
				if (i >= mods.length) {
					t += '</div>';
					app.popupShow(t);
					$('.about').click(function(){
						app.popupHide();
					});
					return;
				}
				SWORD.mgr.getModuleByName(mods[i].name, function(module) {
					module.getConfigEntry('About', function(about) {
						SWORD.mgr.getExtraConfigValue(mods[i].name, "CipherKey", function(cip) {
							var ciphered = mods[i].cipherKey !== undefined;
							if (!cip) cip = '';
							t += '<h4>' + mods[i].name + ' - ' + mods[i].description + '</h4>' + (ciphered?(' (<button onclick="app.changeCipher(\''+mods[i].name+'\', \'' + cip + '\'); return false;">CipherKey: ' + cip + '</button>)<br/><br/>'):'') + about;
							getConfigsLoop(mods, ++i);
						});
					});
				});
			};
			getConfigsLoop(allMods);
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
		var cipher = prompt('Unlock Code for ' + modName, currentCipher);
		if (cipher != null) {
			var buffer = '['+modName+']\n';
			buffer += 'CipherKey='+cipher;
			SWORD.mgr.addExtraConfig(buffer, function(newMods) {
				app.show();
			});
		}
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
	}
};

app.initialize();
