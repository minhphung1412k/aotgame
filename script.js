import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer, controls, player;
let selectedCharacterName = null;
let isAttacking = false;

// --- A. GIAO DIỆN CHỌN NHÂN VẬT ---
window.selectCharacter = (charName) => {
    selectedCharacterName = charName;
    document.querySelectorAll('.char-card').forEach(card => card.classList.remove('selected'));
    if(charName === 'Eren Jaeger') document.getElementById('char-eren').classList.add('selected');
    if(charName === 'Levi Ackerman') document.getElementById('char-levi').classList.add('selected');
    const startBtn = document.getElementById('start-game-btn');
    startBtn.classList.remove('disabled');
    startBtn.disabled = false;
};

window.startGame = () => {
    document.getElementById('character-selection-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('current-char-display').innerText = selectedCharacterName.toUpperCase();
    init3DWorld();
};

// --- B. THẾ GIỚI 3D CHIẾN TRƯỜNG VIP ---
function init3DWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x1a1a1a, 0.008);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Post-processing: Bloom (Lóa sáng cực phẩm)
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.0;
    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // Ánh sáng kịch tính
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemiLight);
    const sun = new THREE.DirectionalLight(0xffaa00, 2);
    sun.position.set(50, 50, -50);
    sun.castShadow = true;
    scene.add(sun);

    // Tạo mặt đất và tường Maria khổng lồ
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    scene.add(ground);

    const wall = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 10), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    wall.position.set(0, 50, -30);
    scene.add(wall);

    // NHÂN VẬT CỦA BẠN (Đại diện bằng khối Cylinder cao cấp)
    const playerGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    playerGroup.add(body);
    player = playerGroup;
    player.position.y = 1;
    scene.add(player);

    // KIẾM CỦA NHÂN VẬT
    const swordGeo = new THREE.BoxGeometry(0.1, 2, 0.1);
    const swordMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x00ffff, emissiveIntensity: 0 });
    const sword = new THREE.Mesh(swordGeo, swordMat);
    sword.position.set(0.8, 0, 0.5);
    player.add(sword);

    // KẺ THÙ: TITAN SIÊU NHIÊN (Khối đỏ khổng lồ)
    const titan = new THREE.Mesh(new THREE.BoxGeometry(5, 20, 5), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 }));
    titan.position.set(0, 10, -15);
    scene.add(titan);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.copy(player.position);

    // --- C. HỆ THỐNG CHIẾN ĐẤU & DI CHUYỂN ---
    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) performAttack(sword);
    });

    animate();
}

function performAttack(sword) {
    if (isAttacking) return;
    isAttacking = true;
    
    // Hiệu ứng vung kiếm nhanh
    sword.material.emissiveIntensity = 5; // Kiếm phát sáng khi chém
    sword.rotation.x = -Math.PI / 2;
    
    // Rung màn hình khi chém
    const originalPos = camera.position.clone();
    setTimeout(() => {
        camera.position.x += (Math.random() - 0.5) * 0.5;
        camera.position.y += (Math.random() - 0.5) * 0.5;
    }, 50);

    setTimeout(() => {
        sword.rotation.x = 0;
        sword.material.emissiveIntensity = 0;
        isAttacking = false;
        camera.position.copy(originalPos);
    }, 200);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) {
        controls.target.lerp(player.position, 0.1); // Camera đuổi theo nhân vật mượt mà
        controls.update();
    }
    if (composer) composer.render();
}

window.makeChoice = (path) => {
    const storyText = document.getElementById('story-text');
    if (path === 'training') {
        storyText.innerText = "KỸ NĂNG TĂNG CAO! Bạn cảm nhận được luồng sức mạnh mới chảy trong huyết quản.";
        player.children[0].material.color.setHex(0x00ffff);
    } else {
        storyText.innerText = "BẠN ĐÃ CHỌN BÓNG TỐI. Thế giới bắt đầu run rẩy...";
        scene.fog.color.setHex(0x550000);
    }
};
