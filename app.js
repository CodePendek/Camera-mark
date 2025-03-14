document.addEventListener('DOMContentLoaded', async () => {
  const uploadInput = document.getElementById('upload');
  const uploadLabel = document.getElementById('upload-label');
  const settingsModal = document.getElementById('settings');
  const previewModal = document.getElementById('previewModal');
  const settingsForm = document.getElementById('settingsForm');
  const previewImage = document.getElementById('previewImage');
  const simpanButton = document.getElementById('simpan');
  const tangkapUlangButton = document.getElementById('tangkapUlang');
  const shareButton = document.getElementById('share');
  const jamError = document.getElementById('jamError');
  const themeToggle = document.getElementById('theme-toggle');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  let canvas;

  // Daftar font yang digunakan
  const fonts = [
    'Roboto', 'Barlow', 'Geo', 'Iceland', 'Pixelify Sans',
    'Dancing Script', 'Oswald', 'Playfair Display', 'Pacifico', 'Bebas Neue'
  ];

  // Tunggu semua font benar-benar siap
  await Promise.all(fonts.map(font => document.fonts.load(`bold 16px ${font}`)));
  uploadLabel.classList.remove('opacity-50', 'pointer-events-none'); // Aktifkan UI setelah font siap

  // Fungsi untuk menampilkan toast
  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.remove('translate-y-10');
    toast.classList.add('translate-y-0');
    setTimeout(() => {
      toast.classList.remove('translate-y-0');
      toast.classList.add('translate-y-10');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
  }

  // Fungsi untuk memuat preferensi dari localStorage
  function loadPreferences() {
    const savedPosisi = localStorage.getItem('watermarkPosisi') || 'center';
    const savedJam = localStorage.getItem('watermarkJam') || 'Masuk/Pulang';
    const savedFont = localStorage.getItem('watermarkFont') || 'Barlow';
    const savedBulatkanWaktu = localStorage.getItem('watermarkBulatkanWaktu') === 'true';

    document.getElementById('posisi').value = savedPosisi;
    document.getElementById('jam').value = savedJam;
    document.getElementById('font').value = savedFont;
    document.getElementById('bulatkanWaktu').checked = savedBulatkanWaktu;
  }

  // Fungsi untuk menyimpan preferensi ke localStorage
  function savePreferences(posisi, jam, font, bulatkanWaktu) {
    localStorage.setItem('watermarkPosisi', posisi);
    localStorage.setItem('watermarkJam', jam);
    localStorage.setItem('watermarkFont', font);
    localStorage.setItem('watermarkBulatkanWaktu', bulatkanWaktu);
  }

  // Muat preferensi saat aplikasi dimulai
  loadPreferences();

  // Handle file upload
  uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      settingsModal.showModal();
    } else {
      showToast('File harus berupa gambar!', 'error');
    }
  });

  // Handle form submission
  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const file = uploadInput.files[0];
    const posisi = document.getElementById('posisi').value;
    const jam = document.getElementById('jam').value;
    const bulatkanWaktu = document.getElementById('bulatkanWaktu').checked;
    const font = document.getElementById('font').value;

    // Validasi waktu
    const jamSelect = document.getElementById('jam');
    const selectedOption = jamSelect.options[jamSelect.selectedIndex];
    if (selectedOption.disabled || jam === 'Masuk/Pulang') {
      jamError.classList.remove('hidden');
      return;
    } else {
      jamError.classList.add('hidden');
    }

    // Simpan preferensi
    savePreferences(posisi, jam, font, bulatkanWaktu);

    // Format waktu
    const waktuFormatted = formatWaktu(jam, bulatkanWaktu);

    // Proses watermark
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const watermarkText = `${new Date().toLocaleDateString('en-GB')} ${waktuFormatted}`;

        // Tambahkan watermark
        addWatermark(canvas, ctx, watermarkText, posisi, font);

        // Tampilkan preview
        previewImage.src = canvas.toDataURL();
        previewModal.showModal();
      };
    };
    reader.readAsDataURL(file);
  });

  // Fungsi untuk memformat waktu
  function formatWaktu(jam, bulatkanWaktu) {
    let [jamStr, menitStr] = jam.split(':');
    let jamNum = parseInt(jamStr, 10);
    let menitNum = parseInt(menitStr, 10);

    const randomMenit = Math.floor(Math.random() * 4);
    const tambahAtauKurang = Math.random() < 0.5 ? -1 : 1;
    menitNum += randomMenit * tambahAtauKurang;

    if (bulatkanWaktu) {
      menitNum = Math.round(menitNum / 5) * 5;
    }

    while (menitNum >= 60) {
      menitNum -= 60;
      jamNum += 1;
    }
    while (menitNum < 0) {
      menitNum += 60;
      jamNum -= 1;
    }

    jamNum = (jamNum + 24) % 24;

    return `${String(jamNum).padStart(2, '0')}:${String(menitNum).padStart(2, '0')}`;
  }

  // Fungsi untuk menambahkan watermark
  function addWatermark(canvas, ctx, text, posisi, font) {
    const fontSize = Math.floor(canvas.width * 0.03);
    const margin = Math.floor(canvas.width * 0.03);
    const opacity = 0.82;

    ctx.font = `bold ${fontSize}px ${font}`;
    let textWidth = ctx.measureText(text).width;
    while (textWidth > canvas.width * 0.8) {
      ctx.font = `bold ${--fontSize}px ${font}`;
      textWidth = ctx.measureText(text).width;
    }

    let x, y;
    switch (posisi) {
      case 'center':
        x = (canvas.width - textWidth) / 2;
        y = canvas.height / 2;
        break;
      case 'top-left':
        x = margin;
        y = margin + fontSize;
        break;
      case 'bottom-left':
        x = margin;
        y = canvas.height - margin;
        break;
      case 'top-right':
        x = canvas.width - textWidth - margin;
        y = margin + fontSize;
        break;
      case 'bottom-right':
        x = canvas.width - textWidth - margin;
        y = canvas.height - margin;
        break;
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillText(text, x, y);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Handle tombol Simpan
  simpanButton.addEventListener('click', () => {
    if (canvas) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const fileName = `watermark-${year}${month}${day}-${hours}${minutes}${seconds}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL();
      link.click();

      showToast('Gambar berhasil diunduh!', 'success');
    }
  });

  // Handle tombol Tangkap Ulang
  tangkapUlangButton.addEventListener('click', () => {
    settingsModal.close();
    previewModal.close();
    uploadInput.value = '';
  });

  // Handle tombol Share
  shareButton.addEventListener('click', async () => {
    if (canvas) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve));
      const file = new File([blob], 'watermarked-image.png', { type: 'image/png' });
      const filesArray = [file];

      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        try {
          await navigator.share({
            files: filesArray,
            title: 'Watermarked Image',
            text: 'Check out my watermarked image from CameraApp!',
          });
          showToast('Gambar berhasil dibagikan!', 'success');
        } catch (error) {
          showToast('Gagal membagikan gambar.', 'error');
        }
      } else {
        showToast('Fitur share tidak didukung di perangkat ini.', 'error');
      }
    }
  });

  // Handle toggle dark mode
  themeToggle.addEventListener('change', (event) => {
    const isDarkMode = event.target.checked;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    feather.replace();
  });

  // Set initial theme
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  themeToggle.checked = initialTheme === 'dark';
  feather.replace();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => console.log('Service Worker registered: ', registration))
      .catch((error) => console.log('Service Worker registration failed: ', error));
  });
}