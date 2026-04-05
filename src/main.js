import './style.css'

class MinHeap {
  constructor() {
    this.heap = [];
  }
  
  push(node) {
    this.heap.push(node);
    this.bubbleUp();
  }
  
  pop() {
    if (this.size() === 1) return this.heap.pop();
    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown();
    return top;
  }
  
  size() { return this.heap.length; }

  bubbleUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].distance >= this.heap[parentIndex].distance) break;
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  bubbleDown() {
    let index = 0;
    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let smallest = index;
      if (left < this.size() && this.heap[left].distance < this.heap[smallest].distance) smallest = left;
      if (right < this.size() && this.heap[right].distance < this.heap[smallest].distance) smallest = right;
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

// This captures all the <p> tags and spans exactly as you wrote them
const INITIAL_MESSAGE = document.getElementById('status-display').innerHTML;

const gridElement = document.getElementById('grid');
const ROWS = 20;
const COLS = 40;

const START_NODE_ROW = 10;
const START_NODE_COL = 5;
const END_NODE_ROW = 10;
const END_NODE_COL = 35;

let isDraggingStart = false;
let isDraggingEnd = false;

//keep track of where the start and end nodes are globally
let startNodeCoords = {row: 10, col: 5};
let endNodeCoords = {row: 10, col: 35};

let isMouseDown = false; // Tracks if you are currently clicking

// 1. Setup the grid columns
gridElement.style.gridTemplateColumns = `repeat(${COLS}, 25px)`;

// 2. Function to create the interactive grid
function createGrid() {
  /*creating 800 cells or nodes*/
  for (let row = 0; row < ROWS ; row++) {
    for(let col = 0; col < COLS; col++) {
      const node = document.createElement('div');
      node.classList.add('node');
      node.id = `node-${row}-${col}`;

      if(row == START_NODE_ROW && col == START_NODE_COL){
        node.classList.add('node-start');
      }
      else if(row == END_NODE_ROW && col == END_NODE_COL){
        node.classList.add('node-end');
      }

      // EVENT1: Start drawing when mouse is pressed down
      // Inside the for-loops of createGrid...

      node.addEventListener('mousedown', (e) => {
        e.preventDefault();
        
        if (node.classList.contains('node-start')) {
          isDraggingStart = true;
          updateStatus("Moving the <span class='text-start'>Start Point</span>...");
        } else if (node.classList.contains('node-end')) {
          isDraggingEnd = true;
          updateStatus("Moving the <span class='text-end'>End Destination</span>...");
        } else {
          isMouseDown = true;
          node.classList.toggle('node-wall');
          updateStatus("Drawing the walls...");
        }
      });

      node.addEventListener('mouseenter', () => {
        // Case 1: Dragging the Green Start Node
        if (isDraggingStart) {
          if (node.classList.contains('node-wall') || node.classList.contains('node-end')) return;
          
          // Remove start from previous location
          document.querySelector('.node-start').classList.remove('node-start');
          // Add to new location
          node.classList.add('node-start');
          const [_, r, c] = node.id.split('-').map(Number);
          startNodeCoords = { row: r, col: c };
        } 
        
        // Case 2: Dragging the Red End Node
        else if (isDraggingEnd) {
          if (node.classList.contains('node-wall') || node.classList.contains('node-start')) return;
          
          document.querySelector('.node-end').classList.remove('node-end');
          node.classList.add('node-end');
          const [_, r, c] = node.id.split('-').map(Number);
          endNodeCoords = { row: r, col: c };
        } 
        
        // Case 3: Drawing Walls
        else if (isMouseDown) {
          if (node.classList.contains('node-start') || node.classList.contains('node-end')) return;
          node.classList.add('node-wall');
        }
      });

      gridElement.appendChild(node);
    }
  }
}

// 3. EVENT: Stop drawing when mouse is released anywhere on screen
window.addEventListener('mouseup', () => {
  isMouseDown = false;
  isDraggingStart = false;
  isDraggingEnd = false;
});

createGrid();

async function startDijkstra() {
  const startNode = document.querySelector('.node-start');
  const endNode = document.querySelector('.node-end');
  
  const distances = {}; 
  const previousNodes = {}; // NEW: The "Breadcrumb" map
  const nodes = document.querySelectorAll('.node');
  
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previousNodes[node.id] = null; // Everyone starts with no parent
  });
  
  distances[startNode.id] = 0;
  const priorityQueue = new MinHeap();
  priorityQueue.push({ id: startNode.id, distance: 0 });

  let found = false;

  while (priorityQueue.size() > 0) {
    const { id: currentId } = priorityQueue.pop();
    const currentNode = document.getElementById(currentId);

    if (currentNode === endNode) {
      found = true;
      break; 
    }

    const [_, r, c] = currentId.split('-').map(Number);
    const neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];

    for (let [nr, nc] of neighbors) {
      const neighborId = `node-${nr}-${nc}`;
      const neighbor = document.getElementById(neighborId);

      if (neighbor && !neighbor.classList.contains('node-wall')) {
        const newDist = distances[currentId] + 1;

        if (newDist < distances[neighborId]) {
          distances[neighborId] = newDist;
          previousNodes[neighborId] = currentId; // RECORD: "I came from currentId"
          
          if (neighbor !== endNode) {
            neighbor.style.backgroundColor = '#60a5fa';
            await new Promise(r => setTimeout(r, 5));
          }
          priorityQueue.push({ id: neighborId, distance: newDist });
        }
      }
    }
  }

  // NEW: If we found the end, draw the yellow path!
  if (found) {
    await drawPath(previousNodes, endNode.id);
    
    // Final explanation for the user
    updateStatus(
      `The <span class="text-path">Yellow Path</span> represents the mathematically shortest distance found using Dijkstra's Algorithm.`, 
      '#fbbf24' // Yellow border
    );
  } else {
    // Failure explanation
    updateStatus(
      `No Path Found! The <span class="text-end">Destination</span> is completely isolated by walls. Clear the board to try again.`, 
      '#ef4444' // Red border
    );
  }
}

// NEW: This function follows the breadcrumbs back to the start
async function drawPath(previousNodes, endNodeId) {
  let current = previousNodes[endNodeId];
  while (current !== null) {
    const nodeElement = document.getElementById(current);
    if (nodeElement.classList.contains('node-start')) break;
    
    // VISUALS: Turn the path yellow
    nodeElement.style.backgroundColor = '#fbbf24'; 
    nodeElement.style.transition = 'transform 0.3s ease';
    nodeElement.style.transform = 'scale(1.1)';
    
    await new Promise(r => setTimeout(r, 30)); // Slow down to look cool
    current = previousNodes[current];
  }
}

// --- THE CONTROLS ---

// 1. Tell the Start Button to run our Dijkstra function when clicked
document.getElementById('start-btn').addEventListener('click', () => {
  // We call the function we wrote earlier
  updateStatus("Tracing the shortest path...");
  startDijkstra();
});

// 2. Tell the Clear Button to reset the board
document.getElementById('clear-btn').addEventListener('click', () => {
  const nodes = document.querySelectorAll('.node');
  
  nodes.forEach(node => {
    // Remove the wall color
    node.classList.remove('node-wall');
    
    // Reset the path/visited colors back to default (unless it's Start or End)
    if (!node.classList.contains('node-start') && !node.classList.contains('node-end')) {
      node.style.backgroundColor = '';
      node.style.transform = '';
    }
  });
  updateStatus(INITIAL_MESSAGE);
});

function updateStatus(message, borderHex = '#3b82f6') {
  const statusBox = document.getElementById('status-display');
  statusBox.innerHTML = message;
  statusBox.style.borderColor = borderHex;
}