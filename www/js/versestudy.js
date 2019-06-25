var verseStudy = {
	lastWitnessStudy : null,
	lastWitnessStudyTarget : null,
	show: function(startAt) {
		app.currentWindow = verseStudy;
		$('#main').html('<div id="toolbar"></div><div id="client"></div><div id="aux" class="dropdown-content"></div>');
		verseStudy.setupMenu(function() {
			if (startAt == 'app') {
				verseStudy.variantStudyClick();
			}
			else verseStudy.wordStudy();
			app.setAppLocale();
			$('#client').click(function(event) {
				if (!$(event.target).hasClass('dropclick') && !$(event.target).parent().hasClass('dropclick')) {
					verseStudy.closeMenus();
				}
			});
		});
	},
    
    
    setupMenu: function(callback) {

    var t  = '<header class="toolbar" id="versestudytoolbar">';
        t += '<button class="dropbtn dropclick left" onclick="app.handleBackButton(); return false;"> <div style="height:1.5em;font-size:170%;font-weight:bold;">&lt; </div><div> <span data-english="Back">Back</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveOne" onclick="verseStudy.wordStudy(); return false;"><div><span data-english="Word Study L1|Word">Word</span></div><div><span data-english="Word Study L2|Study">Study</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveTwo" onclick="verseStudy.commentary(); return false;"><div>&nbsp;</div><div><span data-english="Commentary">Commentary</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveThree" onclick="verseStudy.witnessStudy(); return false;"><div><span data-english="Witness Study L1|Witness">Witness</span></div><div><span data-english="Witness Study L2|Study">Study</span></div></button>';
//        t += '<div style="width:100%" class="dropdown twentyFiveFour">';
        t += '<button id="variantButton" class="dropbtn dropclick twentyFiveFour" onclick="verseStudy.variantStudyClick(); return false;"><div><span data-english="Variant Study L1|Variant">Variant</span></div><div><span data-english="Variant Study L2|Study">Study</span></div></button>';
//        t += '</div>';
        t += '</header>';
        $('#toolbar').html(t);
	if (callback) callback();
    },

    
	colorLemmas : function(wordnum, key, morph, target) {
		if (!target) target = '#client';
		$(target).find('span').each(function() { 
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

	wordSearch: function(mod, term, mod2, morph, target) {
		if (!target) target = '#client';
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
					$(target).html('<h3>Searching for "'+term+'" in ' + mod + '</h3>' + installMgr.getProgressHTML(e.percent + '%', e.percent));
				}
				else if (e.status == 'complete') {
console.log('wordSearch module.search, complete. results.length: ' + e.results.length);
					var t = '<h3>' + (!e.results.length ? 'No':e.results.length) + ' results found.</h3>';
					t += '<dl class="' + (lang?lang:'') + '">';
					var resultLoop = function(results, i) {
						if (!i) i = 0;
						if (i >= results.length) {
							// finish up results loop
							t += '</dl>';
							t += '<br/>';
							t += '<br/>';
							t += '<br/>';
							$(target).html(t);
							setTimeout(function() { verseStudy.colorLemmas('x', term, morph, target); }, 50);
							return;
						}
						var dispKey = results[i].key;
//console.log('wordSearch result['+i+']; key: ' + dispKey);
						module.setKeyText(dispKey, function() {
						t += '<dt><a href="passagestudy.jsp?key='+ encodeURI(dispKey)+'#cv" title="' + dispKey +'">' + dispKey + '</a></dt>';

						t += '<dd dir="' + (rtol ? 'rtl' : '') + '" style="' + (specialFont != null ? 'font-family:'+specialFont : '') + '">';
						t += '<table style="width:100%;"><tbody><tr>';
						t += '<td style="width:' + (showTwo?50:100) + '%;">';
						module.getRenderText(function(renderText) {
//console.log('wordSearch renderText mod1 complete: ' + renderText);
						t += renderText + '</td>';
						if (showTwo) {
							t += '<td style="width:50%;">';
							module2.setKeyText(dispKey, function() {
							module2.getRenderText(function(renderText2) {
//console.log('wordSearch renderText mod2 complete.');
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


	wordStudyWordClick: function(word, target) {
		if (!target) target = '#client';
		var lemma = $(word).attr('data-lemma');
		var morph = $(word).attr('data-morph').replace(/-/g, '\\-');
		$('#aux').html(
		    '<a href="#" onclick="return false;"><b style="white-space:nowrap">Show all occurrences of ' + lemma + ':</b></a>' +
		    '<a href="#" onclick="verseStudy.wordSearch(\''+(app.lastDisplayMods.length > 0 ? app.lastDisplayMods[0].name : '')+'\', \''+lemma+'\', \''+(app.lastDisplayMods.length > 1 ? app.lastDisplayMods[1].name : '')+'\', \''+morph+'\', \''+target+'\'); return false;">... any morphology in ' + app.lastDisplayMods[0].name + '</a>' +
//		    '<a href="#" onclick="verseStudy.wordSearch(\''+app.lastDisplayMods[0].name+'\', \''+lemma+\'@\'+morph+'\', \''+app.lastDisplayMods[1].name+'\', \''+morph+'\', \''+target+'\'); return false;">... same morphology in ' + app.lastDisplayMods[0].name + '</a>' + 
		    '<a href="#" onclick="verseStudy.wordSearch(\'LXX\', \''+lemma+'\', \'' + app.lastDisplayMods[0].name +'\', \''+morph+'\', \''+target+'\'); return false;">... any morphology in LXX</a>' +
//		    '<a href="#" onclick="verseStudy.wordSearch(\'LXX\', \''+lemma+'\', \'' + app.lastDisplayMods[0].name +'\', \''+morph+'\', \''+target+'\'); return false;">... same morphology in LXX</a>' +
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
		$('#aux').html('<a href="#" onclick="verseStudy.variantGraph(); return false;"><span data-english="Variant Graph">Variant Graph</span></a> <a href="#" onclick="verseStudy.alignmentTable(); return false;"><span data-english="Alignment Table">Alignment Table</span></a>' + (verseKey.osisRef.startsWith('Acts.') ? '<a href="#" onclick="verseStudy.dECMApp(); return false;"><span data-english="Digital ECM">Digital ECM</span></a>' : '')
		);
		app.setAppLocale(false, function() {
			var v = $('#aux');
			var b = $('#variantButton');
			$(v).toggleClass("show");
			$(v).css({
				'top': $(b).position().top + $(b).outerHeight(),
				'left': $(b).position().left + $(b).outerWidth() - $(v).outerWidth()
			});
console.log('aux.position: ' + JSON.stringify($('#aux').position()));
		});
	},


	wordStudy: function(target, module) {
console.log('*** Starting wordStudy');
		if (!target) target = '#client';
		verseStudy.closeMenus();
		$(target).html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Please wait...">Please wait...</span></h3></center></div>');
		app.setAppLocale(false, function() {
console.log('*** wordStudy begin');
			setTimeout(function() {
			var wordStudyBible = ((module || module == '') ? module : app.getWordStudyBible());
			// if wordStudyBible not choosen or 'First Active'
			if (wordStudyBible == '') {
				// check active modules in order for Strongs
				wordStudyBible = app.mods.filter(function(m) { return m.name == app.getCurrentMod1() && m.features && m.features.indexOf('StrongsNumbers') !== -1; }).shift();
				if (!wordStudyBible) wordStudyBible = app.mods.filter(function(m) { return m.name == app.getCurrentMod2() && m.features && m.features.indexOf('StrongsNumbers') !== -1; }).shift();
				if (!wordStudyBible) wordStudyBible = app.mods.filter(function(m) { return m.name == app.getCurrentMod3() && m.features && m.features.indexOf('StrongsNumbers') !== -1; }).shift();
				// if nothing still is found, prefer KJV
				if (!wordStudyBible) wordStudyBible = app.mods.filter(function(m) { return m.name == 'KJV'; }).shift();
				// then finally punt and take any module with Strongs
				if (!wordStudyBible) wordStudyBible = app.mods.filter(function(m) { return m.features && m.features.indexOf('StrongsNumbers') !== -1; }).shift();

				// finally, we want the name, not the ModInfo struct
				if (wordStudyBible) wordStudyBible = wordStudyBible.name;
			}
	console.log('*** wordStudy bible: ' + wordStudyBible);
			var errorText = null;
			var greekLex = app.greekDefMods.length > 0 ? app.greekDefMods[0] : null;
			var hebrewLex = app.hebrewDefMods.length > 0 ? app.hebrewDefMods[0] : null;
			if (!wordStudyBible) {
				errorText = '<h3>Word Study requires a Bible with Strongs numbers.  Please install one.</h3>';
			}
			else if (!greekLex || !hebrewLex) {
				errorText = '<h3>Word Study requires a Greek and Hebrew Strongs dictionary.  Please install one of each.</h3>';
			}
			if (errorText) {
				errorText += '<div><center><p>We would suggest installing from "CrossWire" the KJV, WLC, WHNU, StrongsGreek, and StrongsHebrew modules for a minimal set of modules which allow basic Greek and Hebrew word study.</p>';
				errorText += '<p>I can do all of this for you now, if you would like; simply press this button:</p><p><button style="height:3em;" onclick="app.basicStartup(1);return false;">Basic Module Set</button></p></center></div>';
				errorText += '<br/>';
				errorText += '<br/>';
				errorText += '<br/>';
				$(target).html(errorText);
				return;
			}

			SWORD.mgr.getModuleByName(wordStudyBible, function(mod) {
	console.log('*** wordStudy mod: ' + JSON.stringify(mod));
				SWORD.mgr.getModuleByName(greekLex, function(glex) {
					SWORD.mgr.getModuleByName(hebrewLex, function(hlex) {
						if (!mod) { alert ('No Bible Selected.  Please first select an installed module.'); return; }
	console.log('*** wordStudy setting mod.keyText: ' + JSON.stringify(app.getCurrentKey()));
						mod.setKeyText(app.getCurrentKey(), function() {
							mod.getRenderText(function(unused) {
	console.log('*** wordStudy getting word list');
								mod.getEntryAttribute('Word', '-', '-', false, function(words) {
									var h = '';
									var lexUsed = null;
									var loopFinish = function () {
										var t = '';
										t += '<br/>';
										t += '<br/>';
										t += '<br/>';
										t += '<table class="clean" style="table-layout:fixed;width:100%;"><tbody>';
										t += '<tr class="roweven" onclick="return false;">';
										t += '<td colspan="2" class="modDesc" style="width:100%;">'+ (lexUsed ? lexUsed : '&nbsp;') +'</td>';
										t += '</tr>';
										t += h;
										t += '</tbody></table>';
										t += '<div style="height:30em;">&nbsp;</div>';
										t += '<br/>';
										t += '<br/>';
										t += '<br/>';
										$(target).html(t);
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
											var partCount = 0; for (var j = 0; j < wordAttrs.length; ++j) { var keyval = wordAttrs[j].split('='); if (keyval.length > 1 && 'PartCount' == keyval[0] && keyval[1].length > 0) { try { partCount = parseInt(keyval[1]); } catch (e) { partCount = 0; };  break; }}
	console.log('text: ' + text + '; lemma: '+lemma+'; morph: '+morph+'; partCount: '+ partCount);
											h += '<tr class="roweven wordHeading" onclick="return false;">';
											h += '<td class="word">'+ (text.length ? text : '')+'</td>';
	//										h += '<td class="strong">'+(lemma.length ? lemma : '')+'</td>';
											h += '<td class="morph">'+(morph.length ? morph : '')+'</td>';
											h += '<td class="wordNum" style="display:none;">'+i+'</td>';
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
														var lexKeyText = lemmaPart.substring(1);
	console.log('wordStudy, about to lex.setKeyText; lemmaPart: ' + lemmaPart + '; lexKeyText: ' + lexKeyText);
														lex.setKeyText(lexKeyText, function() {
	console.log('wordStudy, after lex.setKeyText');
														lex.getRenderText(function(renderText) {
															if (!lexUsed) lexUsed = lex.description;
	console.log('wordStudy, after lex.getRenderText');
															h += '<tr data-lemma="'+lemmaPart+'" data-morph="'+morphPart+'" class="wordDef dropclick" onclick="verseStudy.wordStudyWordClick(this, \''+target+'\'); return false;">';
															h += '<td colspan="2" class="def">'+renderText+'</td>';
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
		});
	},
	witnessStudy : function(target) {
		if (!target) target = '#client';
		verseStudy.closeMenus();
		$(target).html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Fetching data from INTF.">Fetching data from INTF.</span><br/><span data-english="Please wait...">Please wait...</span></h3></center></div>');
		app.setAppLocale(false, function() {
			var limit = 40;
			var verseKey = app.getCurrentVerseKey();
			var postData = {
				biblicalContent : verseKey.osisRef,
				detail : 'page',
				limit : limit
			};
			var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/metadata/liste/search/';
console.log('****** Making request to: ' + url +'; params: '+JSON.stringify(postData));
			SWORD.httpUtils.makeRequest(url, $.param(postData), function(o) {
console.log('****** Returned from request to: ' + url);
console.log('****** About to parse result as XML. result.length:'+o.length);
				var xml = false;
				try {
					if (o) xml = $.parseXML(o);
				}
				catch (e) {
console.log('problem parsing XML: ' + e);
					xml = false;
				}
console.log('****** parsed XML.');
				var error = (xml ? $(xml).find('error').attr('message') : 'An error occurred requesting the data from the INTF');
				var t = '';
				if (error && error.length) {
					t = '<p><b><span data-english="'+error+'">'+error+'</span></b></p>';
				}
				else {
console.log('****** No error found.');
					t = '<p><b><span data-english="Some Manuscript Witnesses for Verse:">Some Manuscript Witnesses for Verse:</span> ' + verseKey.shortText + '</b></p>';
					t += '<table class="clean" width="100%">';
					t += '<thead class="fixedHeader"><tr><th data-english="Manuscript">Manuscript</th><th data-english="Century">Century</th><th data-english="Folio">Folio</th><th data-english="Content">Content</th><th data-english="Image">Image</th></tr></thead>';
					t += '<tbody class="scrollContent">';
console.log('****** iterating manuscripts.');
					$(xml).find('manuscript').each(function() {
						var m = this;
console.log('****** iterating pages.');
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
							t += '<tr><td>' + $(m).attr("gaNum").replace(/\([^)]*\)/g, '') + '</td>';
							t += '<td>' + $(m).find("originYear").text() + '</td>';
							t += '<td>' + $(this).attr("folio") + '</td><td>';
							if (transURL) {
								t += '<button style="width:100%; height:100%" onclick="verseStudy.showRemote(\'' + transURL + '\'); return false;">';
							}
							t += $(this).attr("biblicalContent");
							if (transURL) { t += '</a>'; }
							t += '</td><td>';
							if (imageURL) {
								t += '<div style="width:100%; height:100%" onclick="verseStudy.showRemote(\''+ imageURL + '\'); return false;">';
					
							}
							if (thumbURL) {
								t += '<img width="50px" src="' + thumbURL + '">';
							}
							if (imageURL) { t += '</div>'; }
							t += '</td></tr>';
						});
					});
console.log('****** done iterating manuscripts.');
					t += '</tbody></table>';
					t += '<div class="copyLine"><br/><span data-english="This dataset is by no means exhaustive and is growing rapidly. Check back soon for more results.">This dataset is by no means exhaustive and is growing rapidly. Check back soon for more results.</span><br/><br/><span data-english="Courtesy of">Courtesy of</span> <a href="http://egora.uni-muenster.de/intf/index_en.shtml">Institut für Neutestamentliche Textforschung</a></div>';
console.log('****** setting result to UI.');
					t += '<br/>';
					t += '<br/>';
					t += '<br/>';
					verseStudy.lastWitnessStudy = t;
					verseStudy.lastWitnessStudyTarget = target;
				}
				$(target).html(t);
console.log('****** translating UI.');
				app.setAppLocale();
			});
		});
	},
	showRemote : function(remoteURL, target) {
		if (verseStudy.lastWitnessStudy && verseStudy.lastWitnessStudyTarget) {
			app.backFunction = function() {
				$(verseStudy.lastWitnessStudyTarget).html(verseStudy.lastWitnessStudy);
				app.setAppLocale();
			}
		};
		if (!target) target = '#client';
		$(target).html('<iframe src="'+remoteURL+'"/>');
	},
	variantGraph : function(target) {
console.log('variantGraph showing...');
		if (!target) target = '#client';
		verseStudy.closeMenus();
		$(target).html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Fetching data from INTF.">Fetching data from INTF.</span><br/><span data-english="Please wait...">Please wait...</span></h3></center></div>');
		app.setAppLocale(false, function() {
			var verseKey = app.getCurrentVerseKey();
			var postData = {
				baseText : 'NA28',
				indexContent : verseKey.osisRef,
				extraVerses : 0,
				documentGroupID : 22 /*-1*/,
				ignorePunctuation : true,
				ignoreSupplied : true,
				ignoreUnclear : true,
				ignoreAccents : true,
				lang : 'grc',
				preferUser : '',
				regUserID : 'intfadmin',
				loadModule: 'ECM',
				regUserID: 'intfadmin',
				format : 'graph'
			}

			var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/collate/';
	console.log('requesting from INTF...');
			SWORD.httpUtils.makeRequest(url, $.param(postData), function(o) {
	console.log('received response from INTF...');

				$(target).html(o);
			});
		});
	},
	alignmentTable : function(target) {
		if (!target) target = '#client';
		verseStudy.closeMenus();
		$(target).html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Fetching data from INTF.">Fetching data from INTF.</span><br/><span data-english="Please wait...">Please wait...</span></h3></center></div>');
		app.setAppLocale(false, function() {
			var verseKey = app.getCurrentVerseKey();
			var postData = {
				baseText : 'NA28',
				indexContent : verseKey.osisRef,
				extraVerses : 0,
				documentGroupID : 22 /*-1*/,
				ignorePunctuation : true,
				ignoreSupplied : true,
				ignoreUnclear : true,
				ignoreAccents : true,
				lang : 'grc',
				preferUser : '',
				regUserID : 'intfadmin',
				loadModule: 'ECM',
				regUserID: 'intfadmin',
				format : 'atable'
			}
			var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/collate/';
			SWORD.httpUtils.makeRequest(url, $.param(postData), function(o) {
				$(target).html(o);
			});
		});
	},
	dECMApp : function(target) {
		if (!target) target = '#client';
		verseStudy.closeMenus();
		var verseKey = app.getCurrentVerseKey();
		// var url = 'https://apokalypse.isbtf.de/community/vmr/api/variant/apparatus/get/?format=html&indexContent='+verseKey.osisRef;
		var url = 'http://ntvmr.uni-muenster.de/community/vmr/api/variant/apparatus/get/?format=html&includeBaseline=ECM&indexContent='+verseKey.osisRef;

		$(target).html('<iframe class="client" src="'+url+'"/>');
	},
	commentary : function(target) {
		if (!target) target = '#client';
		verseStudy.closeMenus();
		setTimeout(function() {
		$(target).html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Please wait...">Please wait...</span></h3></center></div>');
		var t = '';
		t += '<br/>';
		t += '<br/>';
		t += '<br/>';
		t += '<table class="clean" style="width:100%;"><tbody>';
		app.setAppLocale(false, function() {
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
					t += '<div style="height:30em;">&nbsp;</div>';
					$(target).html(t);
					
				}
			});
		});
		}, 50);
	},
};
