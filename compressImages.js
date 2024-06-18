const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFolderPath = './assets/img'; // Path to the input image folder
const outputFolderPath = './dist/img'; // Path to the output compressed image folder

// Ensure the output folder exists, if not, create it
if (!fs.existsSync(outputFolderPath)) {
  fs.mkdirSync(outputFolderPath, { recursive: true });
}

// Function to compress images in the input folder
function compressImages() {
  fs.readdir(inputFolderPath, (err, files) => {
    if (err) {
      console.error('Error reading input folder:', err);
      return;
    }

    files.forEach((file) => {
      const inputFilePath = path.join(inputFolderPath, file);
      const outputFilePath = path.join(outputFolderPath, file);

      // Detect file extension to determine the output format
      const fileExtension = path.extname(file).toLowerCase();

      // Supported image formats: jpeg, png, gif, svg
      let imageProcessor = sharp(inputFilePath);

      if (fileExtension === '.jpeg' || fileExtension === '.jpg') {
        imageProcessor = imageProcessor.jpeg({ quality: 80 });
      } else if (fileExtension === '.png') {
        imageProcessor = imageProcessor.png({ compressionLevel: 8 });
      } else if (fileExtension === '.gif') {
        imageProcessor = imageProcessor.gif({ quality: 80 });
      } else if (fileExtension === '.svg') {
        // For SVG files, simply copy to the output folder without processing
        fs.copyFile(inputFilePath, outputFilePath, (err) => {
          if (err) {
            console.error(`Error copying ${file}:`, err);
          } else {
            console.log(`Successfully copied ${file}`);
          }
        });
        return; // Skip processing for SVG files
      } else {
        console.warn(`Skipping compression for unsupported file: ${file}`);
        return;
      }

      imageProcessor.toFile(outputFilePath, (err) => {
        if (err) {
          console.error(`Error compressing ${file}:`, err);
        } else {
          console.log(`Successfully compressed ${file}`);
        }
      });
    });
  });
}

// Run the function to compress images
compressImages();
