import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer, controls, player, npc, sword;
let selectedChar = null;
let isAttacking = false;

// --- HỆ THỐNG GIỌNG NÓI NPC ---
function npcSpeak(text) {
    const sub = document.getElementById('npc-subtitle');
    sub.innerText = "LÍNH GÁC: " + text;
    sub.style.display = 'block';
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'vi-VN';
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
    
    setTimeout(() => { sub.style.display = 'none'; }, 4000);
}

// --- CHỌN NHÂN VẬT ---
window.selectCharacter = (name) => {
    selectedChar = name;
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(name === 'Eren Jaeger' ? 'char-eren' : 'char-levi').classList.add('selected');
    const btn = document.getElementById('start-game-btn');
    btn.classList.remove('disabled');
    btn.disabled = false;
};

window.startGame = () => {
    document.getElementById('character-selection-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('current-char-display').innerText = selectedChar;
    init3D();
    setTimeout(() => npcSpeak("Chào mừng chiến binh! Hãy canh giữ bức tường thành Maria."), 1500);
};

// --- KHỞI TẠO 3D VIP ---
function init3D() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x111111, 0.01);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Hiệu ứng Bloom VIP (Lóa sáng)
    const composer_obj = new EffectComposer(renderer);
    composer_obj.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloom.threshold = 0.1; bloom.strength = 1.2;
    composer_obj.addPass(bloom);
    composer = composer_obj;

    // Ánh sáng
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0xffaa00, 2);
    sun.position.set(50, 50, 50);
    sun.castShadow = true;
    scene.add(sun);

    // Môi trường
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x151515 }));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true;
    scene.add(ground);

    const wall = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 15), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    wall.position.set(0, 50, -40);
    scene.add(wall);

    // Người chơi & Kiếm
    player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.5, 4, 8), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    player.add(body);
    
    sword = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0 }));
    sword.position.set(0.8, 0, 0.5);
    player.add(sword);
    
    player.position.y = 1.25;
    scene.add(player);

    // NPC Lính Gác
    npc = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.5, 4, 8), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
    npc.position.set(5, 1.25, -10);
    scene.add(npc);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Sự kiện Chém
    window.addEventListener('mousedown', () => { if(!isAttacking) attack(); });

    animate();
}

function attack() {
    isAttacking = true;
    sword.material.emissiveIntensity = 10; // Kiếm lóa sáng VIP
    sword.rotation.x = -Math.PI / 1.5;
    
    // Rung màn hình
    camera.position.x += 0.2;
    setTimeout(() => {
        sword.rotation.x = 0;
        sword.material.emissiveIntensity = 0;
        isAttacking = false;
        camera.position.x -= 0.2;
    }, 150);
}

function animate() {
    requestAnimationFrame(animate);
    
    // NPC cử động thở
    if(npc) npc.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.03;
    
    // Tự động nói khi lại gần NPC
    if(player && npc && player.position.distanceTo(npc.position) < 5 && !npc.said) {
        npc.said = true;
        npcSpeak("Đừng đi quá xa, Titan đang ở rất gần!");
    }

    if(controls) {
        controls.target.lerp(player.position, 0.1);
        controls.update();
    }
    if(composer) composer.render();
}
