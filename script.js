document.addEventListener('DOMContentLoaded', function () {
  const imageInput = document.getElementById('image-input');
  const preview = document.getElementById('preview');
  const downloadBtn = document.getElementById('download-btn');
  const qrCheckbox = document.getElementById('qr-checkbox');
  const blackWatermarkCheckbox = document.getElementById('black-watermark-checkbox');

  let watermarkedImageURL = null;

  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      // Reset if no file selected
      preview.src = '';
      preview.style.display = 'none';
      downloadBtn.disabled = true;
      return;
    }

    // Validate file type
    const validTypes = ['image/heic', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (HEIC, JPEG, JPG, or PNG).');
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = async function (event) {
      const dataURL = event.target.result;

      // Create a hidden Image object to draw on canvas
      const img = new Image();
      img.onload = async function () {
        // Create a canvas matching the image's dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Watermark text
        const fontSize = Math.floor(canvas.width * 0.04); // e.g., 4% of width
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        // Choose color based on checkbox
        if (blackWatermarkCheckbox.checked) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // semi-transparent black
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // semi-transparent white
        }

        // Draw text near the bottom-right corner
        ctx.fillText('RIDDITHOMES.COM', canvas.width - 10, canvas.height - 10);

        // Optional QR code
        if (qrCheckbox.checked) {
          const qrSize = Math.floor(canvas.width * 0.1);
          let qrCodeDataURL;

          try {
            // Generate QR code data URL pointing to riddithomes.com
            qrCodeDataURL = await QRCode.toDataURL('https://riddithomes.com', {
              width: qrSize,
              margin: 0,
            });
          } catch (qrErr) {
            console.error('QR Code Generation Error:', qrErr);
            alert('Error generating QR code. Check console for more details.');
            return;
          }

          const qrImg = new Image();
          qrImg.onload = function () {
            // Place the QR at bottom-left corner with a margin
            const margin = 10;
            ctx.drawImage(qrImg, margin, canvas.height - qrImg.height - margin);
            finishCanvas(canvas);
          };
          qrImg.src = qrCodeDataURL;
        } else {
          // No QR, finalize
          finishCanvas(canvas);
        }
      };

      // Start image load
      img.src = dataURL;
    };
    reader.readAsDataURL(file);
  });

  function finishCanvas(canvas) {
    watermarkedImageURL = canvas.toDataURL('image/png');
    preview.src = watermarkedImageURL;
    preview.style.display = 'block';
    downloadBtn.disabled = false;
  }

  // Download button logic
  downloadBtn.addEventListener('click', () => {
    if (!watermarkedImageURL) return;
    const link = document.createElement('a');
    link.href = watermarkedImageURL;
    link.download = 'watermarked_RIDDITHOMES.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});
