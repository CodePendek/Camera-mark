const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const shutter = document.getElementById('shutter');
const swap = document.getElementById('swap');
const settings = document.getElementById('settings');
const modal = document.getElementById('modal');
const preview = document.getElementById('preview');
const download = document.getElementById('download');
const retake = document.getElementById('retake');
const settingsModal = document.getElementById('settings-modal');
const timeSelect = document.getElementById('time');
const watermarkSelect = document.getElementById('watermark');
const roundTimeCheckbox = document.getElementById('round-time');
const okButton = document.getElementById('ok');
const exitSettingsButton = document.getElementById('exit-settings');
const rotateButton = document.getElementById('rotate');
const helpButton = document.getElementById('help');
const modeButton = document.getElementById('mode');

let currentStream = null;
let useFrontCamera = true;
let watermarkText = '';
let watermarkPosition = 'center';
let watermarkRotation = 0;
let isDarkMode = false;

// Membuat modal help
const helpModal = document.createElement('div');
helpModal.className = 'fixed z-20 inset-0 bg-black bg-opacity-75 flex items-center justify-center hidden';
helpModal.innerHTML = `
  <div class="bg-white text-gray-900 rounded-lg p-6 w-4/5 max-w-md shadow-lg">
    <h2 class="text-lg font-bold mb-4">Bantuan Penggunaan</h2>
    <ul class="space-y-2 mb-4">
      <li>📸 Tekan tombol bulat di tengah untuk mengambil foto</li>
      <li>🔄 Gunakan tombol rotate untuk mengubah orientasi watermark</li>
      <li>📱 Gunakan tombol swap untuk mengganti kamera</li>
      <li>⚙️ Gunakan tombol settings untuk mengatur watermark</li>
      <li>🌓 Gunakan tombol mode untuk mengubah tema</li>
    </ul>
    <div class="flex justify-end">
      <button id="closeHelp" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
        Tutup
      </button>
    </div>
  </div>
`;
document.body.appendChild(helpModal);

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

// ... (kode sebelumnya tetap sama sampai fungsi captureImage)

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

  // Setup font dan style untuk watermark
  context.font = '34px "Inter", sans-serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.shadowColor = 'rgba(0, 0, 0, 0.8)';
  context.shadowBlur = 4;
  context.lineWidth = 2;

  // Hitung dimensi teks watermark
  const textMetrics = context.measureText(watermarkText);
  const textWidth = textMetrics.width;
  // Perkiraan tinggi teks (karena tidak ada API langsung untuk mengukur tinggi)
  const textHeight = 34; // Sesuai dengan ukuran font

  // Tentukan posisi watermark
  let x, y;
  const padding = 50; // Jarak dari tepi
  
  switch (watermarkPosition) {
    case 'kiri_atas':
      x = padding;
      y = padding + (textHeight / 2);
      break;
    case 'kanan_atas':
      x = canvas.width - padding;
      y = padding + (textHeight / 2);
      break;
    case 'kiri_bawah':
      x = padding;
      y = canvas.height - padding;
      break;
    case 'kanan_bawah':
      x = canvas.width - padding;
      y = canvas.height - padding;
      break;
    default: // center
      x = canvas.width / 2;
      y = canvas.height / 2;
  }

  // Simpan state context
  context.save();
  
  // Translate ke posisi watermark
  context.translate(x, y);
  
  // Rotate watermark
  context.rotate(watermarkRotation * (Math.PI / 180));
  
  // Alignment berdasarkan posisi
  let textX = -textWidth / 2; // Default center alignment
  let textY = 0;

  // Sesuaikan alignment berdasarkan posisi
  switch (watermarkPosition) {
    case 'kiri_atas':
    case 'kiri_bawah':
      textX = 0;
      break;
    case 'kanan_atas':
    case 'kanan_bawah':
      textX = -textWidth;
      break;
    // center tetap menggunakan default (-textWidth / 2)
  }

  // Gambar watermark
  context.fillText(watermarkText, textX, textY);
  
  // Restore context state
  context.restore();

  const imageData = canvas.toDataURL('image/png');
  preview.src = imageData;
  modal.classList.remove('hidden');
}

// ... (kode selanjutnya tetap sama)

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

// Fungsi untuk merotasi watermark
function rotateWatermark() {
  watermarkRotation = (watermarkRotation + 90) % 360;
}

// Fungsi untuk toggle dark mode
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  if (isDarkMode) {
    document.body.classList.add('bg-stone-900');
    modeButton.innerHTML = '<i data-feather="sun" class="text-slate-50"></i>';
  } else {
    document.body.classList.remove('bg-stone-900');
    modeButton.innerHTML = '<i data-feather="moon" class="text-slate-700"></i>';
  }
  feather.replace();
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
rotateButton.addEventListener('click', rotateWatermark);
modeButton.addEventListener('click', toggleDarkMode);

settings.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
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

// Memulai kamera saat halaman dimuat
startCamera();