var imageTools = {

getImageData : function(src, callback) {
	var shrink = 1;
console.log('loading image data; shrink: ' + shrink);
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
		var canvas = document.getElementById('msgCanvas');
		if (!canvas) {
			canvas = document.createElement('canvas');
			canvas.id = 'msgCanvas';
			canvas.style.display = 'none';	
			document.getElementsByTagName('body')[0].appendChild(canvas);
			canvas = document.getElementById('msgCanvas');
		}
		var ctx = canvas.getContext('2d');
		var imageData = '';
		while (shrink > .2) {
			try {
				canvas.height = shrink * this.naturalHeight;
				canvas.width  = shrink * this.naturalWidth;
				ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
				imageData = canvas.toDataURL();

				// if we had trouble, probably canvas size is too big. shrink and try again
				if (imageData == 'data:,') shrink = shrink *.8;
				else break;
			}
			catch (e) {
				shrink = shrink *.8;
			}
		}

console.log('getImageData returning image data +22...' + (imageData && imageData.length > 30 ? imageData.substring(0,30) : imageData));
		return callback(imageData.substring(22));
        };
        img.src = src;
        return;
}
};
