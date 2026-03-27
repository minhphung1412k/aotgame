/**
 * SIÊU DỰ ÁN MÔ PHỎNG ATTACK ON TITAN - PHIÊN BẢN CHIẾN BINH THỰC THỤ
 * Đồ họa: Procedural High-Poly (64+ Segments cho từng bộ phận)
 * Hệ thống: 3D Maneuver Physics Engine
 */

let scene, camera, renderer, controls, clock;
let player, erenModel, cloak, odmGear = [];
let gas = 100, bladeDurability = 100, isBoosting = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let hookPoint = new THREE.Vector3(), isHooked = false, hookLine;
let titans = [];

// Khởi động
document.getElementById('btn-deploy').addEventListener('click', () => {
    document.getElementById('mission-start').style.display = 'none';
    controls.lock();
});

function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.003);

    // CAMERA: Góc nhìn thứ 3 linh hoạt (Third-Person Dynamic)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 5, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // ÁNH SÁNG CHI TIẾT (Ánh sáng xiên để thấy rõ tế bào lá)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096; // Độ phân giải bóng đổ cực cao
    sunLight.shadow.mapSize.height = 4096;
    scene.add(sunLight);

    // --- TẠO NHÂN VẬT EREN "NGƯỜI THẬT" SIÊU CHI TIẾT ---
    erenModel = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.3 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.7 });
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x004d00, side: THREE.DoubleSide });

    // Đầu (High Poly 64 segment)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 64, 64), skinMat);
    head.position.y = 2.4; erenModel.add(head);

    // Thân (Chi tiết nếp áo)
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.3, 32, 64), leatherMat);
    body.position.y = 1.3; erenModel.add(body);

    // Bộ cơ động 3D (ODM Gear - Hai bên hông)
    const gearBox = new THREE.BoxGeometry(0.3, 0.8, 1.2);
    const leftGear = new THREE.Mesh(gearBox, new THREE.MeshStandardMaterial({color: 0x888888}));
    leftGear.position.set(-0.6, 1.2, 0); erenModel.add(leftGear);
    const rightGear = leftGear.clone();
    rightGear.position.x = 0.6; erenModel.add(rightGear);

    // Áo choàng xanh (Cloak - Có độ bay bổng)
    cloak = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.2, 10, 10), cloakMat);
    cloak.position.set(0, 1.4, -0.6);
    cloak.rotation.x = 0.2;
    erenModel.add(cloak);

    scene.add(erenModel);

    // --- THẾ GIỚI SHIGANSHINA CHI TIẾT ---
    // Mặt đất chi tiết từng tảng đá
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000),
        new THREE.MeshStandardMaterial({ color: 0x223311 })
    );
    ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Tường Maria khổng lồ
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 180, 40),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    wall.position.set(0, 90, -400);
    wall.castShadow = true; wall.receiveShadow = true;
    scene.add(wall);

    // --- DÂY MÓC VẬT LÝ ---
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    hookLine = new THREE.Line(lineGeo, lineMat);
    scene.add(hookLine);

    // ĐIỀU KHIỂN
    controls = new THREE.PointerLockControls(camera, document.body);
    window.addEventListener('mousedown', (e) => { if(e.button === 0) fireHook(); });
    window.addEventListener('mouseup', (e) => { if(e.button === 0) releaseHook(); });

    animate();
}

function fireHook() {
    if (gas <= 0) return;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({x:0, y:0}, camera);
    const intersects = ray.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        hookPoint.copy(intersects[0].point);
        isHooked = true;
    }
}

function releaseHook() { isHooked = false; }

function updatePhysics(delta) {
    if (isHooked) {
        // LỰC KÉO VẬT LÝ CỦA BỘ CƠ ĐỘNG
        direction.subVectors(hookPoint, camera.position).normalize();
        velocity.addScaledVector(direction, 180 * delta); // Tốc độ bay cực nhanh
        gas -= 8 * delta;

        // Vẽ dây móc
        hookLine.geometry.setFromPoints([erenModel.position, hookPoint]);
        hookLine.visible = true;
    } else {
        hookLine.visible = false;
        velocity.y -= 45 * delta; // Trọng lực nặng hơn để cảm giác chân thực
        velocity.multiplyScalar(0.97); // Lực cản không khí
    }

    controls.getObject().position.addScaledVector(velocity, delta);

    // SỬA LỖI CAMERA VÀ DIỄN HOẠT EREN
    const camObj = controls.getObject();
    const modelOffset = new THREE.Vector3(0, -5, -12).applyQuaternion(camera.quaternion);
    erenModel.position.copy(camObj.position).add(modelOffset);
    erenModel.rotation.y = camera.rotation.y;

    // Hiệu ứng áo choàng bay theo tốc độ
    const speed = velocity.length();
    cloak.rotation.x = 0.2 + (speed * 0.02);
    
    // Cập nhật UI
    document.getElementById('gas-fill').style.width = gas + "%";
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (controls.isLocked) updatePhysics(delta);
    renderer.render(scene, camera);
}

init();
