const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const shutter = document.getElementById('shutter');
const swap = document.getElementById('swap');
const settings = document.getElementById('settings');
const upload = document.getElementById('upload');
const modal = document.getElementById('modal');
const preview = document.getElementById('preview');
const download = document.getElementById('download');
const retake = document.getElementById('retake');
const settingsModal = document.getElementById('settings-modal');
const uploadModal = document.getElementById('upload-modal');
const timeSelect = document.getElementById('time');
const watermarkSelect = document.getElementById('watermark');
const roundTimeCheckbox = document.getElementById('round-time');
const okButton = document.getElementById('ok');
const exitSettingsButton = document.getElementById('exit-settings');
const helpButton = document.getElementById('help');
const modeButton = document.getElementById('mode');
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");
const fileInput = document.getElementById('file');
const uploadOkButton = document.querySelector('#upload-modal #ok');
const uploadExitButton = document.querySelector('#upload-modal #exit-settings');

let currentStream = null;
let useFrontCamera = true;
let watermarkText = '';
let watermarkPosition = 'center';
let watermarkRotation = 0;
let isDarkMode = false;

// Fungsi untuk toggle dark mode
function toggleDarkMode() {
  const htmlElement = document.documentElement;
  htmlElement.classList.toggle('dark');

  // Update icon
  const icon = modeButton.querySelector('i');
  const currentMode = htmlElement.classList.contains('dark');

  if (currentMode) {
    icon.setAttribute('data-feather', 'sun');
  } else {
    icon.setAttribute('data-feather', 'moon');
  }

  // Refresh Feather Icons
  feather.replace();

  // Simpan preferensi mode ke localStorage
  localStorage.setItem('darkMode', currentMode);
}

// Fungsi untuk menginisialisasi dark mode
function initDarkMode() {
  const htmlElement = document.documentElement;
  const savedMode = localStorage.getItem('darkMode');

  // Cek apakah ada mode yang tersimpan
  if (savedMode === 'true') {
    htmlElement.classList.add('dark');
  } else if (savedMode === 'false') {
    htmlElement.classList.remove('dark');
  } else {
    // Default menggunakan preferensi sistem
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      htmlElement.classList.add('dark');
    }
  }

  // Update icon sesuai mode
  const icon = modeButton.querySelector('i');
  const currentMode = htmlElement.classList.contains('dark');

  icon.setAttribute('data-feather', currentMode ? 'sun' : 'moon');
  feather.replace();
}

// Event listener untuk toggle dark mode
modeButton.addEventListener("click", toggleDarkMode);

// Inisialisasi dark mode saat halaman dimuat
document.addEventListener('DOMContentLoaded', initDarkMode);

// Fungsi untuk mendapatkan waktu saat ini dalam format HH:mm
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Fungsi untuk mendapatkan tanggal saat ini dalam format DD/MM/YYYY
function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

// Fungsi untuk mendapatkan watermark default
function getDefaultWatermark() {
  return `${getCurrentDate()} ${getCurrentTime()}`;
}

// Fungsi untuk memulai kamera
async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: useFrontCamera ? 'user' : 'environment',
        width: { ideal: 1600 },
        height: { ideal: 1200 },
      },
    });

    video.srcObject = currentStream;
    video.style.transform = useFrontCamera ? 'scaleX(-1)' : 'scaleX(1)';
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Tidak dapat mengakses kamera. Periksa izin browser.');
  }
}

// Fungsi untuk menghitung ukuran font berdasarkan lebar gambar
function calculateFontSize(imageWidth) {
  return Math.round(imageWidth * 0.031); // 5% dari lebar gambar
}

// Fungsi untuk menggambar watermark
function drawWatermark(context, imageWidth, imageHeight, watermarkText, watermarkPosition) {
  const fontSize = calculateFontSize(imageWidth);
  context.font = `${fontSize}px "Inter", sans-serif`;

  // Hitung dimensi teks watermark
  const textMetrics = context.measureText(watermarkText);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // Tentukan posisi watermark
  let x, y;
  const padding = imageWidth * 0.032; // 5% dari lebar gambar

  switch (watermarkPosition) {
    case 'kiri_atas':
      x = padding;
      y = padding + (textHeight / 2);
      break;
    case 'kanan_atas':
      x = imageWidth - padding;
      y = padding + (textHeight / 2);
      break;
    case 'kiri_bawah':
      x = padding;
      y = imageHeight - padding;
      break;
    case 'kanan_bawah':
      x = imageWidth - padding;
      y = imageHeight - padding;
      break;
    default: // center
      x = imageWidth / 2;
      y = imageHeight / 2;
  }

  // Simpan state context
  context.save();

  // Translate ke posisi watermark
  context.translate(x, y);

  // Alignment berdasarkan posisi
  let textX = -textWidth / 2; // Default center alignment
  let textY = 0;

  switch (watermarkPosition) {
    case 'kiri_atas':
    case 'kiri_bawah':
      textX = 0;
      break;
    case 'kanan_atas':
    case 'kanan_bawah':
      textX = -textWidth;
      break;
  }

  // Gambar watermark
  context.fillText(watermarkText, textX, textY);

  // Restore context state
  context.restore();
}

function captureImage() {
  if (!watermarkText) {
    watermarkText = getDefaultWatermark();
    watermarkPosition = 'center';
  }

  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Gambar video ke canvas dengan mempertimbangkan kamera depan
  if (useFrontCamera) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }

  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  // Reset transformasi setelah menggambar video
  context.setTransform(1, 0, 0, 1, 0, 0);

  // Setup style untuk watermark
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.shadowColor = 'rgba(0, 0, 0, 0.8)';
  context.shadowBlur = 4;
  context.lineWidth = 2;

  // Gambar watermark dengan ukuran font dinamis
  drawWatermark(context, video.videoWidth, video.videoHeight, watermarkText, watermarkPosition);

  const imageData = canvas.toDataURL('image/png');
  preview.src = imageData;
  modal.classList.remove('hidden');
}

// Fungsi untuk mengunduh gambar
function downloadImage() {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `photo_${Date.now()}.jpg`;
  link.click();
  modal.classList.add('hidden');
}

// Fungsi untuk mengambil ulang foto
function retakeImage() {
  modal.classList.add('hidden');
}

// Fungsi untuk mengubah kamera
function swapCamera() {
  useFrontCamera = !useFrontCamera;
  startCamera();
}

// Fungsi untuk memodifikasi waktu jika "bulatkan waktu" tidak dicentang
function adjustTimeRandomly(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const randomChange = Math.floor(Math.random() * 3) + 1;
  const isAdd = Math.random() > 0.5;

  let newMinutes = isAdd ? minutes + randomChange : minutes - randomChange;
  let newHours = hours;

  if (newMinutes >= 60) {
    newMinutes -= 60;
    newHours += 1;
  } else if (newMinutes < 0) {
    newMinutes += 60;
    newHours -= 1;
  }

  if (newHours >= 24) newHours = 0;
  else if (newHours < 0) newHours = 23;

  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Fungsi untuk mengatur watermark
function setWatermark() {
  let selectedTime = timeSelect.value;

  if (!roundTimeCheckbox.checked) {
    selectedTime = adjustTimeRandomly(selectedTime);
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  watermarkText = `${day}/${month}/${year} ${selectedTime}`;
  watermarkPosition = watermarkSelect.value;
}

// Event Listeners
shutter.addEventListener('click', captureImage);
download.addEventListener('click', downloadImage);
retake.addEventListener('click', retakeImage);
swap.addEventListener('click', swapCamera);

settings.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

upload.addEventListener('click', () => {
  uploadModal.classList.remove('hidden');
});

okButton.addEventListener('click', () => {
  setWatermark();
  settingsModal.classList.add('hidden');
});

exitSettingsButton.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

helpButton.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

document.getElementById('closeHelp').addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

// Fungsi untuk menangani upload foto
function handleFileUpload() {
  const file = fileInput.files[0];
  if (!file) {
    alert('Pilih foto terlebih dahulu');
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('File yang diunggah harus berupa gambar');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      // Bersihkan canvas
      const context = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      // Gambar foto yang diunggah
      context.drawImage(img, 0, 0);

      // Ambil waktu dan posisi watermark dari pilihan
      let selectedTime = document.querySelector('#upload-modal #time').value;
      const watermarkPosition = document.querySelector('#upload-modal #watermark').value;
      const roundTimeChecked = document.querySelector('#upload-modal #round-time').checked;

      if (!roundTimeChecked) {
        selectedTime = adjustTimeRandomly(selectedTime);
      }

      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();

      const watermarkText = `${day}/${month}/${year} ${selectedTime}`;

      // Setup style untuk watermark
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.shadowColor = 'rgba(0, 0, 0, 0.8)';
      context.shadowBlur = 4;
      context.lineWidth = 2;

      // Gambar watermark dengan ukuran font dinamis
      drawWatermark(context, img.width, img.height, watermarkText, watermarkPosition);

      // Tampilkan preview
      const imageData = canvas.toDataURL('image/png');
      preview.src = imageData;
      modal.classList.remove('hidden');
      uploadModal.classList.add('hidden');
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

// Event listener untuk upload
uploadOkButton.addEventListener('click', handleFileUpload);

// Event listener untuk menutup modal upload
uploadExitButton.addEventListener('click', () => {
  uploadModal.classList.add('hidden');
  fileInput.value = ''; // Reset file input
});

// Reset file input jika modal ditutup
uploadModal.addEventListener('click', (event) => {
  if (event.target === uploadModal) {
    uploadModal.classList.add('hidden');
    fileInput.value = ''; // Reset file input
  }
});

// Memulai kamera saat halaman dimuat
startCamera();