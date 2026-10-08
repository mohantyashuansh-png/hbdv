const { Jimp } = require('jimp');

(async () => {
  const image = await Jimp.read('C:\\Users\\Ashutosh\\.gemini\\antigravity-ide\\brain\\dd6e591c-ac2c-4ebd-80e4-0288c0abf6bd\\hand_holding_knife_1791145788882.png');
  
  // Make white pixels transparent
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Threshold for white
    if (r > 240 && g > 240 && b > 240) {
      this.bitmap.data[idx + 3] = 0; // alpha to 0
    }
  });

  await image.write('knife.png');
  console.log('Done!');
})();
