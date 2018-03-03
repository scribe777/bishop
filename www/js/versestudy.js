var verseStudy = {
	show: function(startAt) {
		app.currentWindow = verseStudy;
		$('#main').html('<div id="toolbar"></div><div id="client"></div><div id="aux" class="dropdown-content"></div>');
		verseStudy.setupMenu();
		if (startAt == 'app') {
			verseStudy.variantStudyClick();
		}
		else verseStudy.wordStudy();
		$('#client').click(function(event) {
			if (!$(event.target).hasClass('dropclick') && !$(event.target).parent().hasClass('dropclick')) {
				verseStudy.closeMenus();
			}
		});
	},
    
    
    setupMenu: function() {

    var t  = '<header class="toolbar" id="versestudytoolbar">';
        t += '<button class="dropbtn dropclick" onclick="app.handleBackButton(); return false;"> <div style="font-size:170%;font-weight:bold;">&lt; </div><div> Back</div></button>';
        t += '<button class="dropbtn dropclick" onclick="verseStudy.wordStudy(); return false;"><div>Word</div><div>Study</div></button>';
        t += '<button class="dropbtn dropclick" onclick="verseStudy.commentary(); return false;"><div>&nbsp;</div><div>Commentary</div></button>';
        t += '<button class="dropbtn dropclick" onclick="verseStudy.witnessStudy(); return false;"><div>Witness</div><div>Study</div></button>';
        t += '<div style="width:100%" class="dropdown">';
        t += '<button id="variantButton" class="dropbtn dropclick" onclick="verseStudy.variantStudyClick(); return false;"><div>Variant</div><div>Study</div></button>';
        t += '</div>';
        t += '</header>';
        $('#toolbar').html(t);
    },

    
	colorLemmas : function(wordnum, key, morph) {
		$('#client').find('span').each(function() { 
			var span = $(this);
			var onClickFunction = $(this).attr('onclick');
			if (onClickFunction) {
				var onClick = onClickFunction.toString();
				var fb = onClick.indexOf('p(');
				if (fb >= 0) {
					var fe = onClick.indexOf(')', fb);
					var wd = function (mod, key, wordnum, extratext) {
						var retVal = {
							strong : '',
							morph : '',
							wnum : '',
							mod : ''
						};
						retVal.mod = mod;
						if ((mod == 'G') || (mod == 'StrongsGreek')
						 || (mod == 'H') || (mod == 'StrongsHeb')) {
							retVal.strong = key;
							retVal.morph = extratext;
							retVal.wnum = wordnum;
						}
						return retVal;
					};

					var wordDataFunction = 'wd'+onClick.substring(fb+1, fe+1);
					var vals = eval(wordDataFunction);
					if (vals.strong.split('|').indexOf(key) > -1 || ((['G','H'].indexOf(key.charAt(0)) > -1) && (vals.strong.split('|').indexOf(key.substring(1)) > -1))) {
						if (vals.morph.split('|').indexOf(morph) > -1) {
							$(span).addClass('sameLemmaMorph');
						}
						else {
							$(span).addClass('sameLemma');
						}
					}
				}
			}
		});
	},

	wordSearch: function(mod, term, mod2, morph) {
console.log('********* wordSearch; mod: ' + mod + '; term:' + term + '; mod2: ' + mod2);
		verseStudy.closeMenus();
		var showTwo = mod2; // (activeModule2 != null && activeModule2.getRenderText().trim().length() > 0);
		SWORD.mgr.setJavascript(true, function() {
		SWORD.mgr.getModuleByName(mod, function(module) {
		SWORD.mgr.getModuleByName(mod2?mod2:mod, function(module2) {
                        module.getConfigEntry("Direction", function(direction) {
                        module.getConfigEntry("Lang", function(lang) {
                        module.getConfigEntry("Font", function(specialFont) {
                        var rtol = (direction && 'RTOL' == direction.toUpperCase());
			module.search('Word//Lemma./'+term+'/', module.SEARCHTYPE_ENTRYATTR, 0, null, function(e) {
				if (e.status == 'update') {
					$('#client').html('<h3>Searching for "'+term+'" in ' + mod + '</h3>' + installMgr.getProgressHTML(e.percent + '%', e.percent));
				}
				else if (e.status == 'complete') {
console.log('wordSearch module.search, complete. results.length: ' + e.results.length);
					var t = '<h3>' + (!e.results.length ? 'No':e.results.length) + ' results found.</h3>';
					t += '<dl class="' + lang + '">';
					var resultLoop = function(results, i) {
						if (!i) i = 0;
						if (i >= results.length) {
							// finish up results loop
							t += '</dl>';
							$('#client').html(t);
							setTimeout(function() { verseStudy.colorLemmas('x', term, morph, true); }, 50);
							return;
						}
						var dispKey = results[i].key;
console.log('wordSearch result['+i+']; key: ' + dispKey);
						module.setKeyText(dispKey, function() {
						t += '<dt><a href="passagestudy.jsp?key='+ encodeURI(dispKey)+'#cv" title="' + dispKey +'">' + dispKey + '</a></dt>';

						t += '<dd dir="' + (rtol ? 'rtl' : '') + '" style="' + (specialFont != null ? 'font-family:'+specialFont : '') + '">';
						t += '<table style="width:100%;"><tbody><tr>';
						t += '<td style="width:' + (showTwo?50:100) + '%;">';
						module.getRenderText(function(renderText) {
console.log('wordSearch renderText mod1 complete: ' + renderText);
						t += renderText + '</td>';
						if (showTwo) {
							t += '<td style="width:50%;">';
							module2.setKeyText(dispKey, function() {
							module2.getRenderText(function(renderText2) {
console.log('wordSearch renderText mod2 complete.');
							t += renderText2 + '</td>';
							t += '</tr></tbody></table></dd>';
							resultLoop(results, ++i);
							});});
						}
						else {
							t += '</tr></tbody></table></dd>';
							resultLoop(results, ++i);
						}
						});});
					};
					resultLoop(e.results);
				}
			}); }); }); });
		}); }); });
	},


	wordStudyWordClick: function(word) {
		var lemma = $(word).attr('data-lemma');
		var morph = $(word).attr('data-morph').replace(/-/g, '\\-');
		$('#aux').html(
		    `<a href="#" onclick="return false;"><b style="white-space:nowrap">Show all occurrences of ` + lemma + `:</b></a>` +
		    `<a href="#" onclick="verseStudy.wordSearch('`+app.lastDisplayMods[0].name+`', '`+lemma+`', '`+app.lastDisplayMods[1].name+`', '`+morph+`'); return false;">... any morphology in ` + app.lastDisplayMods[0].name + `</a>` +
//		    `<a href="#" onclick="verseStudy.wordSearch('`+app.lastDisplayMods[0].name+`', '`+lemma+'@'+morph+`', '`+app.lastDisplayMods[1].name+`', '`+morph+`'); return false;">... same morphology in ` + app.lastDisplayMods[0].name + `</a>` + 
		    `<a href="#" onclick="verseStudy.wordSearch('LXX', '`+lemma+`', '` + app.lastDisplayMods[0].name +`', '`+morph+`'); return false;">... any morphology in LXX</a>` +
//		    `<a href="#" onclick="verseStudy.wordSearch('LXX', '`+lemma+`', '` + app.lastDisplayMods[0].name +`', '`+morph+`'); return false;">... same morphology in LXX</a>` +
		'');
		setTimeout(function() {
		var v = $('#aux');
		var b = $('#variantButton');
		$(v).toggleClass("show");
		$(v).css({
			'top': $(b).position().top + $(b).outerHeight(),
			'left': $(b).position().left + $(b).outerWidth() - $(v).outerWidth()
		});
//console.log('aux.position: ' + JSON.stringify($('#aux').position()));
//console.log('aux: ' + $('#aux').outerHTML);
		}, 50);
	},


	closeMenus: function() {
		$(".dropdown-content").removeClass('show');
	},


	variantStudyClick: function() {
		var verseKey = app.getCurrentVerseKey();
		$('#aux').html(`
		    <a href="#" onclick="verseStudy.variantGraph(); return false;">Variant Graph</a>
		    <a href="#" onclick="verseStudy.alignmentTable(); return false;">Alignment Table</a>
		`
		+ (verseKey.bookName == 'Acts' ? '<a href="#" onclick="verseStudy.dECMApp(); return false;">Digital ECM</a>' : '')
		);
		var v = $('#aux');
		var b = $('#variantButton');
		$(v).toggleClass("show");
		$(v).css({
			'top': $(b).position().top + $(b).outerHeight(),
			'left': $(b).position().left + $(b).outerWidth() - $(v).outerWidth()
		});
console.log('aux.position: ' + JSON.stringify($('#aux').position()));
	},


	wordStudy: function() {
		verseStudy.closeMenus();
		$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3>Please wait...</h3></center></div>');
console.log('*** wordStudy begin');
		setTimeout(function() {
		SWORD.mgr.getModuleByName(app.getCurrentMod1(), function(mod) {
console.log('*** wordStudy mod: ' + JSON.stringify(mod));
			SWORD.mgr.getModuleByName("StrongsGreek", function(glex) {
				SWORD.mgr.getModuleByName("StrongsHebrew", function(hlex) {
					if (!mod) { alert ('No Bible Selected.  Please first select an installed module.'); return; }
console.log('*** wordStudy setting mod.keyText: ' + JSON.stringify(app.getCurrentKey()));
					mod.setKeyText(app.getCurrentKey(), function() {
						mod.getRenderText(function(unused) {
console.log('*** wordStudy getting word list');
							mod.getEntryAttribute('Word', '-', '-', false, function(words) {
								var h = '<table class="clean" style="table-layout:fixed;width:100%;"><tbody>';
								var loopFinish = function () {
									h += '</tbody></table>';
									$('#client').html(h);
								};
console.log('*** words.length: ' + words.length);
								var loop = function(i) {
									if (!i) i = 0;
									if (i >= words.length) return loopFinish();
console.log('*** loopi: ' + i + '; word: ' + words[i]);
								
									// /x/y/*/ gives us key=value list
									mod.getEntryAttribute('Word', words[i], '*', false, function(wordAttrs) {
console.log('*** word['+i+'] wordAttrs: ' + JSON.stringify(wordAttrs));
										var text = ''; for (var j = 0; j < wordAttrs.length; ++j) { var keyval = wordAttrs[j].split('='); if (keyval.length > 1 && 'Text' == keyval[0]) { text = keyval[1]; break; }}
										var lemma = ''; for (var j = 0; j < wordAttrs.length; ++j) { var keyval = wordAttrs[j].split('='); if (keyval.length > 1 && 'Lemma' == keyval[0]) { lemma = keyval[1]; break; }}
										var morph = ''; for (var j = 0; j < wordAttrs.length; ++j) { var keyval = wordAttrs[j].split('='); if (keyval.length > 1 && 'Morph' == keyval[0]) { morph = keyval[1]; break; }}
										var partCount = 0; for (var j = 0; j < wordAttrs.length; ++j) { var keyval = wordAttrs[j].split('='); if (keyval.length > 1 && 'PartCount' == keyval[0]) { partCount = parseInt(keyval[1]); break; }}
console.log('text: ' + text + '; lemma: '+lemma+'; morph: '+morph+'; partCount: '+ partCount);
										h += '<tr class="roweven" onclick="return false;">';
										h += '<td class="word">'+ (text.length ? text : '')+'</td>';
										h += '<td class="strong">'+(lemma.length ? lemma : '')+'</td>';
										h += '<td class="morph">'+(morph.length ? morph : '')+'</td>';
										h += '</tr>';
										var loopj = function(j) {
											if (!j) j = 1;
											if (j > partCount) {
												return loop(++i);
											}
console.log('part: '+j);
											var lemmaPart = lemma; for (var k = 0; k < wordAttrs.length; ++k) { var keyval = wordAttrs[k].split('='); if (keyval.length > 1 && 'Lemma.'+j == keyval[0]) { lemmaPart = keyval[1]; break; }}
											var morphPart = morph; for (var k = 0; k < wordAttrs.length; ++k) { var keyval = wordAttrs[k].split('='); if (keyval.length > 1 && 'Morph.'+j == keyval[0]) { morphPart = keyval[1]; break; }}
											var lemmaClass = ''; for (var k = 0; k < wordAttrs.length; ++k) { var keyval = wordAttrs[k].split('='); if (keyval.length > 1 && 'LemmaClass.'+j == keyval[0]) { lemmaClass = keyval[1]; break; }}
											if (lemmaClass == '') { for (var k = 0; k < wordAttrs.length; ++k) { var keyval = wordAttrs[k].split('='); if (keyval.length > 1 && 'LemmaClass'+j == keyval[0]) { lemmaClass = keyval[1]; break; }}}
console.log('lemmaPart: '+lemmaPart+'; lemmaClass: '+lemmaClass);
											if (lemmaPart.length && (!lemmaClass.length || lemmaClass == 'strong') && ((lemmaPart[0] == 'G' && glex) || (lemmaPart[0] == 'H' && hlex))) {
												var lex = lemmaPart[0] == 'G' ? glex : hlex;
console.log('lex: ' + JSON.stringify(lex));
												if (lex) {
													lex.setKeyText(lemmaPart.substring(1), function() {
													lex.getRenderText(function(renderText) {
														h += '<tr data-lemma="'+lemmaPart+'" data-morph="'+morphPart+'" class="dropclick" onclick="verseStudy.wordStudyWordClick(this); return false;">';
														h += '<td colspan="3" class="def">'+renderText+'</td>';
														h += '</tr>';
														loopj(++j);
													}); });
												}
												else loopj(++j);
											}
											else loopj(++j);
										};
										loopj();
									});
								};
								loop();
							});
						});
					});
				});
			});
		});
		}, 50);
	},
	witnessStudy : function() {
		verseStudy.closeMenus();
		$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3>Fetching data from INTF.<br/>Please wait...</h3></center></div>');
		var limit = 40;
		var verseKey = app.getCurrentVerseKey();
		var postData = {
			biblicalContent : verseKey.osisRef,
			detail : 'page',
			limit : limit
		};
		var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/metadata/liste/search/';
		SWORD.httpUtils.makeRequest(url, $.param(postData), function(o) {
			var xml = $.parseXML(o);
			var error = $(xml).find('error');
			if (error && error.length) {
				alert('error: '+$(error).attr('message'));
			}
			else {
				var t = '<p><b>Some Manuscript Witnesses for ' + verseKey.shortText + '</b></p>';
				t += '<table class="clean" width="100%">';
				t += '<thead class="fixedHeader"><tr><th>Manuscript</th><th>Century</th><th>Folio</th><th>Content</th><th>Image</th></tr></thead>';
				t += '<tbody class="scrollContent">';
				$(xml).find('manuscript').each(function() {
					var m = this;
					$(this).find('page').each(function() {
						var thumbURL = null;
						var imageURL = null;
						var transURL = null;
						if ($(this).find("image").length) {
							thumbURL = $(this).find('image').attr("thumbURL");
							imageURL = $(this).find('image').attr("viewURL");
						}
						if ($(this).find("transcription").length) {
							transURL = $(this).find('transcription').attr("uri");
						}
						var mssURL = 'http://ntvmr.uni-muenster.de/manuscript-workspace?docID=' + $(m).attr("docID")+"&pageID="+$(this).attr("pageID");
						//t += '<tr><td><a href="'+ mssURL + '" target="NTVMR">' + $(m).attr("gaNum") + '</a></td>';
						t += '<tr><td>' + $(m).attr("gaNum") + '</td>';
						t += '<td>' + $(m).find("originYear").text() + '</td>';
						t += '<td>' + $(this).attr("folio") + '</td><td>';
						if (transURL) {
							t += `<button style="width:100%; height:100%" onclick="verseStudy.showRemote('` + transURL + '\'); return false;">';
						}
						t += $(this).attr("biblicalContent");
						if (transURL) { t += '</a>'; }
						t += '</td><td>';
						if (imageURL) {
							t += `
								<div style="width:100%; height:100%" onclick="verseStudy.showRemote('`+ imageURL + `'); return false;">
							`;
				
						}
						if (thumbURL) {
							t += '<img width="50px" src="' + thumbURL + '"/>';
						}
						if (imageURL) { t += '</div>'; }
						t += '</td></tr>';
					});
				});
				t += '</tbody></table>';
				t += '<div class="copyLine"><br/>This dataset is by no means exhaustive and is growing rapidly. Check back soon for more results.<br/><br/>Courtesy of <a href="http://egora.uni-muenster.de/intf/index_en.shtml">Institut für Neutestamentliche Textforschung</a></div>';
				$('#client').html(t);
			}
		});
	},
	showRemote : function(remoteURL) {
		$('#client').html('<iframe src="'+remoteURL+'" scrolling="yes"></iframe>');
	},
	variantGraph : function() {
		verseStudy.closeMenus();
		$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3>Fetching data from INTF.<br/>Please wait...</h3></center></div>');
		var verseKey = app.getCurrentVerseKey();
		var postData = {
			baseText : 'NA28',
			verse : verseKey.osisRef,
			documentGroupID : 22 /*-1*/,
			ignorePunctuation : true,
			ignoreSupplied : true,
			ignoreUnclear : true,
			lang : 'grc',
//			preferUser : 'ALL',
			regUserID : 'intfadmin',
			format : 'graph'
		}
		var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/collate/';
		SWORD.httpUtils.makeRequest(url, $.param(postData), function(o) {
			$('#client').html(o);
		});
	},
	alignmentTable : function() {
		verseStudy.closeMenus();
		$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3>Fetching data from INTF.<br/>Please wait...</h3></center></div>');
		var verseKey = app.getCurrentVerseKey();
		var postData = {
			baseText : 'NA28',
			verse : verseKey.osisRef,
			documentGroupID : 22 /*-1*/,
			ignorePunctuation : true,
			ignoreSupplied : true,
			ignoreUnclear : true,
			lang : 'grc',
//			preferUser : 'ALL',
			regUserID : 'intfadmin',
			format : 'atable'
		}
		var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/collate/';
		SWORD.httpUtils.makeRequest(url, $.param(postData), function(o) {
			$('#client').html(o);
		});
	},
	dECMApp : function() {
		verseStudy.closeMenus();
		var verseKey = app.getCurrentVerseKey();
		// var url = 'https://apokalypse.isbtf.de/community/vmr/api/variant/apparatus/get/?format=html&indexContent='+verseKey.osisRef;
		var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/variant/apparatus/get/?format=html&indexContent='+verseKey.osisRef;

		$('#client').html('<iframe class="client" src="'+url+'"/>');
	},
	commentary : function() {
		verseStudy.closeMenus();
		setTimeout(function() {
		$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3>Please wait...</h3></center></div>');
		var t = '<table class="clean" style="width:100%;"><tbody>';
		SWORD.mgr.getModInfoList(function(mods) {
			function loop(i) {
				if (!i) i = 0; if (i >= mods.length) return loopFinish();
				if (mods[i].category != SWORD.CATEGORY_COMMENTARIES) return loop(++i);

				t += '<tr class="roweven" onclick="return false;">';
				t += '<td class="modName">'+ mods[i].name +'</td>';
				t += '<td class="modDesc" style="width:100%;">'+ mods[i].description +'</td>';
				t += '</tr>';
				SWORD.mgr.getModuleByName(mods[i].name, function(mod) {
				mod.setKeyText(app.getCurrentKey(), function() {
				mod.getRenderText(function(renderText) {
					t += '<tr>';
					t += '<td colspan="2" class="def">'+renderText+'</td>';
					t += '</tr>';
					loop(++i);
				}); }); });
			} loop();
			function loopFinish() {
				t += '</tbody></table>';
				$('#client').html(t);
				
			}
		});
		}, 50);
	}
};
