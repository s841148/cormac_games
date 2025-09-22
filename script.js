document.addEventListener('DOMContentLoaded', () => {
    // 取得所有 HTML 元素
    const player1Grid = document.getElementById('player1-grid');
    const player2Grid = document.getElementById('player2-grid');
    const statusDisplay = document.getElementById('status-display');
    const player1BoardContainer = document.getElementById('player1-board-container');
    const player2BoardContainer = document.getElementById('player2-board-container');
    const restartButton = document.getElementById('restart-button');

    // 遊戲常數與變數
    const BOARD_SIZE = 10;
    const shipTypes = [
        { name: '航空母艦', length: 5 },
        { name: '巡洋艦', length: 4 },
        { name: '驅逐艦', length: 3 },
        { name: '潛艇', length: 2 }
    ];
    
    let player1Board = [];
    let player2Board = [];
    
    let player1ShipsToPlace = [...shipTypes];
    let player2ShipsToPlace = [...shipTypes];
    
    let isPlayer1Turn = true;
    let isPlacementPhase = true;
    let player1SunkShips = [];
    let player2SunkShips = [];
    
    let isVertical = false;

    // 遊戲初始化入口
    initGame();
    restartButton.addEventListener('click', resetGame);
    document.addEventListener('keydown', handleKeydown);
    
    // 監聽滑鼠在棋盤上的移動
    player1Grid.addEventListener('mousemove', handlePlacementHover);
    player2Grid.addEventListener('mousemove', handlePlacementHover);
    player1Grid.addEventListener('mouseleave', clearPlacementHover);
    player2Grid.addEventListener('mouseleave', clearPlacementHover);

    function resetGame() {
        // 重設所有遊戲變數
        player1Board = createBoardData();
        player2Board = createBoardData();
        player1ShipsToPlace = [...shipTypes];
        player2ShipsToPlace = [...shipTypes];
        isPlayer1Turn = true;
        isPlacementPhase = true;
        player1SunkShips = [];
        player2SunkShips = [];
        isVertical = false;

        // 隱藏重新開始按鈕
        restartButton.classList.add('hidden');

        // 顯示玩家 1 棋盤，隱藏玩家 2 棋盤
        player1BoardContainer.classList.add('active-board');
        player1BoardContainer.classList.remove('hidden-board');
        player2BoardContainer.classList.add('hidden-board');
        player2BoardContainer.classList.remove('active-board');
        
        // 移除舊的事件監聽器並重新渲染
        player1Grid.removeEventListener('click', handleClick);
        player2Grid.removeEventListener('click', handleClick);
        player1Grid.addEventListener('click', handleClick);
        player2Grid.addEventListener('click', handleClick);

        // 重新繪製棋盤，佈局階段只顯示當前玩家的船
        renderGrid(player1Grid, player1Board, 'player1', true);
        renderGrid(player2Grid, player2Board, 'player2', false);
        statusDisplay.textContent = `玩家 1，請放置你的${player1ShipsToPlace[0].name}！按下 "R" 鍵切換方向。`;
    }

    function initGame() {
        resetGame();
    }
    
    function createBoardData() {
        return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    }

    function renderGrid(gridElement, boardData, playerClass, showShips) {
        gridElement.innerHTML = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (showShips && boardData[row][col]) {
                    cell.classList.add(`${playerClass}-ship`);
                }

                gridElement.appendChild(cell);
            }
        }
    }
    
    function handleKeydown(event) {
        if (!isPlacementPhase) return;
        if (event.key.toUpperCase() === 'R') {
            isVertical = !isVertical;
            const orientation = isVertical ? '直向' : '橫向';
            statusDisplay.textContent = `方向已切換為：${orientation}`;
            
            // 觸發一次滑鼠移動事件來更新預覽
            const currentGrid = isPlayer1Turn ? player1Grid : player2Grid;
            const mouseEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true });
            currentGrid.dispatchEvent(mouseEvent);
        }
    }

    function handlePlacementHover(event) {
        if (!isPlacementPhase) return;

        const currentGrid = isPlayer1Turn ? player1Grid : player2Grid;
        const shipsToPlace = isPlayer1Turn ? player1ShipsToPlace : player2ShipsToPlace;

        if (event.currentTarget.id !== currentGrid.id || shipsToPlace.length === 0) return;
        
        clearPlacementHover();
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);

        if (isNaN(row) || isNaN(col)) return;

        const currentShip = shipsToPlace[0];
        const shipLength = currentShip.length;
        
        let isValid = true;
        if (isVertical) {
            if (row + shipLength > BOARD_SIZE) isValid = false;
        } else {
            if (col + shipLength > BOARD_SIZE) isValid = false;
        }

        const cellsToHighlight = [];
        for (let i = 0; i < shipLength; i++) {
            let targetCell;
            if (isVertical) {
                targetCell = document.querySelector(`#${currentGrid.id} div[data-row="${row + i}"][data-col="${col}"]`);
            } else {
                targetCell = document.querySelector(`#${currentGrid.id} div[data-row="${row}"][data-col="${col + i}"]`);
            }
            if (targetCell) {
                cellsToHighlight.push(targetCell);
            }
        }
        
        cellsToHighlight.forEach(cell => {
            if (isValid) {
                cell.classList.add('placement-hover');
            } else {
                cell.classList.add('placement-invalid');
            }
        });
    }

    function clearPlacementHover() {
        const allCells = document.querySelectorAll('.grid-container > div');
        allCells.forEach(cell => {
            cell.classList.remove('placement-hover', 'placement-invalid');
        });
    }

    function handleClick(event) {
        if (!event.target.dataset.row) {
            return;
        }
        
        if (isPlacementPhase) {
            handlePlacement(event);
        } else {
            handleAttack(event);
        }
    }

    function handlePlacement(event) {
        const clickedGrid = event.currentTarget;
        
        const isCorrectGrid = (isPlayer1Turn && clickedGrid.id === 'player1-grid') || 
                              (!isPlayer1Turn && clickedGrid.id === 'player2-grid');
        if (!isCorrectGrid) {
            statusDisplay.textContent = '請在你的棋盤上放置船艦！';
            return;
        }
        
        const shipsToPlace = isPlayer1Turn ? player1ShipsToPlace : player2ShipsToPlace;
        if (shipsToPlace.length === 0) {
            return; // 該玩家已完成佈局
        }

        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const board = isPlayer1Turn ? player1Board : player2Board;
        const currentShip = shipsToPlace[0];

        // 檢查船隻是否超出邊界
        let isOutOfBounds = false;
        if (isVertical) {
            if (row + currentShip.length > BOARD_SIZE) isOutOfBounds = true;
        } else {
            if (col + currentShip.length > BOARD_SIZE) isOutOfBounds = true;
        }
        if (isOutOfBounds) {
            statusDisplay.textContent = '船隻超出邊界，請重新點選！';
            return;
        }

        // 檢查船隻是否重疊
        let isOverlapping = false;
        for (let i = 0; i < currentShip.length; i++) {
            if (isVertical) {
                if (board[row + i][col]) {
                    isOverlapping = true;
                    break;
                }
            } else {
                if (board[row][col + i]) {
                    isOverlapping = true;
                    break;
                }
            }
        }
        if (isOverlapping) {
            statusDisplay.textContent = '船隻不能重疊，請重新點選！';
            return;
        }

        // 在棋盤資料中放置船隻
        for (let i = 0; i < currentShip.length; i++) {
            if (isVertical) {
                board[row + i][col] = currentShip.name;
            } else {
                board[row][col + i] = currentShip.name;
            }
        }
        
        shipsToPlace.shift(); // 移除已放置的船艦
        clearPlacementHover();
        
        // 重新繪製當前玩家的棋盤
        const currentPlayerGrid = isPlayer1Turn ? player1Grid : player2Grid;
        const currentPlayerClass = isPlayer1Turn ? 'player1' : 'player2';
        renderGrid(currentPlayerGrid, board, currentPlayerClass, true);

        if (player1ShipsToPlace.length === 0 && player2ShipsToPlace.length === 0) {
            // 兩位玩家都已佈局完成，進入攻擊階段
            isPlacementPhase = false;
            isPlayer1Turn = true;
            
            player1BoardContainer.classList.add('active-board');
            player1BoardContainer.classList.remove('hidden-board');
            player2BoardContainer.classList.add('active-board');
            player2BoardContainer.classList.remove('hidden-board');
            
            renderGrid(player1Grid, player1Board, 'player1', false);
            renderGrid(player2Grid, player2Board, 'player2', false);
            
            statusDisplay.textContent = '艦隊佈局完成！玩家 1，請攻擊！';
        } else if (player1ShipsToPlace.length === 0) {
            // 玩家 1 完成佈局，換玩家 2
            isPlayer1Turn = false;
            statusDisplay.textContent = `玩家 2，請放置你的${player2ShipsToPlace[0].name}！按下 "R" 鍵切換方向。`;
            
            player1BoardContainer.classList.add('hidden-board');
            player1BoardContainer.classList.remove('active-board');
            player2BoardContainer.classList.add('active-board');
            player2BoardContainer.classList.remove('hidden-board');
        } else {
            // 玩家 1 繼續佈局
            statusDisplay.textContent = `玩家 1，請放置你的${player1ShipsToPlace[0].name}！按下 "R" 鍵切換方向。`;
        }
    }
    
    function handleAttack(event) {
        const clickedGrid = event.currentTarget;
        const opponentGridId = isPlayer1Turn ? 'player2-grid' : 'player1-grid';
        
        if (clickedGrid.id !== opponentGridId) {
            statusDisplay.textContent = '請點擊對手的棋盤進行攻擊！';
            return;
        }

        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const opponentBoard = isPlayer1Turn ? player2Board : player1Board;
        const cell = event.target;
        
        if (cell.classList.contains('hit') || cell.classList.contains('miss')) {
            statusDisplay.textContent = '這個位置你已經攻擊過了！';
            return;
        }
        
        const shipName = opponentBoard[row][col];
        if (shipName) {
            cell.classList.add('hit');
            statusDisplay.textContent = '擊中了！';
            
            // 檢查是否擊沉船隻
            let isSunk = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (opponentBoard[r][c] === shipName) {
                        const cellToCheck = document.querySelector(`#${opponentGridId} div[data-row="${r}"][data-col="${c}"]`);
                        if (!cellToCheck.classList.contains('hit')) {
                            isSunk = false;
                            break;
                        }
                    }
                }
                if (!isSunk) break;
            }

            if (isSunk) {
                const sunkShips = isPlayer1Turn ? player2SunkShips : player1SunkShips;
                sunkShips.push(shipName);
                statusDisplay.textContent = `擊沉了對方的${shipName}！`;
            }

        } else {
            cell.classList.add('miss');
            statusDisplay.textContent = '未命中...';
        }

        checkWinCondition();

        if (!restartButton.classList.contains('hidden')) {
            return;
        }
        
        isPlayer1Turn = !isPlayer1Turn;
        const player = isPlayer1Turn ? 1 : 2;
        statusDisplay.textContent += ` 輪到玩家 ${player} 攻擊了。`;
    }

    function checkWinCondition() {
        if (player1SunkShips.length === shipTypes.length) {
            statusDisplay.textContent = '玩家 2 獲勝！你擊沉了對方所有船艦！';
            endGame();
        } else if (player2SunkShips.length === shipTypes.length) {
            statusDisplay.textContent = '玩家 1 獲勝！你擊沉了對方所有船艦！';
            endGame();
        }
    }

    function endGame() {
        // 移除所有點擊事件，結束遊戲
        player1Grid.removeEventListener('click', handleClick);
        player2Grid.removeEventListener('click', handleClick);

        // 顯示所有未被擊中的船隻
        revealRemainingShips(player1Grid, player1Board, 'player1');
        revealRemainingShips(player2Grid, player2Board, 'player2');

        restartButton.classList.remove('hidden'); // 顯示重新開始按鈕
    }

    function revealRemainingShips(gridElement, boardData, playerClass) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // 如果是船隻但還沒有被標記為命中，則顯示它
                if (boardData[row][col] && boardData[row][col] !== 'hit') {
                    const cell = gridElement.querySelector(`div[data-row="${row}"][data-col="${col}"]`);
                    if (cell && !cell.classList.contains('hit')) {
                        cell.classList.add(`${playerClass}-ship`);
                    }
                }
            }
        }
    }
});