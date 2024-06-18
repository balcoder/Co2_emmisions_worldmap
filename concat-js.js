const fs = require('fs').promises; // Use the promise-based fs module
const path = require('path');
const { glob } = require('glob');

const directoryPath = path.join(__dirname, 'assets/js');
const outputPath = path.join(__dirname, 'assets/main.js');

async function concatFiles() {
  try {
    // Use glob to get all .js files in the directory
    const files = await glob(`${directoryPath}/*.js`);

    let content = '';

    for (const file of files) {
      const fileContent = await fs.readFile(file, 'utf8');
      content += fileContent + '\n';
    }

    await fs.writeFile(outputPath, content, 'utf8');
    console.log('JavaScript files concatenated successfully!');
  } catch (err) {
    console.error('Error occurred while processing files:', err);
  }
}

// Execute the concatFiles function
concatFiles();
