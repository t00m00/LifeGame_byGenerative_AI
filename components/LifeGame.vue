<template>
  <div class="life-game-container">
    <div class="controls-section">
      <div class="main-controls">
        <button @click="startGame" :disabled="isRunning">スタート</button>
        <button @click="stopGame" :disabled="!isRunning">停止</button>
        <button @click="resetGame">リセット</button>
        <button @click="randomizeGrid">ランダム</button>
        <div class="speed-control">
          <label>速度: </label>
          <input type="range" min="50" max="1000" step="50" v-model="speed" />
          <span>{{ speed }}ms</span>
        </div>
      </div>
      
      <div class="advanced-controls">
        <div class="grid-size-control">
          <label>グリッドサイズ:</label>
          <div class="size-inputs">
            <div>
              <label>行: </label>
              <input type="number" v-model.number="newRows" min="5" max="50" />
            </div>
            <div>
              <label>列: </label>
              <input type="number" v-model.number="newCols" min="5" max="80" />
            </div>
            <button @click="updateGridSize" :disabled="isRunning">適用</button>
          </div>
        </div>
        
        <div class="color-picker">
          <label>セルの色: </label>
          <input type="color" v-model="cellColor" />
        </div>
      </div>
      
      <div class="patterns-section">
        <h3>パターン:</h3>
        <div class="patterns-grid">
          <div 
            v-for="(pattern, index) in patterns" 
            :key="index" 
            class="pattern-item"
            @click="applyPattern(pattern)"
            :title="pattern.name"
          >
            <div class="pattern-name">{{ pattern.name }}</div>
            <div class="pattern-preview"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid-container">
      <div 
        class="grid" 
        :style="{ 
          gridTemplateColumns: `repeat(${cols}, 20px)`,
          gridTemplateRows: `repeat(${rows}, 20px)`
        }"
      >
        <div 
          v-for="(cell, index) in grid" 
          :key="index" 
          class="cell" 
          :class="{ alive: cell }"
          :style="cell ? { backgroundColor: cellColor } : {}"
          @click="toggleCell(index)"
        ></div>
      </div>
    </div>
    
    <div class="generation">世代: {{ generation }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';

// Grid configuration
const rows = ref(25);
const cols = ref(40);
const totalCells = ref(rows.value * cols.value);

// Grid size control
const newRows = ref(rows.value);
const newCols = ref(cols.value);

// Game state
const grid = ref(Array(totalCells.value).fill(false));
const isRunning = ref(false);
const generation = ref(0);
const speed = ref(200); // milliseconds between generations
const cellColor = ref('#333333'); // Default cell color
let gameInterval = null;

// Pattern library
const patterns = [
  {
    name: 'グライダー',
    pattern: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1]
    ],
    width: 3,
    height: 3
  },
  {
    name: 'ブリンカー',
    pattern: [
      [1, 1, 1]
    ],
    width: 3,
    height: 1
  },
  {
    name: 'ブロック',
    pattern: [
      [1, 1],
      [1, 1]
    ],
    width: 2,
    height: 2
  },
  {
    name: 'ビーコン',
    pattern: [
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 1, 1]
    ],
    width: 4,
    height: 4
  },
  {
    name: 'グライダーガン',
    pattern: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    width: 36,
    height: 9
  },
  {
    name: 'パルサー',
    pattern: [
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0]
    ],
    width: 13,
    height: 13
  }
];


// Game logic
const startGame = () => {
  if (!isRunning.value) {
    isRunning.value = true;
    gameInterval = setInterval(nextGeneration, speed.value);
  }
};

const stopGame = () => {
  if (isRunning.value) {
    isRunning.value = false;
    clearInterval(gameInterval);
  }
};

const resetGame = () => {
  stopGame();
  grid.value = Array(totalCells.value).fill(false);
  generation.value = 0;
};

const randomizeGrid = () => {
  stopGame();
  grid.value = Array(totalCells.value).fill(false).map(() => Math.random() > 0.7);
  generation.value = 0;
};

const toggleCell = (index) => {
  if (!isRunning.value) {
    grid.value[index] = !grid.value[index];
  }
};

// Update grid size
const updateGridSize = () => {
  if (isRunning.value) return;
  
  // Update grid dimensions
  rows.value = newRows.value;
  cols.value = newCols.value;
  totalCells.value = rows.value * cols.value;
  
  // Reset the grid with new dimensions
  resetGame();
};

// Apply a pattern to the grid
const applyPattern = (pattern) => {
  if (isRunning.value) return;
  
  // Stop the game and reset the grid
  stopGame();
  resetGame();
  
  // Calculate the center position to place the pattern
  const centerRow = Math.floor(rows.value / 2) - Math.floor(pattern.height / 2);
  const centerCol = Math.floor(cols.value / 2) - Math.floor(pattern.width / 2);
  
  // Place the pattern on the grid
  for (let r = 0; r < pattern.height; r++) {
    for (let c = 0; c < pattern.width; c++) {
      const gridRow = centerRow + r;
      const gridCol = centerCol + c;
      
      // Check if the position is within the grid bounds
      if (gridRow >= 0 && gridRow < rows.value && gridCol >= 0 && gridCol < cols.value) {
        const gridIndex = gridRow * cols.value + gridCol;
        const patternValue = pattern.pattern[r][c];
        
        if (patternValue === 1) {
          grid.value[gridIndex] = true;
        }
      }
    }
  }
};

// Watch for speed changes
watch(speed, (newSpeed) => {
  if (isRunning.value) {
    clearInterval(gameInterval);
    gameInterval = setInterval(nextGeneration, newSpeed);
  }
});

// Calculate next generation based on Conway's Game of Life rules
const nextGeneration = () => {
  const newGrid = [...grid.value];
  
  for (let i = 0; i < totalCells.value; i++) {
    const row = Math.floor(i / cols.value);
    const col = i % cols.value;
    
    // Count live neighbors
    let neighbors = 0;
    
    // Check all 8 surrounding cells
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue; // Skip self
        
        const newRow = row + r;
        const newCol = col + c;
        
        // Check if neighbor is within bounds
        if (newRow >= 0 && newRow < rows.value && newCol >= 0 && newCol < cols.value) {
          const neighborIndex = newRow * cols.value + newCol;
          if (grid.value[neighborIndex]) {
            neighbors++;
          }
        }
      }
    }
    
    // Apply Conway's Game of Life rules
    // 1. Any live cell with fewer than two live neighbors dies (underpopulation)
    // 2. Any live cell with two or three live neighbors lives on
    // 3. Any live cell with more than three live neighbors dies (overpopulation)
    // 4. Any dead cell with exactly three live neighbors becomes a live cell (reproduction)
    
    if (grid.value[i]) {
      // Cell is alive
      newGrid[i] = neighbors === 2 || neighbors === 3;
    } else {
      // Cell is dead
      newGrid[i] = neighbors === 3;
    }
  }
  
  grid.value = newGrid;
  generation.value++;
};

// Clean up interval when component is unmounted
onBeforeUnmount(() => {
  if (gameInterval) {
    clearInterval(gameInterval);
  }
});
</script>

<style scoped>
.life-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px auto;
  max-width: 1000px;
  font-family: 'Arial', sans-serif;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
  width: 100%;
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.advanced-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 10px;
  background-color: #eef2f5;
  border-radius: 6px;
}

.grid-size-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.size-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}

.size-inputs input[type="number"] {
  width: 60px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.patterns-section {
  margin-top: 10px;
}

.patterns-section h3 {
  margin: 0 0 10px 0;
  text-align: center;
  font-size: 16px;
}

.patterns-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.pattern-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100px;
}

.pattern-item:hover {
  background-color: #e9f5e9;
}

.pattern-name {
  font-size: 12px;
  margin-bottom: 5px;
  text-align: center;
}

.pattern-preview {
  width: 40px;
  height: 40px;
  background-color: #eee;
  border: 1px solid #ccc;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speed-control input[type="range"] {
  width: 150px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker input[type="color"] {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.grid-container {
  border: 1px solid #ccc;
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: auto;
  max-width: 100%;
}

.grid {
  display: grid;
  gap: 1px;
}

.cell {
  width: 20px;
  height: 20px;
  background-color: #fff;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.1s;
}

.cell.alive {
  background-color: #333;
}

.generation {
  margin-top: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
</style>
