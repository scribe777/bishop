all: release

rinstall: release uninstall install

debug: refreshplugins copyfromplatform
	cordova build
	cp platforms/android/build/outputs/apk/android-debug.apk bishop.apk

release: refreshplugins copyfromplatform
	find platforms/android/res/ -name screen.png -exec rm {} \;
	cordova build --release
	cp platforms/android/build/outputs/apk/release/android-release.apk bishop.apk

install: 
	adb install -r bishop.apk

uninstall:
	adb uninstall org.crosswire.bishop

refreshplugins:
	cordova plugin remove org.crosswire.sword.cordova.SWORD || true
	cordova plugin add ../sword/bindings/cordova/org.crosswire.sword.cordova.SWORD/ --nofetch -verbose

copyfromplatform:
	cp -a platforms/android/assets/www/index.html platforms/android/assets/www/img platforms/android/assets/www/css platforms/android/assets/www/js www/

setup:
	cordova plugin add cordova-custom-config
	cordova plugin add cordova-plugin-intent
