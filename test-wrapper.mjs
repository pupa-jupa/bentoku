import { spawn } from 'child_process';

const runTests = () => {
  return new Promise((resolve, reject) => {
    const pnpmTest = spawn('pnpm', ['test'], { stdio: 'inherit' });

    pnpmTest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with code ${code}`));
      }
    });
  });
};

const run = async () => {
  let success = false;
  for(let i=0; i<3; i++) {
    try {
      console.log(`Running tests, attempt ${i+1}...`);
      await runTests();
      success = true;
      break;
    } catch(e) {
      console.log(e.message);
    }
  }
  if (!success) {
    process.exit(1);
  }
}
run();
