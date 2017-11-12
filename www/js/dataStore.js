var dataStore = {
	dbName : "bishop",
	db : null,
	init : function(callback) {

		window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
		if (window.indexedDB === undefined) return callback ? callback() : null;

		var req = window.indexedDB.open(dataStore.dbName, 2);
		req.onerror = function(event) {
		};
		req.onupgradeneeded = function(event) {
console.log("DB upgrade needed");
			var db = event.target.result;
			if (db.objectStoreNames.contains("bookmarks")) {
				db.deleteObjectStore("bookmarks");
			}
			var objectStore = db.createObjectStore("bookmarks", { keyPath: "_id", autoIncrement: true });
			objectStore.createIndex("osisID", "osisID", { unique: false });
		};
		req.onsuccess = function(event) {
console.log("DB opened");
			dataStore.db = event.target.result;
			if (callback) callback();
		};
	},
	addBookmark: function(osisID, callback) {
		if (window.indexedDB === undefined) return callback ? callback() : null;
		dataStore.deleteBookmark(osisID, function() {
			dataStore.saveBookmark(osisID, callback);
		});
	},
	deleteBookmark: function(osisID, callback) {
		if (window.indexedDB === undefined) return callback ? callback() : null;
		var transaction = dataStore.db.transaction(["bookmarks"],"readwrite");

		var store = transaction.objectStore("bookmarks");
		var index = store.index('osisID');
		var request = index.get(osisID);
		request.onsuccess = function(event) {
			var record = event.target.result;
			if (record) {
				var recordID = event.target.result._id;
console.log('recordID = ' + recordID);
				var transaction = dataStore.db.transaction(["bookmarks"],"readwrite");
				var objectStore = transaction.objectStore("bookmarks");
console.log('objectStore = ' + objectStore);
				var req = objectStore['delete'](recordID);
				req.onsuccess = req.onerror = function() {
					if (callback) callback();
				}
			}
			else if (callback) callback();
		}
		request.onerror = function(event) {
			if (callback) callback();
		}
	},
	deleteAllBookmarks: function(callback) {
		if (window.indexedDB === undefined) return callback ? callback() : null;
		var store = dataStore.db.transaction(["bookmarks"],"readwrite").objectStore("bookmarks");
		var request = store.clear();
		request.onsuccess = request.onerror = function(event) {
			if (callback) callback();
		}
	},
	saveBookmark: function(osisID, callback) {
		if (window.indexedDB === undefined) return callback ? callback() : null;
		var transaction = dataStore.db.transaction(["bookmarks"],"readwrite");
		transaction.oncomplete = function(event) {
console.log("db transaction success");
			if (callback) callback();
		};

		transaction.onerror = function(event) {
console.log("db tranaction error");
		};  
		var objectStore = transaction.objectStore("bookmarks");
		objectStore.add({ osisID : osisID});
	},
	getBookmarks : function(callback) {
		var results = [];
		if (window.indexedDB === undefined) return callback ? callback(results) : null;

		if (!dataStore.db) { if (callback) callback(results); return; }

		var store = dataStore.db.transaction(["bookmarks"],"readwrite").objectStore("bookmarks");
		var request = store.openCursor(null, 'prev');
		request.onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor) {
				results.push(cursor.value.osisID);
				cursor['continue']();
			} else if (callback) callback(results);
		};
	},
};
