import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let strollerMesh = null;

document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById('splashScreen');
    const bluetoothScreen = document.getElementById('bluetooth-screen');
    const mainApp = document.getElementById('main-app');

    const btnConnectBt = document.getElementById('btn-connect-bt');
    const btStatusText = document.getElementById('bt-status-text');
    const btIcon = document.getElementById('bt-icon');

    // 1. TRANSITION (Splash -> Bluetooth)
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        bluetoothScreen.classList.remove('hidden');
    }, 3000);

    // 2. BLUETOOTH
    if (btnConnectBt) {
        btnConnectBt.addEventListener('click', () => {
            btnConnectBt.disabled = true;
            btnConnectBt.innerText = "CONNECTING...";
            btStatusText.innerText = "Pairing with BabyPilot System...";
            btIcon.classList.add('bt-searching');

            setTimeout(() => {
                btIcon.classList.remove('bt-searching');
                btIcon.classList.add('bt-connected');
                btStatusText.style.color = "#00ff37";
                btStatusText.innerText = "CONNECTED SUCCESSFULLY !";
                btnConnectBt.style.borderColor = "#00ff37";
                btnConnectBt.style.color = "#00ff37";
                btnConnectBt.innerText = "ACCESSING DASHBOARD...";

                setTimeout(() => {
                    bluetoothScreen.classList.add('hidden');
                    mainApp.classList.remove('hidden');
                    init3D(); // Charge la 3D
                }, 1500);

            }, 3000);
        });
    }

    // 3. THREE.JS (Inséré dans canvas-container)
    function init3D() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 5, 20); // Reculé pour le mobile

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // IMPORTANT: On attache le canvas au bon endroit pour le mobile
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        const loader = new STLLoader();
        loader.load(
            'modelToUsed.stl',
            function (geometry) {
                const material = new THREE.MeshPhongMaterial({ 
                    color: 0x7ac4d8, 
                    specular: 0x111111, 
                    shininess: 100 
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                strollerMesh = mesh;

                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                mesh.position.sub(center);
                
                const size = new THREE.Vector3();
                geometry.boundingBox.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim;
                mesh.scale.set(scale, scale, scale);
                
                // On monte un peu la poussette sur mobile pour qu'elle soit bien visible
                mesh.position.y += 6; 

                mesh.rotation.x = -Math.PI / 2;

                const group = new THREE.Group();
                group.add(mesh);
                scene.add(group);
            },
            (xhr) => {},
            (error) => { console.error("Erreur 3D :", error); }
        );

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    }
});

// --- BATTERIE ---
let level = 85;
const batteryFill = document.querySelector('.battery-fill');
const batteryText = document.getElementById('battery-level');
const batteryIcon = document.querySelector('.battery-icon');
const batteryIconFill = document.querySelector('.battery-icon-fill');

function updateBatteryColor(currentLevel) {
    let colorHex = '';
    if (currentLevel > 75) { colorHex = '#016f18'; } 
    else if (currentLevel > 50) { colorHex = '#00ff37'; } 
    else if (currentLevel > 25) { colorHex = '#ffcc00'; } 
    else { colorHex = '#ff003c'; }

    if(batteryText) { batteryText.style.color = colorHex; batteryText.style.textShadow = `0 0 8px ${colorHex}`; }
    if(batteryFill) { batteryFill.style.background = colorHex; batteryFill.style.boxShadow = `0 0 15px ${colorHex}`; }
    if(batteryIcon) { batteryIcon.style.color = colorHex; batteryIcon.style.filter = `drop-shadow(0 0 5px ${colorHex})`; }
}

if(batteryIconFill && batteryFill && batteryText) {
    updateBatteryColor(level);
    batteryIconFill.style.width = (19 * (level / 100)) + 'px';
    batteryFill.style.width = level + '%';
    batteryText.innerText = level + '%';

    setInterval(() => {
        if (level > 0) {
            level -= 1;
            batteryFill.style.width = level + '%';
            batteryText.innerText = level + '%';
            batteryIconFill.style.width = (19 * (level / 100)) + 'px';
            updateBatteryColor(level);
            if (level < 20) { batteryIcon.classList.add('low-battery-icon'); } 
            else { batteryIcon.classList.remove('low-battery-icon'); }
        }
    }, 5000); 
}

// --- LOCK SYSTEM ---
const btnLock = document.getElementById('btn-lock');
const lockBtnText = document.getElementById('lock-btn-text');
const lockStatus = document.getElementById('lock-status');
let isLocked = false;
const originalColor = 0x7ac4d8; 
const lockedColor = 0xff003c;   

if(btnLock) {
    btnLock.addEventListener('click', () => {
        isLocked = !isLocked; 
        if (isLocked) {
            btnLock.classList.add('locked');
            if(lockBtnText) lockBtnText.innerText = "UNLOCK WHEELS";
            if(lockStatus) {
                lockStatus.innerText = "The Wheels Are Locked";
                lockStatus.style.color = "#ff003c";
                lockStatus.style.textShadow = "0 0 8px #ff003c";
            }
            if (strollerMesh) strollerMesh.material.color.setHex(lockedColor);
        } else {
            btnLock.classList.remove('locked');
            if(lockBtnText) lockBtnText.innerText = "LOCK WHEELS";
            if(lockStatus) {
                lockStatus.innerText = "The Wheels are unlocked";
                lockStatus.style.color = "#00f3ff";
                lockStatus.style.textShadow = "none";
            }
            if (strollerMesh) strollerMesh.material.color.setHex(originalColor);
        }
    });
}

// --- METEO ---
const btnWeather = document.getElementById('btn-weather');
const weatherBtnText = document.getElementById('weather-btn-text');
const weatherDisplay = document.getElementById('weather-display');
const weatherLocation = document.getElementById('weather-location');
const weatherTemp = document.getElementById('weather-temp');
const weatherDesc = document.getElementById('weather-desc');
let isCheckingWeather = false;

if (btnWeather) {
    btnWeather.addEventListener('click', () => {
        if (!isCheckingWeather) {
            isCheckingWeather = true;
            btnWeather.classList.add('gps-searching');
            if (weatherBtnText) weatherBtnText.innerText = "ANALYSE...";
            weatherDisplay.classList.add('hidden');

            setTimeout(() => {
                isCheckingWeather = false;
                btnWeather.classList.remove('gps-searching');
                if (weatherBtnText) weatherBtnText.innerText = "ACTUALISER MÉTÉO";
                if (weatherLocation && weatherTemp && weatherDesc) {
                    weatherLocation.innerText = "POSITION : AGADIR";
                    weatherTemp.innerText = "24°C";
                    weatherDesc.innerText = "Ensoleillé / Optimales ☀️";
                }
                weatherDisplay.classList.remove('hidden');
            }, 2500);
        }
    });
}

// --- ALARME ---
const btnAlarm = document.getElementById('btn-alarm');
const alarmBtnText = document.getElementById('alarm-btn-text');
const soundBarContainer = document.getElementById('sound-bar-container');
const soundBarFill = document.getElementById('sound-bar-fill');
const alarmAudio = document.getElementById('alarm-sound');
let isAlarmOn = false;

if (btnAlarm && alarmAudio) {
    btnAlarm.addEventListener('click', () => {
        isAlarmOn = !isAlarmOn;
        if (isAlarmOn) {
            btnAlarm.classList.add('alarm-active');
            if(alarmBtnText) alarmBtnText.innerText = "ARRÊTER L'ALARME";
            soundBarContainer.classList.remove('hidden');
            alarmAudio.play().catch(e => console.log("Interaction requise"));
            soundBarFill.style.width = "100%";
        } else {
            btnAlarm.classList.remove('alarm-active');
            if(alarmBtnText) alarmBtnText.innerText = "ACTIVER L'ALARME";
            soundBarContainer.classList.add('hidden');
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
            soundBarFill.style.width = "0%";
        }
    });
}

// --- GPS MAPS ---
const btnGps = document.getElementById('btn-gps');
const gpsText = document.getElementById('gps-text');
const mapContainer = document.getElementById('map-container');
const mapPlaceholder = document.getElementById('map-placeholder');
const placeholderText = document.getElementById('placeholder-text');
const gpsStatusText = document.getElementById('gps-status-text');
let isSearching = false;

if(btnGps) {
    btnGps.addEventListener('click', () => {
        if (!isSearching) {
            isSearching = true;
            btnGps.classList.add('gps-searching');
            if(gpsText) gpsText.innerText = "SATELLITE...";
            
            if(mapContainer) mapContainer.style.display = "none";
            if(gpsStatusText) gpsStatusText.style.display = "none";
            if(mapPlaceholder) {
                mapPlaceholder.style.display = "flex";
                placeholderText.innerHTML = "<span style='color:#ffcc00; font-weight:bold;'>Recherche... ⏳</span>";
            }
            
            setTimeout(() => {
                isSearching = false;
                btnGps.classList.remove('gps-searching');
                if(gpsText) gpsText.innerText = "ACTUALISÉE";
                if(mapPlaceholder) mapPlaceholder.style.display = "none";
                if(mapContainer) mapContainer.style.display = "block";
                if(gpsStatusText) gpsStatusText.style.display = "block";
            }, 4000); 
        }
    });
}