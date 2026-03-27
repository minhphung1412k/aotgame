import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- KHỞI TẠO HỆ THỐNG ĐỒ HỌA SIÊU THỰC ---
const scene = new THREE.Scene();
// Sương mù tạo chiều sâu (Fog) - Bí mật của đồ họa 99%
scene.fog = new THREE.FogExp2(0x8694a1, 0.002); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(20, 15, 40);

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('game-canvas'), 
    antialias: true,
    powerPreference: "high-performance" 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Đổ bóng mềm mại
renderer.toneMapping = THREE.ReinhardToneMapping; // Chỉnh tông màu điện ảnh
renderer.toneMappingExposure = 1.2;

// --- HỆ THỐNG TIA NẮNG SIÊU THỰC (GOD RAYS) ---
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xfff5eb,
    transparent: true,
    opacity: 0.9
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(100, 150, -200);
scene.add(sunMesh);

// Ánh sáng chính chiếu xuống thế giới
const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
mainLight.position.copy(sunMesh.position);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 4096; // Độ phân giải bóng đổ cực cao
mainLight.shadow.mapSize.height = 4096;
scene.add(mainLight);

// --- TẠO MÔI TRƯỜNG QUẬN SHIGANSHINA (BẢN PHÁC THẢO SIÊU THỰC) ---
// Mặt đất với vân đá (Texture giả lập)
const groundGeo = new THREE.PlaneGeometry(1000, 1000);
const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x444444, 
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Tạo một bức tường thành Maria khổng lồ phía xa
const wallGeo = new THREE.BoxGeometry(1000, 150, 20);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const wall = new THREE.Mesh(wallGeo, wallMat);
wall.position.set(0, 75, -150);
wall.castShadow = true;
wall.receiveShadow = true;
scene.add(wall);

// --- LOGIC NHÂN VẬT VÀ CAMERA XOAY ĐA CHIỀU ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2; // Không cho camera nhìn xuyên đất

// --- HỆ THỐNG CỐT TRUYỆN THAY ĐỔI CẤU TRÚC ---
window.choosePath = (path) => {
    const storyBox = document.getElementById('story-box');
    if (path === 'training') {
        storyBox.innerHTML = "<b>KẾT QUẢ:</b> Bạn đã đạt đến cảnh giới Levi. Tốc độ di chuyển tăng 200%. Bạn có thể thay đổi số phận của đội!";
        mainLight.color.setHex(0xffffff); // Ánh sáng trắng rực rỡ
    } else {
        storyBox.innerHTML = "<b>CẢNH BÁO:</b> Bạn đang phản bội nhân loại. Bầu trời chuyển sang màu máu...";
        scene.fog.color.setHex(0x550000); // Đổi sương mù thành màu đỏ máu
        mainLight.color.setHex(0xff0000);
    }
};

// --- VÒNG LẶP RENDER (FRAME RATE CỰC CAO) ---
function animate() {
    requestAnimationFrame(animate);
    
    // Hiệu ứng tia nắng lung linh
    const time = Date.now() * 0.001;
    sunMesh.position.y = 150 + Math.sin(time) * 5; 
    
    controls.update();
    renderer.render(scene, camera);
}
animate();
