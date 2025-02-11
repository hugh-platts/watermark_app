document.addEventListener('DOMContentLoaded', function () {
  const imageInput = document.getElementById('image-input');
  const preview = document.getElementById('preview');
  const downloadBtn = document.getElementById('download-btn');
  const qrCheckbox = document.getElementById('qr-checkbox');
  const blackWatermarkCheckbox = document.getElementById('black-watermark-checkbox');

  let watermarkedBlob = null;

  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let imageBlob = file.type.startsWith('image/heic') ? 
        await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 }) : 
        file;

      const dataURL = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(imageBlob);
      });

      const img = await loadImageWithOrientation(dataURL);
      const canvas = await createWatermarkedCanvas(img);
      
      if (qrCheckbox.checked) {
        await addQRCode(canvas);
      }

      finishCanvas(canvas);
    } catch (error) {
      console.error('Processing error:', error);
      alert('Error processing image. Please try again.');
    }
  });

  async function loadImageWithOrientation(dataURL) {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = dataURL;
    });

    let orientation = 1;
    try {
      await EXIF.getData(img);
      orientation = EXIF.getTag(img, 'Orientation') || 1;
    } catch (e) {
      console.warn('EXIF read error:', e);
    }

    if (orientation === 1) return img;
    return rotateImage(img, orientation);
  }

  function rotateImage(img, orientation) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (orientation >= 5 && orientation <= 8) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    switch (orientation) {
      case 2: ctx.transform(-1, 0, 0, 1, img.width, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, img.width, img.height); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, img.height); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, img.height, 0); break;
      case 7: ctx.transform(0, -1, -1, 0, img.height, img.width); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, img.width); break;
      default: break;
    }

    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  async function createWatermarkedCanvas(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const fontSize = Math.floor(canvas.width * 0.04);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = blackWatermarkCheckbox.checked ? 
      'rgba(0, 0, 0, 0.7)' : 
      'rgba(255, 255, 255, 0.7)';
    ctx.fillText('RIDDITHOMES.COM', canvas.width - 10, canvas.height - 10);

    return canvas;
  }

  async function addQRCode(canvas) {
    const qrSize = Math.floor(canvas.width * 0.1);
    try {
      const qrDataURL = await QRCode.toDataURL('https://riddithomes.com', {
        width: qrSize,
        margin: 0
      });
      
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.src = qrDataURL;
      });

      const ctx = canvas.getContext('2d');
      ctx.drawImage(qrImg, 10, canvas.height - qrImg.height - 10);
    } catch (error) {
      console.error('QR code error:', error);
      throw error;
    }
  }

  function finishCanvas(canvas) {
    canvas.toBlob((blob) => {
      if (watermarkedBlob) URL.revokeObjectURL(watermarkedBlob);
      watermarkedBlob = blob;
      preview.src = URL.createObjectURL(blob);
      preview.style.display = 'block';
      downloadBtn.disabled = false;
    }, 'image/jpeg', 0.9);
  }

  downloadBtn.addEventListener('click', () => {
    if (!watermarkedBlob) return;
    saveAs(watermarkedBlob, 'riddithomes_watermarked.jpg');
  });
});
