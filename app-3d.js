// ===== КОНФИГУРАЦИЯ 3D ИГРЫ =====
const CONFIG_3D = {
    TOTAL_STAGES: 13,
    INITIAL_TIME: 45 * 60,
    MAX_LIVES: 3,
    PLAYER_SPEED: 0.1,
    INTERACTION_DISTANCE: 3,
    WORLD_SIZE: 80
};

// ===== ПЕРЕМЕННЫЕ 3D ИГРЫ =====
let scene, camera, renderer;
let gameState3D = {
    currentStage: 1,
    score: 0,
    timeLeft: CONFIG_3D.INITIAL_TIME,
    lives: CONFIG_3D.MAX_LIVES,
    playerPosition: { x: 0, y: 0, z: 10 },
    collectedItems: [],
    isGameActive: false,
    timerInterval: null,
    isPaused: false
};

// 3D объекты
let farmObjects = [];
let interactiveObjects = [];
let player;
let raycaster, mouse;
let keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// ===== ИНИЦИАЛИЗАЦИЯ THREE.JS =====
function initThreeJS() {
    console.log("🎮 Инициализация Three.js...");
    
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // Создание камеры
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);

    // Создание рендерера
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Освещение
    setupLighting();

    // Raycaster для взаимодействий
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Создание игрового мира
    createGameWorld();
    
    // Загрузка первого этапа
    load3DStage(gameState3D.currentStage);

    // Обработка событий
    setup3DEventListeners();
    
    // Запуск анимации
    animate();
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light (солнце)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Hemisphere light для более естественного освещения
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x7CFC00, 0.4);
    scene.add(hemisphereLight);
}

function createGameWorld() {
    console.log("🏠 Создание 3D мира фермы...");
    
    createGround();
    createSky();
    createFarmHouse();
    createBarn();
    createFence();
    createTrees();
    createPlayer();
    createPond();
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(CONFIG_3D.WORLD_SIZE, CONFIG_3D.WORLD_SIZE, 20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x7CFC00,
        wireframe: false
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // Добавляем текстуру травы (простая версия)
    groundMaterial.color = new THREE.Color(0x32CD32);
    scene.add(ground);
    farmObjects.push(ground);
}

function createSky() {
    const skyGeometry = new THREE.SphereGeometry(60, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    farmObjects.push(sky);
}

function createFarmHouse() {
    // Основание дома
    const baseGeometry = new THREE.BoxGeometry(12, 1, 10);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.5, -18);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    // Стены дома
    const wallsGeometry = new THREE.BoxGeometry(10, 6, 8);
    const wallsMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const walls = new THREE.Mesh(wallsGeometry, wallsMaterial);
    walls.position.set(0, 3, -18);
    walls.castShadow = true;
    walls.receiveShadow = true;
    scene.add(walls);

    // Крыша
    const roofGeometry = new THREE.ConeGeometry(7, 4, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 7, -18);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);

    // Дверь
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.5, -13.9);
    door.castShadow = true;
    scene.add(door);

    farmObjects.push(base, walls, roof, door);
}

function createBarn() {
    // Основание сарая
    const baseGeometry = new THREE.BoxGeometry(15, 1, 12);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(20, 0.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    // Стены сарая
    const wallsGeometry = new THREE.BoxGeometry(13, 5, 10);
    const wallsMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    const walls = new THREE.Mesh(wallsGeometry, wallsMaterial);
    walls.position.set(20, 2.5, 0);
    walls.castShadow = true;
    walls.receiveShadow = true;
    scene.add(walls);

    // Крыша сарая
    const roofGeometry = new THREE.ConeGeometry(8, 3, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(20, 6, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);

    farmObjects.push(base, walls, roof);
}

function createFence() {
    const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const fencePosts = [];
    
    // Создаем забор по периметру
    const fencePositions = [
        // Северная сторона
        ...Array.from({length: 20}, (_, i) => ({x: -40 + i * 4, z: -40})),
        // Южная сторона  
        ...Array.from({length: 20}, (_, i) => ({x: -40 + i * 4, z: 40})),
        // Западная сторона
        ...Array.from({length: 20}, (_, i) => ({x: -40, z: -40 + i * 4})),
        // Восточная сторона
        ...Array.from({length: 20}, (_, i) => ({x: 40, z: -40 + i * 4}))
    ];
    
    fencePositions.forEach(pos => {
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
        const post = new THREE.Mesh(postGeometry, fenceMaterial);
        post.position.set(pos.x, 1, pos.z);
        post.castShadow = true;
        scene.add(post);
        fencePosts.push(post);
    });
    
    farmObjects.push(...fencePosts);
}

function createTrees() {
    const treePositions = [
        {x: -30, z: -30}, {x: -25, z: 25}, {x: 30, z: -25},
        {x: 25, z: 30}, {x: -35, z: 10}, {x: 35, z: -10},
        {x: -15, z: -35}, {x: 15, z: 35}
    ];
    
    treePositions.forEach(pos => {
        createTree(pos.x, pos.z);
    });
}

function createTree(x, z) {
    // Ствол
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    // Крона
    const crownGeometry = new THREE.SphereGeometry(2.5);
    const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(x, 4, z);
    crown.castShadow = true;
    scene.add(crown);

    farmObjects.push(trunk, crown);
}

function createPond() {
    const pondGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
    const pondMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4682B4,
        transparent: true,
        opacity: 0.7
    });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.position.set(-10, 0.25, 15);
    pond.rotation.x = Math.PI / 2;
    pond.receiveShadow = true;
    scene.add(pond);
    farmObjects.push(pond);
}

function createPlayer() {
    // Тело игрока (синий цилиндр)
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    player = new THREE.Mesh(bodyGeometry, bodyMaterial);
    player.position.copy(new THREE.Vector3(
        gameState3D.playerPosition.x,
        gameState3D.playerPosition.y,
        gameState3D.playerPosition.z
    ));
    player.castShadow = true;
    player.receiveShadow = true;

    // Голова игрока (желтая сфера)
    const headGeometry = new THREE.SphereGeometry(0.5);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    player.add(head);

    scene.add(player);
}

// ===== ЗАГРУЗКА ЭТАПОВ =====
function load3DStage(stageNumber) {
    console.log(`📖 Загружаем 3D этап ${stageNumber}`);
    
    // Очищаем предыдущие интерактивные объекты
    clearInteractiveObjects();
    
    const stage = stages[stageNumber];
    if (!stage) {
        console.error(`Этап ${stageNumber} не найден!`);
        return;
    }
    
    // Обновляем задачу в интерфейсе
    updateTaskUI(stage.task, stageNumber);
    
    // Создаем объекты для текущего этапа
    createStageObjects(stageNumber);
    
    update3DUI();
}

function clearInteractiveObjects() {
    interactiveObjects.forEach(obj => {
        scene.remove(obj);
        // Очищаем геометрию и материалы для предотвращения утечек памяти
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(material => material.dispose());
            } else {
                obj.material.dispose();
            }
        }
    });
    interactiveObjects = [];
    gameState3D.collectedItems = [];
}

function updateTaskUI(task, stageNumber) {
    document.getElementById('task-text-3d').textContent = task;
    document.getElementById('current-stage-3d').textContent = stageNumber;
}

function createStageObjects(stageNumber) {
    const objectsConfig = stageObjects[stageNumber];
    if (!objectsConfig) {
        console.log(`Для этапа ${stageNumber} нет специальных объектов`);
        return;
    }
    
    objectsConfig.forEach(objConfig => {
        const object = createInteractiveObject(objConfig, stageNumber);
        if (object) {
            interactiveObjects.push(object);
            scene.add(object);
        }
    });
}

function createInteractiveObject(config, stageNumber) {
    let geometry, material, mesh;
    
    switch(config.type) {
        case "infected_apple":
            geometry = new THREE.SphereGeometry(0.5, 16, 16);
            material = new THREE.MeshLambertMaterial({ 
                color: config.color || 0xFF0000,
                emissive: 0x330000
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.userData = {
                type: 'interactive',
                stage: stageNumber,
                interaction: () => showCodeDialog(stages[stageNumber].answer)
            };
            break;
            
        case "zombie_egg":
            geometry = new THREE.SphereGeometry(0.4, 16, 16);
            material = new THREE.MeshLambertMaterial({ 
                color: config.color || 0xF0E68C,
                emissive: 0x333300
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.userData = {
                type: 'collectible',
                stage: stageNumber,
                symbol: config.symbol,
                interaction: () => collectSymbol(config.symbol)
            };
            break;
            
        case "barn_code":
            geometry = new THREE.PlaneGeometry(3, 2);
            material = new THREE.MeshLambertMaterial({ 
                color: config.color || 0x8B4513,
                side: THREE.DoubleSide
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.userData = {
                type: 'interactive',
                stage: stageNumber,
                interaction: () => showCipherDialog()
            };
            break;
            
        default:
            console.warn(`Неизвестный тип объекта: ${config.type}`);
            return null;
    }
    
    if (mesh) {
        mesh.position.set(config.position.x, config.position.y, config.position.z);
        if (config.rotation) {
            mesh.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
        }
        if (config.scale) {
            mesh.scale.setScalar(config.scale);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }
    
    return mesh;
}

// ===== ВЗАИМОДЕЙСТВИЯ =====
function checkInteractions() {
    // Автоматическая проверка близости к объектам
    interactiveObjects.forEach(obj => {
        const distance = player.position.distanceTo(obj.position);
        const isClose = distance < CONFIG_3D.INTERACTION_DISTANCE;
        
        // Подсветка объектов при приближении
        if (obj.material && obj.material.emissive) {
            if (isClose && !obj.userData.isHighlighted) {
                obj.userData.originalEmissive = obj.material.emissive.getHex();
                obj.material.emissive.setHex(0x666600);
                obj.userData.isHighlighted = true;
            } else if (!isClose && obj.userData.isHighlighted) {
                obj.material.emissive.setHex(obj.userData.originalEmissive || 0x000000);
                obj.userData.isHighlighted = false;
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
        playSound('click');
        closestObject.userData.interaction();
        return true;
    }
    
    return false;
}

function collectSymbol(symbol) {
    if (!gameState3D.collectedItems.includes(symbol)) {
        gameState3D.collectedItems.push(symbol);
        showNotification(`Собрано: ${symbol}`, 'success');
        
        // Создаем эффект сбора
        createCollectionEffect(player.position, 0xF0E68C);
        
        // Удаляем собранный объект
        const objectIndex = interactiveObjects.findIndex(obj => 
            obj.userData.symbol === symbol
        );
        if (objectIndex !== -1) {
            const collectedObject = interactiveObjects[objectIndex];
            scene.remove(collectedObject);
            interactiveObjects.splice(objectIndex, 1);
        }
        
        // Проверяем, собраны ли все символы
        if (gameState3D.collectedItems.length === 5) {
            const code = gameState3D.collectedItems.join('');
            setTimeout(() => {
                showDialog('Все яйца собраны!', `Собранный код: ${code}. Введите его для проверки.`);
            }, 1000);
        }
    }
}

function createCollectionEffect(position, color) {
    const particleCount = 8;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ color });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.1 + 0.05,
            (Math.random() - 0.5) * 0.1
        );
        particle.userData.life = 1.0;
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Анимация частиц
    function animateParticles() {
        let allDead = true;
        
        particles.children.forEach(particle => {
            particle.userData.life -= 0.02;
            if (particle.userData.life > 0) {
                allDead = false;
                particle.position.add(particle.userData.velocity);
                particle.material.opacity = particle.userData.life;
                particle.scale.setScalar(particle.userData.life);
            }
        });
        
        if (!allDead) {
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particles);
            // Очистка геометрии и материалов
            particles.children.forEach(particle => {
                particle.geometry.dispose();
                particle.material.dispose();
            });
        }
    }
    
    animateParticles();
}

// ===== ДИАЛОГИ И УВЕДОМЛЕНИЯ =====
function showCodeDialog(correctAnswer) {
    showDialog('Зараженное яблоко', 
        'Вы нашли зараженное яблоко! Введите код для продолжения.', 
        correctAnswer);
}

function showCipherDialog() {
    showDialog('Шифр на сарае', 
        'На стене сарая вы видите странные символы: ГСУФЛХЛЖ... Подсказка: шифр Цезаря со сдвигом 3.', 
        'ПРОТИВОЯДИЕ');
}

function showDialog(title, message, correctAnswer = null) {
    const dialog = document.getElementById('dialog-modal');
    const titleElement = document.getElementById('dialog-title');
    const messageElement = document.getElementById('dialog-message');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // Сохраняем правильный ответ в данных диалога
    dialog.dataset.correctAnswer = correctAnswer;
    
    // Очищаем поле ввода
    document.getElementById('3d-answer-input').value = '';
    
    dialog.classList.remove('hidden');
    gameState3D.isPaused = true;
}

function hideDialog() {
    const dialog = document.getElementById('dialog-modal');
    dialog.classList.add('hidden');
    gameState3D.isPaused = false;
}

function showNotification(message, type = 'info') {
    // Простая реализация уведомлений
    console.log(`💬 ${type.toUpperCase()}: ${message}`);
    
    // Можно расширить для показа UI уведомлений
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(35, 47, 52, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        backdrop-filter: blur(10px);
        border: 2px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#f9aa33'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// ===== УПРАВЛЕНИЕ =====
function setup3DEventListeners() {
    // Управление с клавиатуры
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Управление с кнопок на экране
    setupTouchControls();
    
    // Диалоговое окно
    document.getElementById('close-dialog').addEventListener('click', hideDialog);
    document.getElementById('submit-3d-answer').addEventListener('click', check3DAnswer);
    
    // Быстрые действия
    document.getElementById('hint-3d').addEventListener('click', showHint);
    document.getElementById('pause-3d').addEventListener('click', togglePause);
    
    // Обработка изменения размера окна
    window.addEventListener('resize', onWindowResize);
    
    // Предотвращение контекстного меню
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

function setupTouchControls() {
    const controls = {
        forward: document.getElementById('move-forward'),
        backward: document.getElementById('move-back'),
        left: document.getElementById('move-left'),
        right: document.getElementById('move-right'),
        interact: document.getElementById('interact')
    };

    // Обработчики для кнопок управления
    Object.entries(controls).forEach(([action, element]) => {
        if (element) {
            // Touch события для мобильных устройств
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys[action] = true;
                if (action === 'interact') {
                    interactWithObject();
                }
            });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys[action] = false;
            });
            
            // Mouse события для десктопа
            element.addEventListener('mousedown', (e) => {
                e.preventDefault();
                keys[action] = true;
                if (action === 'interact') {
                    interactWithObject();
                }
            });
            
            element.addEventListener('mouseup', (e) => {
                e.preventDefault();
                keys[action] = false;
            });
            
            element.addEventListener('mouseleave', (e) => {
                keys[action] = false;
            });
        }
    });
}

function handleKeyDown(event) {
    if (gameState3D.isPaused) return;
    
    switch(event.key.toLowerCase()) {
        case 'w': case 'arrowup': 
            keys.forward = true; 
            break;
        case 's': case 'arrowdown': 
            keys.backward = true; 
            break;
        case 'a': case 'arrowleft': 
            keys.left = true; 
            break;
        case 'd': case 'arrowright': 
            keys.right = true; 
            break;
        case ' ': case 'e':
            interactWithObject();
            break;
        case 'escape':
            togglePause();
            break;
    }
}

function handleKeyUp(event) {
    switch(event.key.toLowerCase()) {
        case 'w': case 'arrowup': keys.forward = false; break;
        case 's': case 'arrowdown': keys.backward = false; break;
        case 'a': case 'arrowleft': keys.left = false; break;
        case 'd': case 'arrowright': keys.right = false; break;
    }
}

function movePlayer(direction) {
    if (gameState3D.isPaused) return;
    
    const speed = CONFIG_3D.PLAYER_SPEED;
    const newPosition = player.position.clone();
    
    switch(direction) {
        case 'forward':
            newPosition.z -= speed;
            break;
        case 'backward':
            newPosition.z += speed;
            break;
        case 'left':
            newPosition.x -= speed;
            break;
        case 'right':
            newPosition.x += speed;
            break;
    }
    
    // Проверка границ мира
    const halfWorld = CONFIG_3D.WORLD_SIZE / 2 - 2;
    if (Math.abs(newPosition.x) < halfWorld && Math.abs(newPosition.z) < halfWorld) {
        player.position.copy(newPosition);
        
        gameState3D.playerPosition = {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z
        };
    }
}

// ===== ИГРОВАЯ ЛОГИКА =====
function check3DAnswer() {
    const input = document.getElementById('3d-answer-input');
    const userAnswer = input.value.trim();
    const dialog = document.getElementById('dialog-modal');
    const correctAnswer = dialog.dataset.correctAnswer;
    
    if (!userAnswer) {
        showNotification('Введите ответ!', 'error');
        return;
    }
    
    if (!correctAnswer) {
        console.error('Правильный ответ не установлен в диалоге');
        return;
    }
    
    const normalizedUserAnswer = userAnswer.toUpperCase().replace(/\s+/g, '');
    const normalizedCorrectAnswer = correctAnswer.toUpperCase().replace(/\s+/g, '');
    
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
        handle3DCorrectAnswer();
    } else {
        handle3DWrongAnswer();
    }
}

function handle3DCorrectAnswer() {
    const currentStage = stages[gameState3D.currentStage];
    gameState3D.score += currentStage.points;
    
    showNotification(`✅ Правильно! +${currentStage.points} очков`, 'success');
    hideDialog();
    
    // Создаем эффект успеха
    createCollectionEffect(player.position, 0x00FF00);
    
    // Переход к следующему этапу
    setTimeout(() => {
        gameState3D.currentStage++;
        
        if (gameState3D.currentStage <= CONFIG_3D.TOTAL_STAGES) {
            load3DStage(gameState3D.currentStage);
            showNotification(`🎉 Этап ${gameState3D.currentStage} начался!`, 'success');
        } else {
            end3DGame(true);
        }
        
        update3DUI();
    }, 1500);
}

function handle3DWrongAnswer() {
    gameState3D.lives--;
    
    showNotification(`❌ Неправильно! Осталось жизней: ${gameState3D.lives}`, 'error');
    
    // Эффект ошибки
    createCollectionEffect(player.position, 0xFF0000);
    
    if (gameState3D.lives <= 0) {
        setTimeout(() => {
            showNotification('💀 Закончились жизни! Игра окончена.', 'error');
            end3DGame(false);
        }, 2000);
    }
    
    update3DUI();
}

function showHint() {
    const currentStage = gameState3D.currentStage;
    const hint = hints[currentStage];
    
    if (hint) {
        showDialog(`Подсказка для этапа ${currentStage}`, hint, null);
    } else {
        showNotification('Подсказка для этого этапа пока недоступна', 'info');
    }
}

function togglePause() {
    gameState3D.isPaused = !gameState3D.isPaused;
    
    if (gameState3D.isPaused) {
        showNotification('⏸️ Игра на паузе', 'info');
        clearInterval(gameState3D.timerInterval);
    } else {
        showNotification('▶️ Игра продолжается', 'success');
        start3DTimer();
    }
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
    if (gameState3D.timerInterval) {
        clearInterval(gameState3D.timerInterval);
    }
    
    gameState3D.timerInterval = setInterval(() => {
        if (gameState3D.isGameActive && !gameState3D.isPaused && gameState3D.timeLeft > 0) {
            gameState3D.timeLeft--;
            update3DTimer();
            
            // Предупреждения о времени
            if (gameState3D.timeLeft === 300) { // 5 минут
                showNotification('⏰ Осталось 5 минут!', 'warning');
            } else if (gameState3D.timeLeft === 60) { // 1 минута
                showNotification('⏰ Осталась 1 минута!', 'warning');
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
    gameState3D.isPaused = true;
    clearInterval(gameState3D.timerInterval);
    
    if (isVictory) {
        showNotification('🎉 Победа! Ферма спасена от зомби-проклятия!', 'success');
        // Дополнительные очки за оставшееся время
        const timeBonus = Math.floor(gameState3D.timeLeft / 10);
        gameState3D.score += timeBonus;
        if (timeBonus > 0) {
            showNotification(`⏱️ Бонус за время: +${timeBonus} очков`, 'success');
        }
    } else {
        showNotification('💀 Игра окончена. Попробуйте еще раз!', 'error');
    }
    
    update3DUI();
    
    // Возврат в главное меню через 5 секунд
    setTimeout(() => {
        showMainMenu3D();
    }, 5000);
}

// ===== АНИМАЦИЯ =====
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState3D.isPaused) {
        // Движение игрока
        updatePlayerMovement();
        
        // Проверка взаимодействий
        checkInteractions();
        
        // Обновление камеры (следование за игроком)
        updateCamera();
        
        // Анимация интерактивных объектов
        animateInteractiveObjects();
    }
    
    renderer.render(scene, camera);
}

function updatePlayerMovement() {
    if (keys.forward) movePlayer('forward');
    if (keys.backward) movePlayer('backward');
    if (keys.left) movePlayer('left');
    if (keys.right) movePlayer('right');
}

function updateCamera() {
    // Камера следует за игроком с небольшим отступом
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10;
    camera.position.y = 8; // Фиксированная высота
    
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
}

function animateInteractiveObjects() {
    const time = Date.now() * 0.001;
    
    interactiveObjects.forEach(obj => {
        // Плавное парящее движение для collectible объектов
        if (obj.userData.type === 'collectible') {
            obj.position.y = obj.userData.originalY + Math.sin(time + obj.position.x) * 0.1;
            obj.rotation.y = time * 0.5;
        }
        
        // Мерцание для infected объектов
        if (obj.userData.type === 'interactive' && obj.material.emissive) {
            const intensity = 0.3 + Math.sin(time * 2) * 0.2;
            obj.material.emissive.setHex(0x330000 + Math.floor(intensity * 0xCC0000));
        }
    });
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
    resetGameState();
}

function start3DGame() {
    showScreen3D('game-container');
    gameState3D.isGameActive = true;
    gameState3D.isPaused = false;
    start3DTimer();
    
    // Перезагрузка первого этапа
    load3DStage(1);
}

function resetGameState() {
    gameState3D = {
        currentStage: 1,
        score: 0,
        timeLeft: CONFIG_3D.INITIAL_TIME,
        lives: CONFIG_3D.MAX_LIVES,
        playerPosition: { x: 0, y: 0, z: 10 },
        collectedItems: [],
        isGameActive: false,
        timerInterval: null,
        isPaused: false
    };
    
    // Сброс позиции игрока
    if (player) {
        player.position.set(0, 0.9, 10);
    }
    
    update3DUI();
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function playSound(soundName) {
    // Базовая реализация звуковой системы
    try {
        const soundElement = document.getElementById(`3d-${soundName}-sound`);
        if (soundElement) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => {
                console.log('Автовоспроизведение звука заблокировано:', e);
            });
        }
    } catch (error) {
        console.log('Ошибка воспроизведения звука:', error);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ИГРЫ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Инициализация 3D игры Зомби-Ферма...");
    
    // Проверка поддержки WebGL
    if (!isWebGLSupported()) {
        showWebGLError();
        return;
    }
    
    // Инициализация Telegram Web App
    initTelegramIntegration();
    
    // Симуляция загрузки
    simulate3DLoading();
    
    // Настройка обработчиков меню
    document.getElementById('start-3d-game').addEventListener('click', start3DGame);
    document.getElementById('how-to-play-3d').addEventListener('click', showHowToPlay);
    document.getElementById('achievements-3d').addEventListener('click', showAchievements);
});

function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

function showWebGLError() {
    const loadingScreen = document.getElementById('loading-3d');
    loadingScreen.innerHTML = `
        <div class="error-container">
            <h2>❌ WebGL не поддерживается</h2>
            <p>Ваш браузер не поддерживает WebGL, необходимый для 3D игры.</p>
            <p>Пожалуйста, обновите браузер или используйте другое устройство.</p>
            <button onclick="location.reload()">Обновить страницу</button>
        </div>
    `;
    loadingScreen.classList.add('active');
}

function initTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Инициализация
        tg.ready();
        tg.expand();
        
        // Настройка темы
        const theme = tg.themeParams;
        if (theme.bg_color) {
            document.documentElement.style.setProperty('--dark-3d', theme.bg_color);
        }
        
        console.log('Telegram Web App инициализирован');
    } else {
        console.log('Запуск вне Telegram - используем стандартный режим');
    }
}

function simulate3DLoading() {
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
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
    }, 300);
}

function showHowToPlay() {
    showDialog('Управление в игре', `
        <strong>🎮 Управление:</strong>
        <br>• Кнопки на экране или WASD - движение
        <br>• Кнопка ⚡ или Пробел - взаимодействие
        <br>• 💡 - подсказка для текущего этапа
        <br>• ⏸️ - пауза
        <br><br>
        <strong>🎯 Цель игры:</strong>
        <br>Пройти 13 этапов, решая головоломки и находя коды.
        <br>Спасите ферму от зомби-проклятия!
    `, null);
}

function showAchievements() {
    showDialog('Достижения', `
        В разработке...
        <br>Система достижений будет добавлена в следующем обновлении!
    `, null);
}

// Глобальный экспорт для отладки
window.gameState3D = gameState3D;
window.stages = stages;

console.log("🎮 3D игра Зомби-Ферма инициализирована!");
