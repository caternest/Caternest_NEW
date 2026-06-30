const { execSync } = require('child_process');
try {
    execSync('git checkout src/pages/Orders.tsx');
    console.log('Successfully reverted Orders.tsx to clean state.');
} catch (err) {
    console.error('Failed to revert Orders.tsx:', err.message);
}
