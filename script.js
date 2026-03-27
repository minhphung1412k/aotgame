let player = document.getElementById('player');
let gameScreen = document.getElementById('game-screen');
let charSelect = document.getElementById('char-select');
let scoreEl = document.getElementById('score');
let score = 0;
let playerX = window.innerWidth / 2 - 40;
let playerY = window.innerHeight / 2 - 60;
let speed = 10;
let titans = [];

function selectChar(char) {
    charSelect.style.display = 'none';
    gameScreen.style.display = 'block';
    player.style.backgroundImage = `url('${char}.jpg')`; // Nạp ảnh tĩnh bạn đang có
    
    startGame();
}

function startGame() {
    // Tạo Titan đầu tiên
    createTitan();
    
    // Vòng lặp game
    document.addEventListener('keydown', movePlayer);
    document.addEventListener('click', attack); // Click chuột để chém
}

function movePlayer(e) {
    if(e.code === 'KeyW') playerY -= speed;
    if(e.code === 'KeyS') playerY += speed;
    if(e.code === 'KeyA') playerX -= speed;
    if(e.code === 'KeyD') playerX += speed;
    
    // Giới hạn nhân vật trong màn hình
    playerX = Math.max(0, Math.min(window.innerWidth - 80, playerX));
    playerY = Math.max(0, Math.min(window.innerHeight - 120, playerY));
    
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
}

function createTitan() {
    let titan = document.createElement('div');
    titan.className = 'titan';
    titan.style.left = Math.random() * (window.innerWidth - 150) + 'px';
    titan.style.top = Math.random() * (window.innerHeight - 250) + 'px';
    
    // Thêm điểm gáy Titan (Vị trí cần chém)
    let gay = document.createElement('div');
    gay.className = 'titan-gay';
    titan.appendChild(gay);
    
    gameScreen.appendChild(titan);
    titans.push({element: titan, gay: gay});
}

function attack(e) {
    // CHÉM VÀO KHÔNG KHÍ (Tạo hiệu ứng máu nếu trúng Titan)
    createBloodEffect(e.clientX, e.clientY);
    
    // Kiểm tra xem có chém trúng gáy Titan không
    for (let i = titans.length - 1; i >= 0; i--) {
        let titan = titans[i];
        let gayRect = titan.gay.getBoundingClientRect();
        
        // Nếu click trúng gáy Titan (Vị trí [Chuột Trái] trùng với Gáy Titan)
        if (e.clientX >= gayRect.left && e.clientX <= gayRect.right &&
            e.clientY >= gayRect.top && e.clientY <= gayRect.bottom) {
            
            // Titan gục xuống (Xóa Titan)
            gameScreen.removeChild(titan.element);
            titans.splice(i, 1);
            score++;
            scoreEl.innerText = score;
            
            // Tạo Titan mới
            setTimeout(createTitan, 1000); 
            break;
        }
    }
}

// Hiệu ứng máu bắn tung tóe
function createBloodEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        let blood = document.createElement('div');
        blood.className = 'blood-effect';
        blood.style.left = x + 'px';
        blood.style.top = y + 'px';
        blood.style.animationDelay = Math.random() * 0.2 + 's';
        gameScreen.appendChild(blood);
        
        // Xóa hiệu ứng sau 0.5s
        setTimeout(() => gameScreen.removeChild(blood), 500);
    }
}
