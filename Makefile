PLATFORM=ios

all: debug

rinstall: release uninstall install


run: run${PLATFORM}

runios:
	cordova emulate ios

runandroid:
	cordova emulate android


debug: refreshplugins copysourcefromplatform${PLATFORM} copydebug${PLATFORM} run

build:
	cordova build

copydebugandroid:
	cp platforms/android/build/outputs/apk/android-debug.apk bishop.apk || true

copydebugios:
	echo should copy ios debug app to root folder

release: refreshplugins copysourcefromplatform${PLATFORM} buildrelease copyrelease${PLATFORM}

buildrelease:
	find platforms/android/res/ -name screen.png -exec rm {} \;
	cordova build android --release

copyreleaseandroid:
	#try both unsigned and signed, old and new paths; prefer signed new path if available
	cp platforms/android/build/outputs/apk/android-release-unsigned.apk bishop.apk || true
	cp platforms/android/build/outputs/apk/android-release.apk bishop.apk || true
	cp platforms/android/build/outputs/apk/release/android-release.apk bishop.apk || true

copyreleaseios:
	echo should copy ios release to root folder

install: install${PLATFORM}

installandroid:
	adb install -r bishop.apk

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
	cp -a platforms/android/assets/www/index.html platforms/android/assets/www/img platforms/android/assets/www/css platforms/android/assets/www/js www/

copysourcefromplatformios:
	cp -a platforms/ios//build/emulator/Bishop.app/www/js www/

refreshplatform: refreshplatform${PLATFORM}

refreshplatformandroid:
	cordova platform remove android
	cordova platform add android

refreshplatformios:
	cordova platform remove ios
	cordova platform add ios

setup: clearplugins refreshplatform addplugins

addplugins:
	cordova plugin add cordova-custom-config
	cordova plugin add cordova-plugin-intent
	cordova plugin add cordova-plugin-add-swift-support
	patch -p0 < patches/cordova-plugin-intent.patch
	cordova plugin add ../sword/bindings/cordova/org.crosswire.sword.cordova.SWORD/ --nofetch -verbose

clearplugins:
	cordova plugin remove cordova-plugin-whitelist || true
	cordova plugin remove cordova-custom-config || true
	cordova plugin remove cordova-plugin-intent || true
	cordova plugin remove org.crosswire.sword.cordova.SWORD || true
	cordova plugin remove cordova-plugin-add-swift-support || true

back:
	cp platforms/ios/Bishop/Plugins/org.crosswire.sword.cordova.SWORD/SWORD.swift ../sword/bindings/cordova/org.crosswire.sword.cordova.SWORD/src/ios/SWORD.swift 
	cp platforms/ios/Bishop/Plugins/org.crosswire.sword.cordova.SWORD/flatapi.h ../sword/include/
