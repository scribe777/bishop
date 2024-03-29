#PLATFORM=ios
PLATFORM=android
APP_VERSION=$(shell grep 'change version here' www/js/bishop.js |cut -f2 -d\')

all: release

rinstall: release uninstall install


run: run${PLATFORM}

runios:
	cordova emulate ios

runandroid:
	cordova emulate android


debug: refreshplugins copysourcefromplatform${PLATFORM} builddebug${PLATFORM} copydebug${PLATFORM}
release: refreshplugins copysourcefromplatform${PLATFORM} buildrelease${PLATFORM} copyrelease${PLATFORM}

build:
	cordova build

buildreleaseandroid:
	find platforms/android/ -name screen.png -exec rm {} \;
	cordova build android --release

buildreleaseios:
	cordova build --device --release ios

builddebugandroid:
	find platforms/android/ -name screen.png -exec rm {} \;
	cordova build android --debug

builddebugios:
	cordova build --device --debug ios

copydebugandroid:
	cp platforms/android/app/build/outputs/apk/debug/app-debug.apk bishop.apk || true

copydebugios:
	echo should copy ios debug app to root folder


copyreleaseandroid:
	#try both unsigned and signed, old and new paths; prefer signed new path if available
	cp platforms/android/app/build/outputs/apk/release/app-release.apk bishop.apk || true

copyreleaseios:
	echo should copy ios release to root folder

install: install${PLATFORM}

deploy: deploy${PLATFORM}


installandroid:
	adb install -r bishop.apk

deployandroid:
	scp bishop.apk scribe@crosswire.org:/home/crosswire/html/
	scp bishop.apk scribe@crosswire.org:public_html/bishop-${APP_VERSION}.apk
	@echo "http://crosswire.org/~scribe/bishop-${APP_VERSION}.apk"
	@echo "bishop-${APP_VERSION}.apk size: $(shell ls -l bishop.apk|cut -d' ' -f5) md5: $(shell md5sum bishop.apk|cut -f1 -d' ')"

deployios:
	scp "$(shell ls -td ~/Desktop/Bishop*|head -1)"/Bishop.ipa crosswire.org:/home/crosswire/html/
	scp "$(shell ls -td ~/Desktop/Bishop*|head -1)"/manifest.plist crosswire.org:/home/crosswire/html/bishop/

uninstall: uninstall${PLATFORM}

uninstallandroid:
	adb uninstall org.crosswire.bishop

uninstallios:
	echo uninstall app from iphone

refreshplugins:
####	Only do this if we are working on local plugin regularly
#	cordova plugin remove cordova-plugin-crosswire-sword || true
#	cordova plugin add ../sword/bindings/cordova/cordova-plugin-crosswire-sword/ --nofetch -verbose
# To easily switch back to published plugin without a full setup
#	cordova plugin add cordova-plugin-crosswire-sword || true

copysourcefromplatformandroid:
	echo "do nothing for now"; #cp -a platforms/android/assets/www/index.html platforms/android/assets/www/img platforms/android/assets/www/css platforms/android/assets/www/js www/ || true

copysourcefromplatformios:
	echo nothing to do because xcode somehow edits files at top level www/

refreshplatform: removeplatforms refreshplatform${PLATFORM}

removeplatforms:
	cordova platform remove android || true
	cordova platform remove ios || true

refreshplatformandroid:
	cordova platform remove android || true
	cordova platform add android || true

refreshplatformios:
	cordova platform remove ios || true
	cordova platform add ios || true
#	cordova-icon --icon=res/swordlogo-1024.png
#	cordova-splash --splash=res/swordlogo-1024.png

setup: clearplugins refreshplatform addplugins updatelocales
	# one last refresh platform to get the plugin patches deployed
	make refreshplatform

###
# Plugins should not be committed to config.xml
# make setup adds them in the right order after platform
#
addplugins:
	cordova plugin add cordova-plugin-inappbrowser || true
	cordova plugin add cordova-plugin-file || true
	cordova plugin add cordova-plugin-globalization || true
	cordova plugin add cordova-custom-config || true
	cordova plugin add cordova-plugin-whitelist || true
	cordova plugin add com-darryncampbell-cordova-plugin-intent || true
	cordova plugin add cordova-plugin-add-swift-support || true
####	Local dev SWORD plugin or published version of SWORD plugin
#	cordova plugin add ../sword/bindings/cordova/cordova-plugin-crosswire-sword/ --nofetch -verbose || true
	cordova plugin add cordova-plugin-crosswire-sword || true
	cordova plugin add cordova-plugin-splashscreen || true
	cordova plugin add https://github.com/phonegap/phonegap-mobile-accessibility.git || true
####	Trying photoviewer instead of fullscreenimage, which stopped working on newer Android
#	cordova plugin add es.keensoft.fullscreenimage || true
	cordova plugin add com-sarriaroman-photoviewer || true
	cordova plugin add cordova-plugin-x-toast || true
#	patch -p0 < patches/cordova-plugin-intent.patch

clearplugins:
	cordova plugin remove cordova-plugin-inappbrowser || true
	cordova plugin remove cordova-plugin-file || true
	cordova plugin remove cordova-plugin-globalization || true
	cordova plugin remove cordova-plugin-whitelist || true
	cordova plugin remove cordova-custom-config || true
	cordova plugin remove com-darryncampbell-cordova-plugin-intent || true
	cordova plugin remove cordova-plugin-crosswire-sword || true
	cordova plugin remove cordova-plugin-splashscreen || true
	cordova plugin remove cordova-plugin-add-swift-support || true
	cordova plugin remove phonegap-plugin-mobile-accessibility || true
#	cordova plugin remove es.keensoft.fullscreenimage || true
	cordova plugin remove com-sarriaroman-photoviewer || true
	cordova plugin remove cordova-plugin-x-toast || true

updatelocales:
	rm -rf www/bundledResources/locales.d
	mkdir -p www/bundledResources/locales.d
	cd www/bundledResources/uilocales.d/; for i in $$(ls); do cp -f ../../../../sword/locales.d/$$i ../locales.d/; done || true
	cp ../sword/locales.d/locales.conf www/bundledResources/locales.d/

#copy any changes made to plugin via xcode
back:
	cp platforms/ios/Bishop/Plugins/cordova-plugin-crosswire-sword/SWORD.swift ../sword/bindings/cordova/cordova-plugin-crosswire-sword/src/ios/SWORD.swift 
	cp platforms/ios/Bishop/Plugins/cordova-plugin-crosswire-sword/flatapi.h ../sword/include/

clean:
	rm -rf node_modules package.json package-lock.json platforms plugins
