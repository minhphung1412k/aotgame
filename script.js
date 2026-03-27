import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/**
 * TRÌNH KHỞI TẠO THẾ GIỚI MỞ "SHIGANSHINA CINEMATIC"
 * Tự động tạo Nhân vật có da thịt, Xương khớp và Hiệu ứng Ánh sáng AAA
 */

let scene, camera, renderer, controls, player;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

// --- BỘ PHẬN CƠ THỂ NHÂN VẬT (XƯƠNG KHỚP TỰ ĐỘNG) ---
let body, head, leftArm, rightArm, leftLeg, rightLeg, cloak;

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0xaaccff, 0.007); // Sương mù Cinematic

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // --- ÁNH SÁNG CHIẾU RỰC RỠ (CINEMATIC LIGHTING) ---
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x404040, 0.6));

    // --- MẶT ĐẤT CÓ CHI TIẾT ---
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshStandardMaterial({ color: 0x3d5229, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- TỰ ĐỘNG XÂY THÀNH PHỐ (NHÀ CỬA TRẢI DÀI) ---
    for (let i = 0; i < 60; i++) {
        const h = Math.random() * 15 + 10;
        const house = new THREE.Mesh(
            new THREE.BoxGeometry(10, h, 10),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        house.position.set(Math.random() * 400 - 200, h/2, Math.random() * 400 - 200);
        house.castShadow = true; house.receiveShadow = true;
        scene.add(house);
    }

    // --- TƯỜNG THÀNH MARIA KHỔNG LỒ ---
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(1000, 150, 20),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    wall.position.set(0, 75, -200);
    scene.add(wall);

    // --- KHỞI TẠO NHÂN VẬT EREN (CÓ DA THỊT & QUẦN ÁO) ---
    player = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 }); // Màu da người
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Áo trắng
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4b3621 }); // Quần nâu
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x004d00 }); // Áo choàng xanh Trinh sát

    body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 4, 8), shirtMat);
    body.position.y = 1.2;
    player.add(body);

    head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), skinMat);
    head.position.y = 2.1;
    player.add(head);

    leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.8, 4, 8), skinMat);
    leftArm.position.set(-0.6, 1.5, 0);
    player.add(leftArm);

    rightArm = leftArm.clone();
    rightArm.position.x = 0.6;
    player.add(rightArm);

    leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 1.0, 4, 8), pantsMat);
    leftLeg.position.set(-0.25, 0.5, 0);
    player.add(leftLeg);

    rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.25;
    player.add(rightLeg);

    cloak = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.1), cloakMat);
    cloak.position.set(0, 1.3, -0.4);
    player.add(cloak);

    scene.add(player);

    // --- ĐIỀU KHIỂN ---
    controls = new PointerLockControls(camera, document.body);
    window.addEventListener('click', () => controls.lock());

    const onKeyDown = (e) => {
        if (e.code === 'KeyW') moveForward = true;
        if (e.code === 'KeyS') moveBackward = true;
        if (e.code === 'KeyA') moveLeft = true;
        if (e.code === 'KeyD') moveRight = true;
    };
    const onKeyUp = (e) => {
        if (e.code === 'KeyW') moveForward = false;
        if (e.code === 'KeyS') moveBackward = false;
        if (e.code === 'KeyA') moveLeft = false;
        if (e.code === 'KeyD') moveRight = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 180.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 180.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // --- CẬP NHẬT VỊ TRÍ NHÂN VẬT & CAMERA ---
        player.position.copy(controls.getObject().position);
        player.position.y = 0;
        player.rotation.y = camera.rotation.y;

        // --- DIỄN HOẠT (ANIMATION) CHÂN THỰC ---
        const speed = velocity.length();
        if (speed > 0.1) {
            // Động tác chạy: Chân tay vung vẩy theo nhịp
            const t = time * 0.01;
            leftLeg.rotation.x = Math.sin(t) * 0.5;
            rightLeg.rotation.x = -Math.sin(t) * 0.5;
            leftArm.rotation.x = -Math.sin(t) * 0.5;
            rightArm.rotation.x = Math.sin(t) * 0.5;
            cloak.rotation.x = 0.2 + Math.sin(t) * 0.1; // Áo choàng bay trong gió
        } else {
            // Động tác thở (Idle): Nhấp nhô nhẹ nhàng
            const t = time * 0.002;
            body.scale.set(1 + Math.sin(t) * 0.02, 1, 1 + Math.sin(t) * 0.02);
            leftArm.rotation.z = 0.1 + Math.sin(t) * 0.05;
            rightArm.rotation.z = -0.1 - Math.sin(t) * 0.05;
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}
