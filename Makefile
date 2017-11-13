all: release

rinstall: release uninstall install

debug: refreshplugins copyfromplatform
	cordova build
	cp platforms/android/build/outputs/apk/android-debug.apk bishop.apk

release: refreshplugins copyfromplatform
	find platforms/android/res/ -name screen.png -exec rm {} \;
	cordova build android --release
	#try both unsigned and signed, old and new paths; prefer signed new path if available
	cp platforms/android/build/outputs/apk/android-release-unsigned.apk bishop.apk || true
	cp platforms/android/build/outputs/apk/android-release.apk bishop.apk || true
	cp platforms/android/build/outputs/apk/release/android-release.apk bishop.apk || true

install: 
	adb install -r bishop.apk

uninstall:
	adb uninstall org.crosswire.bishop

refreshplugins:
	cordova plugin remove org.crosswire.sword.cordova.SWORD || true
	cordova plugin add ../sword/bindings/cordova/org.crosswire.sword.cordova.SWORD/ --nofetch -verbose

copyfromplatform:
	cp -a platforms/android/assets/www/index.html platforms/android/assets/www/img platforms/android/assets/www/css platforms/android/assets/www/js www/

refreshplatforms:
	cordova platform remove ios
	cordova platform remove android
	cordova platform add android
	cordova platform add ios

setup:
	cordova plugin add cordova-custom-config
	cordova plugin add cordova-plugin-intent
	patch -p0 < patches/cordova-plugin-intent.patch
