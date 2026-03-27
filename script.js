import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer, controls, player, sword, guardNpc;
let selectedChar = null;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isAttacking = false, isRunning = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// --- HỆ THỐNG GIỌNG NÓI NPC TIẾNG VIỆT ---
function npcSpeak(text) {
    const sub = document.getElementById('npc-subtitle');
    sub.innerText = "LÍNH GÁC: " + text;
    sub.style.display = 'block';
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'vi-VN'; speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
    setTimeout(() => { sub.style.display = 'none'; }, 4000);
}

// --- CHỌN NHÂN VẬT ---
window.selectCharacter = (name) => {
    selectedChar = name;
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(name === 'Eren Jaeger' ? 'char-eren' : 'char-levi').classList.add('selected');
    const btn = document.getElementById('start-game-btn');
    btn.classList.remove('disabled'); btn.disabled = false;
};

window.startGame = () => {
    document.getElementById('character-selection-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('current-char-display').innerText = selectedChar;
    init3D();
};

// --- TẠO THANH KIẾM THỰC SỰ (Có chuôi & lưỡi) ---
function createSword() {
    const group = new THREE.Group();
    // Lưỡi kiếm
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.02), new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x00ffff, emissiveIntensity: 0 }));
    blade.position.y = 1; blade.castShadow = true;
    group.add(blade);
    // Chuôi kiếm
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    hilt.position.y = 0;
    group.add(hilt);
    return group;
}

// --- TẠO NHÂN VẬT 3D CÓ TAY CHÂN (STICKMAN VIP) ---
function createCharacterModel() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    // Thân
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 1), mat);
    torso.position.y = 1; torso.castShadow = true;
    group.add(torso);
    // Đầu
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25), mat);
    head.position.y = 1.7; head.castShadow = true;
    group.add(head);
    // Tay (để animation vung)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), mat);
    armL.position.set(-0.4, 1, 0); armL.rotation.z = Math.PI/2;
    group.add(armL);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), mat);
    armR.position.set(0.4, 1, 0); armR.rotation.z = -Math.PI/2;
    group.add(armR);
    // Chân (để animation chạy)
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1), mat);
    legL.position.set(-0.15, 0.5, 0); legL.castShadow = true;
    group.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1), mat);
    legR.position.set(0.15, 0.5, 0); legR.castShadow = true;
    group.add(legR);

    // Gắn kiếm vào tay phải
    sword = createSword();
    sword.position.set(0, -0.4, 0); // Đặt vào cuối cánh tay
    armR.add(sword);

    group.legs = [legL, legR]; group.arms = [armL, armR];
    return group;
}

// --- KHỞI TẠO 3D REVOLUTION ---
function init3D() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x111111, 0.012);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    // Không set position camera trực tiếp, nó sẽ đuổi theo player

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Hiệu ứng Bloom VIP
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloom.threshold = 0.1; bloom.strength = 1.0;
    composer.addPass(bloom);

    // Ánh sáng
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0xffaa00, 2);
    sun.position.set(50, 50, 50); sun.castShadow = true;
    scene.add(sun);

    // Môi trường
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true;
    scene.add(ground);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(300, 150, 15), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    wall.position.set(0, 75, -60); scene.add(wall);

    // Người chơi (Model mới có tay chân & kiếm)
    player = createCharacterModel();
    scene.add(player);

    // NPC Lính Gác
    guardNpc = createCharacterModel(); // Dùng chung model
    guardNpc.children.forEach(c => c.material = new THREE.MeshStandardMaterial({color: 0x0000ff})); // Đổi màu
    guardNpc.position.set(10, 0, -10);
    scene.add(guardNpc);

    // ĐIỀU KHIỂN CHUỘT PointerLock
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());
    window.addEventListener('click', () => {
        if(!controls.isLocked) { controls.lock(); } 
        else if(!isAttacking) { attack(); }
    });

    // Sự kiện Bàn phím W-A-S-D
    window.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyD': moveRight = true; break;
        }
    });
    window.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });

    setTimeout(() => npcSpeak("Chào mừng! Hãy sẵn sàng điều khiển cơ thể mới của bạn."), 1500);
    animate();
}

function attack() {
    isAttacking = true;
    const armR = player.arms[1];
    sword.children[0].material.emissiveIntensity = 8; // Kiếm lóa sáng
    
    // Animation vung tay
    armR.rotation.x = -Math.PI / 1.8;
    setTimeout(() => {
        armR.rotation.x = -Math.PI/2;
        sword.children[0].material.emissiveIntensity = 0;
        isAttacking = false;
    }, 180);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked === true) {
        // Xử lý di chuyển vật lý
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // Đuổi theo player (Góc nhìn thứ ba chuẩn)
        const playerPos = controls.getObject().position.clone();
        player.position.copy(playerPos);
        
        const relativeCameraOffset = new THREE.Vector3(0, 4, 10);
        const cameraOffset = relativeCameraOffset.applyQuaternion(camera.quaternion);
        camera.position.x = playerPos.x + cameraOffset.x;
        camera.position.y = playerPos.y + cameraOffset.y;
        camera.position.z = playerPos.z + cameraOffset.z;
        camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);

        // Animation chạy (Vung tay vung chân)
        isRunning = moveForward || moveBackward || moveLeft || moveRight;
        if(isRunning) {
            const speed = isAttacking ? 0.01 : 0.008;
            player.legs[0].rotation.x = Math.sin(time * speed) * 0.5;
            player.legs[1].rotation.x = -Math.sin(time * speed) * 0.5;
            player.arms[0].rotation.x = -Math.sin(time * speed) * 0.5;
            if(!isAttacking) player.arms[1].rotation.x = -Math.PI/2 + Math.sin(time * speed) * 0.5;
        } else {
            player.legs.forEach(l => l.rotation.x = 0);
            player.arms[0].rotation.x = 0;
            if(!isAttacking) player.arms[1].rotation.x = -Math.PI/2;
        }

        // Tự động nói khi lại gần NPC
        if(playerPos.distanceTo(guardNpc.position) < 6 && !guardNpc.said) {
            guardNpc.said = true;
            npcSpeak("Cẩn thận với cơ thể mới này, đừng vấp ngã!");
        }
    }
    prevTime = time;
    if(composer) composer.render();
}
