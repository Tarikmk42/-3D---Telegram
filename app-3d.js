// ===== КОНФИГУРАЦИЯ 3D ИГРЫ =====
const CONFIG_3D = {
    TOTAL_STAGES: 13,
    INITIAL_TIME: 45 * 60,
    MAX_LIVES: 3,
    PLAYER_SPEED: 0.1,
    INTERACTION_DISTANCE: 3
};

// ===== ПЕРЕМЕННЫЕ 3D ИГРЫ =====
let scene, camera, renderer, controls;
let gameState3D = {
    currentStage: 1,
    score: 0,
    timeLeft: CONFIG_3D.INITIAL_TIME,
    lives: CONFIG_3D.MAX_LIVES,
    playerPosition: { x: 0, y: 0, z: 0 },
    collectedItems: [],
    isGameActive: false,
    timerInterval: null
};

// 3D объекты
let farmObjects = [];
let interactiveObjects = [];
let player;
let raycaster, mouse;

// ===== ИНИЦИАЛИЗАЦИЯ THREE.JS =====
function initThreeJS() {
    console.log("🎮 Инициализация Three.js...");
    
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // Создание камеры
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Создание рендерера
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Raycaster для взаимодействий
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Создание простой фермы
    createSimpleFarm();
    
    // Создание игрока
    createPlayer();
    
    // Загрузка этапа
    load3DStage(gameState3D.currentStage);

    // Обработка событий
    setup3DEventListeners();
    
    // Запуск анимации
    animate();
}

function createSimpleFarm() {
    console.log("🏠 Создание 3D фермы...");
    
    // Земля
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Небо
    const skyGeometry = new THREE.SphereGeometry(80, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Дом фермера
    createBuilding(0, 0, -15, 0x8B4513, 0xFFD700);
    
    // Забор
    createFence();
    
    // Деревья
    createTrees();
}

function createBuilding(x, z, rotation, wallColor, roofColor) {
    // Стены
    const wallGeometry = new THREE.BoxGeometry(8, 4, 6);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.set(x, 2, z);
    walls.rotation.y = rotation;
    walls.castShadow = true;
    walls.receiveShadow = true;
    scene.add(walls);

    // Крыша
    const roofGeometry = new THREE.ConeGeometry(6, 3, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: roofColor });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 5, z);
    roof.rotation.y = rotation + Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);

    farmObjects.push(walls, roof);
}

function createFence() {
    const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    for (let i = -20; i <= 20; i += 2) {
        // Вертикальные столбы
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
        const post = new THREE.Mesh(postGeometry, fenceMaterial);
        post.position.set(i, 1, 20);
        post.castShadow = true;
        scene.add(post);
        
        farmObjects.push(post);
    }
}

function createTrees() {
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        createTree(x, z);
    }
}

function createTree(x, z) {
    // Ствол
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Крона
    const crownGeometry = new THREE.SphereGeometry(2);
    const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(x, 3, z);
    crown.castShadow = true;
    scene.add(crown);

    farmObjects.push(trunk, crown);
}

function createPlayer() {
    // Простая модель игрока (куб)
    const geometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.75, 10);
    player.castShadow = true;
    scene.add(player);
}

// ===== ЗАГРУЗКА ЭТАПОВ =====
function load3DStage(stageNumber) {
    console.log(`📖 Загружаем 3D этап ${stageNumber}`);
    
    // Очищаем предыдущие интерактивные объекты
    interactiveObjects.forEach(obj => scene.remove(obj));
    interactiveObjects = [];
    
    const stage = stages[stageNumber];
    if (!stage) return;
    
    // Обновляем задачу в интерфейсе
    document.getElementById('task-text-3d').textContent = stage.task;
    document.getElementById('current-stage-3d').textContent = stageNumber;
    
    // Создаем объекты для текущего этапа
    switch(stageNumber) {
        case 1:
            createStage1Objects();
            break;
        case 2:
            createStage2Objects();
            break;
        case 3:
            createStage3Objects();
            break;
        // ... остальные этапы
    }
    
    update3DUI();
}

function createStage1Objects() {
    // Зараженное яблоко
    const appleGeometry = new THREE.SphereGeometry(0.3);
    const appleMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    const apple = new THREE.Mesh(appleGeometry, appleMaterial);
    apple.position.set(5, 0.3, 5);
    apple.userData = {
        type: 'interactive',
        stage: 1,
        interaction: () => showDialog('Зараженное яблоко', 'Вы нашли зараженное яблоко! Введите код: ЗАРАЖЕНИЕ_2024')
    };
    apple.castShadow = true;
    scene.add(apple);
    interactiveObjects.push(apple);
}

function createStage2Objects() {
    // Яйца зомби-кур
    const symbols = ['Ω', '†', '∞', '¤', '§'];
    const positions = [
        { x: -8, z: 8 },
        { x: -4, z: 12 },
        { x: 0, z: 15 },
        { x: 4, z: 12 },
        { x: 8, z: 8 }
    ];
    
    symbols.forEach((symbol, index) => {
        const eggGeometry = new THREE.SphereGeometry(0.2);
        const eggMaterial = new THREE.MeshLambertMaterial({ color: 0xF0E68C });
        const egg = new THREE.Mesh(eggGeometry, eggMaterial);
        egg.position.set(positions[index].x, 0.2, positions[index].z);
        egg.userData = {
            type: 'interactive',
            stage: 2,
            symbol: symbol,
            interaction: () => collectSymbol(symbol)
        };
        egg.castShadow = true;
        scene.add(egg);
        interactiveObjects.push(egg);
    });
}

// ===== ВЗАИМОДЕЙСТВИЯ =====
function checkInteractions() {
    // Проверяем взаимодействие с объектами
    interactiveObjects.forEach(obj => {
        const distance = player.position.distanceTo(obj.position);
        if (distance < CONFIG_3D.INTERACTION_DISTANCE) {
            // Подсвечиваем объект при приближении
            if (obj.material.emissive) {
                obj.material.emissive.setHex(0x333300);
            }
        }
    });
}

function interactWithObject() {
    let closestObject = null;
    let closestDistance = CONFIG_3D.INTERACTION_DISTANCE;
    
    interactiveObjects.forEach(obj => {
        const distance = player.position.distanceTo(obj.position);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestObject = obj;
        }
    });
    
    if (closestObject && closestObject.userData.interaction) {
        closestObject.userData.interaction();
    }
}

function collectSymbol(symbol) {
    if (!gameState3D.collectedItems.includes(symbol)) {
        gameState3D.collectedItems.push(symbol);
        showNotification(`Собрано: ${symbol}`, 'success');
        
        // Проверяем, собраны ли все символы
        if (gameState3D.collectedItems.length === 5) {
            const code = gameState3D.collectedItems.join('');
            showDialog('Все яйца собраны!', `Собранный код: ${code}. Введите его для проверки.`);
        }
    }
}

// ===== ДИАЛОГИ И УВЕДОМЛЕНИЯ =====
function showDialog(title, message) {
    const dialog = document.getElementById('dialog-modal');
    const titleElement = document.getElementById('dialog-title');
    const messageElement = document.getElementById('dialog-message');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    dialog.classList.remove('hidden');
}

function hideDialog() {
    document.getElementById('dialog-modal').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Здесь можно добавить систему уведомлений в 3D интерфейсе
    console.log(`💬 ${type}: ${message}`);
}

// ===== УПРАВЛЕНИЕ =====
function setup3DEventListeners() {
    // Управление с клавиатуры
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Управление с кнопок на экране
    document.getElementById('move-forward').addEventListener('touchstart', () => movePlayer('forward'));
    document.getElementById('move-back').addEventListener('touchstart', () => movePlayer('backward'));
    document.getElementById('move-left').addEventListener('touchstart', () => movePlayer('left'));
    document.getElementById('move-right').addEventListener('touchstart', () => movePlayer('right'));
    document.getElementById('interact').addEventListener('click', interactWithObject);
    
    // Диалоговое окно
    document.getElementById('close-dialog').addEventListener('click', hideDialog);
    document.getElementById('submit-3d-answer').addEventListener('click', check3DAnswer);
    
    // Обработка изменения размера окна
    window.addEventListener('resize', onWindowResize);
}

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

function handleKeyDown(event) {
    switch(event.key) {
        case 'w': case 'ArrowUp': keys.forward = true; break;
        case 's': case 'ArrowDown': keys.backward = true; break;
        case 'a': case 'ArrowLeft': keys.left = true; break;
        case 'd': case 'ArrowRight': keys.right = true; break;
        case ' ': interactWithObject(); break;
    }
}

function handleKeyUp(event) {
    switch(event.key) {
        case 'w': case 'ArrowUp': keys.forward = false; break;
        case 's': case 'ArrowDown': keys.backward = false; break;
        case 'a': case 'ArrowLeft': keys.left = false; break;
        case 'd': case 'ArrowRight': keys.right = false; break;
    }
}

function movePlayer(direction) {
    const speed = CONFIG_3D.PLAYER_SPEED;
    
    switch(direction) {
        case 'forward':
            player.position.z -= speed;
            break;
        case 'backward':
            player.position.z += speed;
            break;
        case 'left':
            player.position.x -= speed;
            break;
        case 'right':
            player.position.x += speed;
            break;
    }
    
    // Ограничиваем движение игрока в пределах фермы
    player.position.x = THREE.MathUtils.clamp(player.position.x, -40, 40);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -40, 40);
    
    gameState3D.playerPosition = {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z
    };
}

// ===== ИГРОВАЯ ЛОГИКА =====
function check3DAnswer() {
    const input = document.getElementById('3d-answer-input');
    const userAnswer = input.value.trim();
    const currentStage = stages[gameState3D.currentStage];
    
    if (!userAnswer) {
        showNotification('Введите ответ!', 'error');
        return;
    }
    
    const normalizedUserAnswer = userAnswer.toUpperCase().replace(/\s+/g, '');
    const normalizedCorrectAnswer = currentStage.answer.toUpperCase().replace(/\s+/g, '');
    
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
        // Правильный ответ
        handle3DCorrectAnswer();
    } else {
        // Неправильный ответ
        handle3DWrongAnswer();
    }
}

function handle3DCorrectAnswer() {
    const currentStage = stages[gameState3D.currentStage];
    gameState3D.score += currentStage.points;
    
    showNotification(`✅ Правильно! +${currentStage.points} очков`, 'success');
    hideDialog();
    
    // Переход к следующему этапу
    setTimeout(() => {
        gameState3D.currentStage++;
        gameState3D.collectedItems = [];
        
        if (gameState3D.currentStage <= CONFIG_3D.TOTAL_STAGES) {
            load3DStage(gameState3D.currentStage);
        } else {
            end3DGame(true);
        }
        
        update3DUI();
    }, 1500);
}

function handle3DWrongAnswer() {
    gameState3D.lives--;
    
    if (gameState3D.lives <= 0) {
        showNotification('💀 Закончились жизни!', 'error');
        setTimeout(() => end3DGame(false), 2000);
    } else {
        showNotification(`❌ Неправильно! Осталось жизней: ${gameState3D.lives}`, 'error');
    }
    
    update3DUI();
}

function update3DUI() {
    document.getElementById('score-3d').textContent = gameState3D.score;
    document.getElementById('lives-3d').textContent = gameState3D.lives;
    document.getElementById('current-stage-3d').textContent = gameState3D.currentStage;
    
    // Обновляем прогресс-бар
    const progress = ((gameState3D.currentStage - 1) / CONFIG_3D.TOTAL_STAGES) * 100;
    document.getElementById('stage-progress-3d').style.width = `${progress}%`;
    
    // Обновляем таймер
    update3DTimer();
}

function update3DTimer() {
    const minutes = Math.floor(gameState3D.timeLeft / 60);
    const seconds = gameState3D.timeLeft % 60;
    document.getElementById('time-3d').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function start3DTimer() {
    gameState3D.timerInterval = setInterval(() => {
        if (gameState3D.isGameActive && gameState3D.timeLeft > 0) {
            gameState3D.timeLeft--;
            update3DTimer();
            
            if (gameState3D.timeLeft === 300) {
                showNotification('⏰ Осталось 5 минут!', 'warning');
            }
        } else if (gameState3D.timeLeft <= 0) {
            clearInterval(gameState3D.timerInterval);
            showNotification('⏰ Время вышло!', 'error');
            end3DGame(false);
        }
    }, 1000);
}

function end3DGame(isVictory) {
    gameState3D.isGameActive = false;
    clearInterval(gameState3D.timerInterval);
    
    if (isVictory) {
        showNotification('🎉 Победа! Ферма спасена!', 'success');
    }
    
    // Здесь можно добавить переход на экран результатов
    setTimeout(() => {
        showMainMenu3D();
    }, 3000);
}

// ===== АНИМАЦИЯ =====
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState3D.isGameActive) {
        // Движение игрока
        if (keys.forward) movePlayer('forward');
        if (keys.backward) movePlayer('backward');
        if (keys.left) movePlayer('left');
        if (keys.right) movePlayer('right');
        
        // Проверка взаимодействий
        checkInteractions();
        
        // Обновление камеры (следование за игроком)
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + 10;
        camera.lookAt(player.position.x, player.position.y, player.position.z);
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== УПРАВЛЕНИЕ ЭКРАНАМИ =====
function showScreen3D(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function showMainMenu3D() {
    showScreen3D('main-menu-3d');
}

function start3DGame() {
    showScreen3D('game-container');
    gameState3D.isGameActive = true;
    start3DTimer();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Инициализация 3D игры Зомби-Ферма...");
    
    // Симуляция загрузки
    simulate3DLoading();
    
    // Настройка обработчиков меню
    document.getElementById('start-3d-game').addEventListener('click', start3DGame);
    document.getElementById('how-to-play-3d').addEventListener('click', () => {
        showDialog('Управление', 'Используйте кнопки или WASD для движения. Нажимайте ⚡ для взаимодействия с объектами.');
    });
});

function simulate3DLoading() {
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            setTimeout(() => {
                showMainMenu3D();
                initThreeJS(); // Инициализируем Three.js после загрузки
            }, 500);
        }
        
        const progressBar = document.getElementById('loading-progress-3d');
        const loadingTip = document.getElementById('loading-tip-3d');
        
        if (progressBar) progressBar.style.width = `${progress}%`;
        
        if (loadingTip) {
            const tips = [
                "Загружаем 3D движок...",
                "Создаем ферму...",
                "Расставляем объекты...",
                "Настраиваем освещение...",
                "Готово! Начинаем приключение!"
            ];
            const tipIndex = Math.floor(progress / 20);
            if (tipIndex < tips.length) {
                loadingTip.textContent = tips[tipIndex];
            }
        }
    }, 200);
}

// Экспортируем функции для глобального использования
window.start3DGame = start3DGame;
window.showMainMenu3D = showMainMenu3D;

console.log("🎮 3D игра Зомби-Ферма инициализирована!");
