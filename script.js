import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer, controls, player, sword;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();

// --- HỆ THỐNG GIỌNG NÓI TIẾNG VIỆT (FIX LỖI KHÔNG PHÁT TIẾNG) ---
function speakVietnamese(text) {
    window.speechSynthesis.cancel(); // Xóa các câu thoại cũ bị kẹt
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    msg.rate = 0.8; // Đọc chậm cho oai
    msg.pitch = 1;
    window.speechSynthesis.speak(msg);
    
    const sub = document.getElementById('npc-subtitle');
    sub.innerText = "LÍNH GÁC: " + text;
    sub.style.display = 'block';
    setTimeout(() => sub.style.display = 'none', 4000);
}

window.selectCharacter = (name) => {
    window.selectedChar = name;
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(name === 'Eren Jaeger' ? 'char-eren' : 'char-levi').classList.add('selected');
    const btn = document.getElementById('start-game-btn');
    btn.classList.remove('disabled'); btn.disabled = false;
};

window.startGame = () => {
    document.getElementById('character-selection-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('current-char-display').innerText = window.selectedChar.toUpperCase();
    init3D();
    // Kích hoạt tiếng Việt ngay khi bắt đầu
    speakVietnamese("Chào mừng bạn đến với quận Shiganshina. Hãy cầm chắc thanh kiếm của mình!");
};

function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Bầu trời xanh ban đầu
    scene.fog = new THREE.FogExp2(0xcccccc, 0.005); // Sương mù Cinematic

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;

    // HIỆU ỨNG ÁNH SÁNG CHÓI LÓA (BLOOM)
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloom.threshold = 0.2; bloom.strength = 1.0; 
    composer.addPass(bloom);

    // ÁNH SÁNG MẶT TRỜI RỰC RỠ
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // MẶT ĐẤT CÓ MÀU SẮC (CỎ & ĐẤT)
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3d5229 }); // Màu cỏ đậm
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // THÀNH PHỐ VÀ NHÀ CỬA (MÔ PHỎNG THẾ GIỚI MỞ)
    for(let i = 0; i < 40; i++) {
        const houseGeo = new THREE.BoxGeometry(10, Math.random()*15 + 5, 10);
        const houseMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const house = new THREE.Mesh(houseGeo, houseMat);
        house.position.set(Math.random()*200 - 100, houseGeo.parameters.height/2, Math.random()*200 - 100);
        house.castShadow = true; house.receiveShadow = true;
        scene.add(house);
    }

    // TƯỜNG THÀNH MARIA KHỔNG LỒ
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1000, 150, 20), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    wall.position.set(0, 75, -200);
    scene.add(wall);

    // NHÂN VẬT NGƯỜI (CÓ DA THỊT - MÔ PHỎNG)
    player = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 }); // Màu da người
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.5, 4, 8), bodyMat);
    player.add(torso);
    
    // THANH KIẾM ÁNH SÁNG
    sword = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00ffff, emissiveIntensity: 2 }));
    sword.position.set(1, 0, 0.5);
    player.add(sword);

    player.position.y = 1.25;
    scene.add(player);

    // ĐIỀU KHIỂN CHUỘT & BÀN PHÍM
    controls = new PointerLockControls(camera, document.body);
    window.addEventListener('click', () => { 
        if(!controls.isLocked) controls.lock(); 
        else performAttack();
    });

    const onKeyDown = (e) => {
        if(e.code === 'KeyW') moveForward = true;
        if(e.code === 'KeyS') moveBackward = true;
        if(e.code === 'KeyA') moveLeft = true;
        if(e.code === 'KeyD') moveRight = true;
    };
    const onKeyUp = (e) => {
        if(e.code === 'KeyW') moveForward = false;
        if(e.code === 'KeyS') moveBackward = false;
        if(e.code === 'KeyA') moveLeft = false;
        if(e.code === 'KeyD') moveRight = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    animate();
}

function performAttack() {
    sword.rotation.x = -Math.PI/2;
    setTimeout(() => sword.rotation.x = 0, 150);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        
        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // CAMERA ĐUỔI THEO NHÂN VẬT (GÓC NHÌN THỨ 3)
        const pPos = controls.getObject().position;
        player.position.copy(pPos);
        player.position.y = 1.25;
        
        const camOffset = new THREE.Vector3(0, 5, 12).applyQuaternion(camera.quaternion);
        camera.position.copy(pPos).add(camOffset);
        camera.lookAt(pPos);
    }

    prevTime = time;
    composer.render();
}
