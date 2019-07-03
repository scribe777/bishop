var dailyDevo = {
	show: function() {
		app.currentWindow = dailyDevo;
		$('#main').html('<div id="toolbar"></div><div id="client"></div><div id="aux" class="dropdown-content"></div>');
		dailyDevo.setupMenu(function() {
			$('#devoName1').parents('button').click();
			app.setAppLocale();
		});
	},
    
    
    setupMenu: function(callback) {

    var t  = '<header class="toolbar" id="versestudytoolbar">';
        t += '<button class="dropbtn dropclick left" onclick="app.handleBackButton(); return false;"> <div style="height:1.5em;font-size:170%;font-weight:bold;">&lt; </div><div> <span data-english="Back">Back</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveOne" onclick="dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName1">&nbsp;</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveTwo" onclick="dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName2">&nbsp;</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveThree" onclick="dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName3">&nbsp;</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveFour" onclick="dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName4">&nbsp;</span></div></button>';
        t += '</header>';
        $('#toolbar').html(t);
	SWORD.mgr.getModInfoList(function(mods) {
		var j = 1;
		for (var i = 0; i < mods.length; ++i) {
			if (mods[i].category == SWORD.CATEGORY_DAILYDEVOS) {
				$('#devoName'+j).text(mods[i].name);
				++j;
				if (j > 4) break;
			}
		}
		if (callback) callback();
	});
    },
	getDevoKey: function(day) {
		var key = '';
		var v = day.getMonth() + 1;
		if (v < 10) key += '0';
		key += v;
		key += '.';
		v = day.getDate();
		if (v < 10) key += '0';
		key += v;
		return key;
	},

	showDailyDevo : function(devoName, target) {
		if (!target) target = '#client';
		setTimeout(function() {
		$(target).html('<div style="margin:1em;"><center><image src="img/loading.gif"/></center><br/><center><h3><span data-english="Please wait...">Please wait...</span></h3></center></div>');
		var whichDay = new Date();	// NOW for now.
		var devoKey = dailyDevo.getDevoKey(whichDay);
		app.setAppLocale(false, function() {
			SWORD.mgr.getModuleByName(devoName, function(mod) {
				if (!mod) {
					var t = '';
					t += '<br/>';
					t += '<div style="padding:.5em;"><center><span data-english="';
					t += 'Daily devotionals can be installed from the &quot;Library&quot; choice in the side menu.';
					t += '">';
					t += 'Daily devotionals can be installed from the &quot;Library&quot; choice in the side menu.';
					t += '</span></center></div>';
					t += '<br/>';
					t += '<div style="padding:.5em;"><center><span data-english="';
					t += 'Select a module source, .e.g., &quot;CrossWire&quot;, and then choose type &quot;Daily Devotionals&quot;.';
					t += '">';
					t += 'Select a module source, .e.g., &quot;CrossWire&quot;, and then choose type &quot;Daily Devotionals&quot;.';
					t += '</center></div>';
					$(target).html(t);
					$(target).scrollTop(0);
					return;
				}
				mod.setKeyText(devoKey, function() {
					mod.getRenderText(function(renderText) {
						var t = '';
						t += '<br/>';
						t += '<br/>';
						t += '<h1 style="padding-left:.5em;">';
						t += whichDay.toDateString();
						t += '</h1>';
						t += '<table class="clean" style="width:100%;"><tbody>';
						t += '<tr class="roweven" onclick="return false;">';
						t += '<td class="modName">'+ mod.name +'</td>';
						t += '<td class="modDesc" style="width:100%;">'+ mod.description +'</td>';
						t += '</tr>';
						t += '<tr>';
						t += '<td colspan="2" style="padding:.5em;" class="def">'+renderText+'</td>';
						t += '</tr>';
						t += '</tbody></table>';
						t += '<div style="height:30em;">&nbsp;</div>';
						$(target).html(t);
						$(target).scrollTop(0);
					});
				});
			});
					
		});
		}, 50);
	},
};
