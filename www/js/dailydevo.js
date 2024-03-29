var dailyDevo = {
	whichDay: new Date(),
	show: function() {
		dailyDevo.whichDay = new Date();
		var lastDevo = window.localStorage.getItem('lastDevo');
		app.currentWindow = dailyDevo;
		$('#main').html('<div id="toolbar"></div><div id="client"></div><div id="aux" class="dropdown-content"></div>');
		dailyDevo.setupMenu(function(buttonList) {
console.log('****** buttonList: ' + buttonList);
console.log('****** lastDevo: ' + lastDevo);
			if (buttonList && buttonList.length && lastDevo) {
				lastDevo = buttonList.indexOf(lastDevo);
				if (lastDevo === -1) lastDevo = 1;
			}
			else lastDevo = 1;
			$('#devoName'+lastDevo).parents('button').click();
			app.setAppLocale();
		});
	},
    
    
    setupMenu: function(callback) {

    var t  = '<header class="toolbar" id="versestudytoolbar">';
        t += '<button class="dropbtn dropclick left" onclick="app.handleBackButton(); return false;"> <div style="height:1.5em;font-size:170%;font-weight:bold;">&lt; </div><div> <span data-english="Back">Back</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveOne" onclick="$(this).focus(); dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName1">&nbsp;</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveTwo" onclick="$(this).focus(); dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName2">&nbsp;</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveThree" onclick="$(this).focus(); dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName3">&nbsp;</span></div></button>';
        t += '<button class="dropbtn dropclick twentyFiveFour" onclick="$(this).focus(); dailyDevo.showDailyDevo($(this).find(\'.devoName\').text()); return false;"><div><span>&nbsp;</span></div><div><span class="devoName" id="devoName4">&nbsp;</span></div></button>';
        t += '</header>';
        $('#toolbar').html(t);
	var retVal = ['Back'];
	SWORD.mgr.getModInfoList(function(mods) {
		var j = 1;
		for (var i = 0; i < mods.length; ++i) {
			if (mods[i].category == SWORD.CATEGORY_DAILYDEVOS) {
				$('#devoName'+j).text(mods[i].name);
				retVal.push(mods[i].name);
				++j;
				if (j > 4) break;
			}
		}
		if (callback) callback(retVal);
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
		var devoKey = dailyDevo.getDevoKey(dailyDevo.whichDay);
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
						t += '<ul class="booknav">';
						t += '<li><a href="javascript:void(0);" onclick="dailyDevo.whichDay.setDate(dailyDevo.whichDay.getDate()-1); dailyDevo.showDailyDevo(\''+devoName+'\'); return false;"><span data-english="previous day" style="white-space:nowrap">previous day</span></a></li>';
						t += '<li><a href="javascript:void(0);" onclick="dailyDevo.whichDay.setDate(dailyDevo.whichDay.getDate()+1); dailyDevo.showDailyDevo(\''+devoName+'\'); return false;"><span data-english="next day" style="white-space:nowrap">next day</span></a></li>';
						t += '</ul>';
						t += '<h1 style="padding-left:.5em;">';
						t += dailyDevo.whichDay.toDateString();
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
						t += '<ul class="booknav">';
						t += '<li><a href="javascript:void(0);" onclick="dailyDevo.whichDay.setDate(dailyDevo.whichDay.getDate()-1); dailyDevo.showDailyDevo(\''+devoName+'\'); return false;"><span data-english="previous day" style="white-space:nowrap">previous day</span></a></li>';
						t += '<li><a href="javascript:void(0);" onclick="dailyDevo.whichDay.setDate(dailyDevo.whichDay.getDate()+1); dailyDevo.showDailyDevo(\''+devoName+'\'); return false;"><span data-english="next day" style="white-space:nowrap">next day</span></a></li>';
						t += '</ul>';
						t += '<div style="height:30em;">&nbsp;</div>';
						$(target).html(t);
						$(target).scrollTop(0);
						window.localStorage.setItem('lastDevo', devoName);
					});
				});
			});
					
		});
		}, 50);
	},
};
