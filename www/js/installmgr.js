var installMgr = {
	isDisclaimerAccepted : false,
	remoteAction : { action : 'none' },
	lastScrollTop : 0,
	show: function(callback) {
		app.currentWindow = installMgr;
		$('#main').html('<div id="toolbar"></div><div id="client"></div>');
		installMgr.setupMenu(function() {
			installMgr.showInstalled(function() {
				app.setAppLocale();
				if (callback) callback();
			});
		});
	},
	setupMenu: function(callback) {
    var t  = '<header class="toolbar" id="installtoolbar">';
        t += '<button class="dropbtn dropclick left" onclick="app.handleBackButton(); return false;"> <div style="height:1.5em;font-size:170%;font-weight:bold;">&lt; </div><div style="padding-bottom:1em;"> <span data-english="Back">Back</span></div></button>';
        t += '<button class="dropbtn dropclick midLeft" onclick="return false;"><span><label for="modSource"><span data-english="Modules">Modules</span></label></span><select id="modSource" onchange="installMgr.modSourceChanged();"><option>Installed</option></select></button>';
        t += '<button class="dropbtn dropclick midRight" onclick="return false;"><span><label for="catFilter"><span data-english="Type">Type</span></label></span><select id="catFilter" onchange="installMgr.modSourceChanged();"><option value="'+SWORD.CATEGORY_BIBLES+'" data-english="'+SWORD.CATEGORY_BIBLES+'">' + SWORD.CATEGORY_BIBLES + '</option></select></button>';
        t += '<button class="dropbtn dropclick right" onclick="installMgr.refreshSources(); return false;"><span style="font-size:170%;font-weight:bold;vertical-align:middle;"> &#x21bb; </span></button>';
        t += '</header>';

		$('#toolbar').html(t);
		installMgr.refreshModSourceList(callback);
	},
	showModules: function(modInfoList, noneMessage, details) {

		modInfoList.sort(function(o1, o2) { return o1.name > o2.name ? 1 : o2.name > o1.name ? -1 : 0; });

		var h = '<table class="clean" style="table-layout:fixed;width:100%;"><tbody>';
		var categories = {};

		// be sure Bibles is first in our list
		categories[SWORD.CATEGORY_BIBLES] = true;

		var catFilter = $('#catFilter').val();
		var allCategories = catFilter == 'All Modules';
		var count = 0;
		for (var i = 0; i < modInfoList.length; ++i) {
			categories[modInfoList[i].category] = true;
			if (allCategories || modInfoList[i].category == catFilter) {
				++count;
				h += '<tr class="row'+((count%2)?'odd':'even')+'" onclick="installMgr.modSelected(this);return false;">';
				if (details) {
					h += '<td class="instDelta">'+modInfoList[i].delta+'</td>';
				}
				h += '<td class="instName">'+modInfoList[i].name+'</td>';
				h += '<td class="instDesc">'+modInfoList[i].description+'</td>';
				h += '</tr>';
			}
		}
		if (!modInfoList.length) {
			h += '<tr><td style="width:100%;">'+noneMessage+'</td></tr>';
		}
		h += '</tbody></table>';
		h += '<br/>';
		h += '<br/>';
		h += '<br/>';

		var t = '<option value="All Modules" data-english="All Modules">All Modules</option>';
		for (var c in categories) {
			t += '<option value="'+c+'" data-english="'+c+'">'+c+'</option>';
		}
		$('#catFilter').html(t);
		$('#catFilter').val(catFilter);

		$('#client').html(h);
		app.setAppLocale();

		setTimeout(function() {
console.log('scrolling top to: ' + installMgr.lastScrollTop);
			$('#client').scrollTop(installMgr.lastScrollTop);
			installMgr.lastScrollTop = 0;
		}, 200);
	},
	setCipher: function(modName, cipher, callback) {
		var buffer = '['+modName+']\n';
		buffer += 'CipherKey='+cipher;
		SWORD.mgr.addExtraConfig(buffer, function(newMods) {
			if (callback) callback();
		});
	},
	modSelected: function(row) {
		var installed = $('#modSource').val() == 'Installed';
		var modName = $(row).find('.instName').text();
		if (installed) {
			SWORD.mgr.translate('Uninstall Module:', function(translated) {
				if (confirm(translated + ' ' + modName)) {
					SWORD.installMgr.uninstallModule(modName, function() {
						installMgr.modSourceChanged();
					});
				}
			});
		}
		else {
			var sourceName = $('#modSource').val();
			SWORD.installMgr.getRemoteModuleByName(sourceName, modName, function(remoteMod) {
console.log('remoteMod: ' + JSON.stringify(remoteMod));
				remoteMod.getConfigEntry('UnlockInfo', function(unlockInfo) {
					var ciphered = remoteMod.cipherKey !== undefined;
					var t = '<div class="about">';
					t += '<h4>' + remoteMod.name + ' - ' + remoteMod.description + '</h4>';
					if (ciphered) {
						t += '<p data-english="The module you have requested for install is locked and requires an unlock key which can be provided below.">The module you have requested for install is locked and requires an unlock key which can be provided below.</p>';
						if (unlockInfo && unlockInfo.length) {
							t += '<p data-english="Instructions from the publisher on how to obtain an unlock key follow:">Instructions from the publisher on how to obtain an unlock key follow:</p>';
							t += '<p>'+unlockInfo+'</p>';
						}
						t += '<br/>';
						t += '<p><span data-english="Unlock Key:">Unlock Key:</span> <input id="cipherKey"/><button data-english="Install" onclick="installMgr.setCipher(\''+modName+'\', $(\'#cipherKey\').val(), function() { app.popupHide(); installMgr.installModule(\''+sourceName+'\', \''+modName+'\');}); return false;">Install</button></p>';
						t += '<p data-english="If you do not yet have an unlock key, you can still install this module now and provide the key later using the \'About\' screen of this application.">If you do not yet have an unlock key, you can still install this module now and provide the key later using the \'About\' screen of this application.</p>';
					}
					else {
						t += '<p><button data-english="Install" onclick="app.popupHide(); installMgr.installModule(\''+sourceName+'\', \''+modName+'\'); return false;">Install</button>';
					}
					t += '<button data-english="Cancel" onclick="app.popupHide(); return false;">Cancel</button></p>';
					remoteMod.getConfigEntry('About', function(about) {
						t += '<div>'+(about?about:'')+'</div>';
						if (remoteMod.shortPromo && remoteMod.shortPromo.length) t += '<div class="promoLine">' + remoteMod.shortPromo +'</div>';
				t += '<br/>';
						t += '</div>';
						app.popupShow(t);
					});
				});
			});
		}
	},
	getProgressHTML: function(text, percent) {
	var buffer ='';
	
	buffer += '<div style="margin: 0pt; padding: 0pt; width: 100%; white-space: nowrap; text-align: center; position: relative; z-index:0;">';
	buffer += '&nbsp;' + text;

	if (percent > 0) { // for stupid ie 
		buffer += '<div style="position: absolute; top:0px; left:0px; margin: 0pt; padding: 0pt; background: transparent url(img/statusbar_green.gif) repeat-x scroll 0% 0%; overflow: visible; width: ' + percent + '%; -moz-background-clip: border; -moz-background-origin: padding; -moz-background-inline-policy: continuous; vertical-align: middle; filter:alpha(opacity=40); -khtml-opacity: 0.40; -moz-opacity: 0.40; opacity:0.40; z-index:-1;">';
		buffer += '&nbsp;';
		buffer += '</div>';
	} // for stupid ie 

	buffer += '</div>';
	return buffer;
	},
	installModule: function(modSource, modName, callback) {
console.log('**** installMgr.installModule(source: ' + modSource + '; modName: ' + modName);
		if (!installMgr.lastScrollTop) installMgr.lastScrollTop = $('#client').scrollTop();
console.log('scrollTop is: ' + installMgr.lastScrollTop);
		if (!installMgr.isDisclaimerAccepted) {
console.log('**** installMgr.installModule. disclaimer not yet accepted');
			installMgr.remoteAction = {
				action : 'install',
				modSource : modSource,
				modName : modName,
				callback : callback
			};
			return installMgr.showDisclaimer();
		}

console.log('**** installMgr.installModule. disclaimer accepted. installing module');

		$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Installing Module:">Installing Module:</span> '+modName+'.  <span data-english="Please wait...">Please wait...</span></h3></center><br/><br/><div id="totalProgress"></div><br/><div id="status"></div></div>');
		app.setAppLocale();
		setTimeout(function() {
			var lastMessage = '';
			var totalBytes = 0;
			var completedBytes = 0;
			$('#status').html(installMgr.getProgressHTML('Connecting to server.', 0));
			SWORD.installMgr.remoteInstallModule(modSource, modName, function(e) {
				if (e.status == "preStatus") {
					lastMessage = e.message;
					totalBytes = e.totalBytes;
					completedBytes = e.completedBytes;
					$('#status').html(installMgr.getProgressHTML(lastMessage + '(0%)', 0));
				}
				else if (e.status == "update") {
					var percent = (e.completedBytes/e.totalBytes * 100).toFixed(2);
					$('#status').html(installMgr.getProgressHTML(lastMessage + ' (' + percent + '%)', percent));
					percent = ((completedBytes + e.completedBytes)/totalBytes * 100).toFixed(2);
					$('#totalProgress').html(installMgr.getProgressHTML('Total Progress: ' + percent + '%', percent));
				}
				else if (e.status == "complete") {
					// only refesh source list if no subsequent processing callback
					if (callback) callback();
					else installMgr.modSourceChanged();
				}
			});
		}, 100);
	},
	setDisclaimerAccepted: function() {
		installMgr.isDisclaimerAccepted = true;
		SWORD.installMgr.setUserDisclaimerConfirmed(function() {
			if (installMgr.remoteAction.action == 'refresh') {
				if (!installMgr.remoteAction.callback) installMgr.remoteAction.callback=installMgr.modSourceChanged;
				installMgr.refreshSources(installMgr.remoteAction.callback);
			}
			else if (installMgr.remoteAction.action == 'install') installMgr.installModule(installMgr.remoteAction.modSource, installMgr.remoteAction.modName, installMgr.remoteAction.callback);
		});
	},
	showDisclaimer: function() {
		var h = '<center><h2><span data-english="InstallMgr Warning Header|-=+* WARNING *+=-">-=+* WARNING *+=-</span></h2></center>';
		h += '<p data-english="InstallMgr Warning L1|Although Install Manager provides a convenient way for installing ';
		h += 'and upgrading SWORD components, it also uses a systematic method ';
		h += 'for accessing sites which gives packet sniffers a target to lock ';
		h += 'into for singling out users.">Although Install Manager provides a convenient way for installing ';
		h += 'and upgrading SWORD components, it also uses a systematic method ';
		h += 'for accessing sites which gives packet sniffers a target to lock ';
		h += 'into for singling out users.</p>';
		h += '<p data-english="InstallMgr Warning L2|IF YOU LIVE IN A PERSECUTED COUNTRY AND DO NOT WISH TO RISK DETECTION, ';
		h += 'YOU SHOULD *NOT* USE INSTALL MANAGER\'S REMOTE SOURCE FEATURES.">';
		h += 'IF YOU LIVE IN A PERSECUTED COUNTRY AND DO NOT WISH TO RISK DETECTION, ';
		h += 'YOU SHOULD *NOT* USE INSTALL MANAGER\'S REMOTE SOURCE FEATURES.</p>';
		h += '<p data-english="InstallMgr Warning L3|';
		h += 'Also, Remote Sources other than CrossWire may contain less than ';
		h += 'quality modules, modules with unorthodox content, or even modules ';
		h += 'which are not legitimately distributable.  Many repositories ';
		h += 'contain wonderfully useful content.  These repositories simply ';
		h += 'are not reviewed or maintained by CrossWire and CrossWire ';
		h += 'cannot be held responsible for their content. CAVEAT EMPTOR.">';
		h += 'Also, Remote Sources other than CrossWire may contain less than ';
		h += 'quality modules, modules with unorthodox content, or even modules ';
		h += 'which are not legitimately distributable.  Many repositories ';
		h += 'contain wonderfully useful content.  These repositories simply ';
		h += 'are not reviewed or maintained by CrossWire and CrossWire ';
		h += 'cannot be held responsible for their content. CAVEAT EMPTOR.</p>';
		h += '<p data-english="InstallMgr Warning L4|';
		h += 'If you understand this and are willing to enable remote source features ';
		h += 'then click the &quot;Accept&quot; button below.">';
		h += 'If you understand this and are willing to enable remote source features ';
		h += 'then click the "Accept" button below.</p>';
		h += '<p><center><button style="height:3em;" onclick="installMgr.setDisclaimerAccepted();return false;"><span data-english="InstallMgr Warning Accept|Accept">Accept</span></button></center></p>';
		h += '<br/>';
		h += '<br/>';
		h += '<br/>';
		$('#client').html(h);
		app.setAppLocale();
	},
	showInstalled: function(callback) {
		SWORD.mgr.getModInfoList(function(modInfoList) {
			installMgr.showModules(modInfoList, 'No Modules Installed');
			if (callback) callback();
		});
	},
	showRemoteModules: function(sourceName) {
		SWORD.installMgr.getRemoteModInfoList(sourceName, function(modInfoList) {
			installMgr.showModules(modInfoList, 'No Modules Available.  Try pressing the [&#x21bb;] button.', true);
		});
	},
	modSourceChanged: function() {
		var sourceName = $('#modSource').val();
		if (sourceName == 'Installed') installMgr.showInstalled();
		else installMgr.showRemoteModules(sourceName);
	},
	refreshModSourceList: function(callback) {
		var t = '<option value="Installed" data-english="Installed">Installed</option>';
		SWORD.installMgr.getRemoteSources(function(sources) {
			for (var i = 0; i < sources.length; ++i) {
				t += '<option>'+sources[i]+'</option>';
			}
			$('#modSource').html(t);
			app.setAppLocale();
			if (callback) callback();
		});
	},
	refreshSources: function(callback) {
		if (!installMgr.isDisclaimerAccepted) {
			installMgr.remoteAction = {
					action : 'refresh',
					callback : callback
			};
			return installMgr.showDisclaimer();
		}

		$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Discovering Remote Repositories.">Discovering Remote Repositories.</span><br/><span data-english="Please wait...>Please wait...</span></h3></center></div>');
		app.setAppLocale();
		// let our loading page draw before we do the work
		setTimeout(function() {
			SWORD.installMgr.syncConfig(function() {
				installMgr.refreshModSourceList();
				SWORD.installMgr.getRemoteSources(function(sources) {
					var loop = function(srcs, callback, i) {
						if (!i) { i = 0; }
						if (i >= srcs.length) { callback(); return; }
						$('#client').html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Refreshing Repository:">Refreshing Repository:</span> '+srcs[i]+'.  <br/><span data-english="Please wait...">Please wait...</span></h3></center></div>');
						app.setAppLocale();
						setTimeout(function() {
							SWORD.installMgr.refreshRemoteSource(srcs[i], function() {
								loop(srcs, callback, ++i);
							});
						}, 100);
					};
					loop(sources, function() {
						$('#client').html('');
						if (callback) callback();
					});
				});
			});
		}, 100);
	},
};
