const fs = require('fs');
const file = './src/pages/Orders.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
for (let i = 1335; i < 1350; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
