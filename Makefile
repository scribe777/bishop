PLATFORM=ios
#PLATFORM=android

all: release

rinstall: release uninstall install


run: run${PLATFORM}

runios:
	cordova emulate ios

runandroid:
	cordova emulate android


debug: refreshplugins copysourcefromplatform${PLATFORM} copydebug${PLATFORM} run
release: refreshplugins copysourcefromplatform${PLATFORM} buildrelease${PLATFORM} copyrelease${PLATFORM}

build:
	cordova build

buildreleaseandroid:
	find platforms/android/res/ -name screen.png -exec rm {} \;
	cordova build android --release

buildreleaseios:
	cordova build --device --release ios

copydebugandroid:
	cp platforms/android/build/outputs/apk/android-debug.apk bishop.apk || true

copydebugios:
	echo should copy ios debug app to root folder


copyreleaseandroid:
	#try both unsigned and signed, old and new paths; prefer signed new path if available
	cp platforms/android/build/outputs/apk/android-release-unsigned.apk bishop.apk || true
	cp platforms/android/build/outputs/apk/android-release.apk bishop.apk || true
	cp platforms/android/build/outputs/apk/release/android-release.apk bishop.apk || true

copyreleaseios:
	echo should copy ios release to root folder

install: install${PLATFORM}

deploy: deploy${PLATFORM}


installandroid:
	adb install -r bishop.apk

deployandroid:
	scp bishop.apk scribe@crosswire.org:/home/crosswire/html/

installios:
	echo install app to iphone

uninstall: uinstall${PLATFORM}

uninstallandroid:
	adb uninstall org.crosswire.bishop

uninstallios:
	echo uninstall app from iphone

refreshplugins:
	cordova plugin remove org.crosswire.sword.cordova.SWORD || true
	cordova plugin add ../sword/bindings/cordova/org.crosswire.sword.cordova.SWORD/ --nofetch -verbose

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

setup: clearplugins refreshplatform addplugins

###
# Plugins should not be committed to config.xml
# make setup adds them in the right order after platform
#
addplugins:
	cordova plugin add cordova-custom-config || true
	cordova plugin add cordova-plugin-intent || true
	cordova plugin add com.napolitano.cordova.plugin.intent || true
	cordova plugin add cordova-plugin-add-swift-support || true
	cordova plugin add ../sword/bindings/cordova/org.crosswire.sword.cordova.SWORD/ --nofetch -verbose || true
	cordova plugin add https://github.com/phonegap/phonegap-mobile-accessibility.git || true
	cordova plugin add es.keensoft.fullscreenimage || true
	cordova plugin add cordova-plugin-x-toast || true
	patch -p0 < patches/cordova-plugin-intent.patch

clearplugins:
	cordova plugin remove cordova-plugin-whitelist || true
	cordova plugin remove cordova-custom-config || true
	cordova plugin remove cordova-plugin-intent || true
	cordova plugin remove com.napolitano.cordova.plugin.intent || true
	cordova plugin remove org.crosswire.sword.cordova.SWORD || true
	cordova plugin remove cordova-plugin-add-swift-support || true
	cordova plugin remove phonegap-plugin-mobile-accessibility || true
	cordova plugin remove es.keensoft.fullscreenimage || true
	cordova plugin remove cordova-plugin-x-toast || true

#copy any changes made to plugin via xcode
back:
	cp platforms/ios/Bishop/Plugins/org.crosswire.sword.cordova.SWORD/SWORD.swift ../sword/bindings/cordova/org.crosswire.sword.cordova.SWORD/src/ios/SWORD.swift 
	cp platforms/ios/Bishop/Plugins/org.crosswire.sword.cordova.SWORD/flatapi.h ../sword/include/
