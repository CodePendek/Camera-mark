document.addEventListener('DOMContentLoaded', () => {
  const uploadInput = document.getElementById('upload');
  const settingsModal = document.getElementById('settings');
  const previewModal = document.getElementById('previewModal');
  const settingsForm = document.getElementById('settingsForm');
  const previewImage = document.getElementById('previewImage');
  const simpanButton = document.getElementById('simpan');
  const tangkapUlangButton = document.getElementById('tangkapUlang');
  const jamError = document.getElementById('jamError');
  const themeToggle = document.getElementById('theme-toggle');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  let canvas; // Simpan canvas di scope global untuk diakses oleh fungsi simpan

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

  // Handle file upload
  uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      settingsModal.showModal(); // Tampilkan modal settings
    } else {
      showToast('File harus berupa gambar!', 'error'); // Tampilkan toast warning
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
    if (selectedOption.disabled || jam === "Masuk/pulang") {
      jamError.classList.remove('hidden'); // Tampilkan pesan error
      return; // Hentikan proses
    } else {
      jamError.classList.add('hidden'); // Sembunyikan pesan error
    }

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

    if (bulatkanWaktu) {
      // Bulatkan menit ke kelipatan 5 terdekat
      menitNum = Math.round(menitNum / 5) * 5;
      if (menitNum === 60) {
        menitNum = 0;
        jamNum += 1;
      }
    } else {
      // Kurangi secara acak antara 0, 1, atau 2 menit
      const randomMenit = Math.floor(Math.random() * 3); // Angka acak antara 0, 1, atau 2
      menitNum -= randomMenit;

      // Handle jika menit menjadi negatif
      if (menitNum < 0) {
        menitNum += 60;
        jamNum -= 1;
      }
    }

    // Format ulang jam dan menit ke dalam string
    return `${String(jamNum).padStart(2, '0')}:${String(menitNum).padStart(2, '0')}`;
  }

  // Fungsi untuk menambahkan watermark
  function addWatermark(canvas, ctx, text, posisi, font) {
    const fontSize = Math.floor(canvas.width * 0.03); // 5% dari lebar gambar
    const margin = Math.floor(canvas.width * 0.03);  // 3% dari lebar gambar
    const opacity = 0.82; // Opacity watermark

    // Atur font menjadi tebal dan dinamis
    ctx.font = `bold ${fontSize}px ${font}`;

    // Periksa apakah teks terlalu lebar
    let textWidth = ctx.measureText(text).width;
    while (textWidth > canvas.width * 0.8) { // Jika teks lebih dari 80% lebar gambar, kecilkan ukuran font
      ctx.font = `bold ${--fontSize}px ${font}`;
      textWidth = ctx.measureText(text).width;
    }

    // Hitung posisi watermark
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

    // Tambahkan drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Warna shadow
    ctx.shadowBlur = 5; // Blur radius
    ctx.shadowOffsetX = 2; // Offset horizontal
    ctx.shadowOffsetY = 2; // Offset vertikal

    // Tambahkan teks dengan opacity
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillText(text, x, y);

    // Reset shadow setelah menggambar teks
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Handle tombol Simpan
  simpanButton.addEventListener('click', () => {
    if (canvas) {
      // Dapatkan waktu saat ini
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      // Format nama file: watermark-YYYYMMDD-HHMMSS.png
      const fileName = `watermark-${year}${month}${day}-${hours}${minutes}${seconds}.png`;

      // Buat link untuk mengunduh gambar
      const link = document.createElement('a');
      link.download = fileName; // Nama file
      link.href = canvas.toDataURL(); // Data URL gambar
      link.click(); // Trigger unduh

      // Tampilkan toast notifikasi
      showToast('Gambar berhasil diunduh!', 'success');
    }
  });

  // Handle tombol Tangkap Ulang
  tangkapUlangButton.addEventListener('click', () => {
    // Tutup semua modal
    settingsModal.close();
    previewModal.close();
    // Reset input file
    uploadInput.value = '';
  });

  // Handle toggle dark mode
  themeToggle.addEventListener('change', (event) => {
    const isDarkMode = event.target.checked;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });

  // Set initial theme based on localStorage or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  themeToggle.checked = initialTheme === 'dark';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered: ', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}