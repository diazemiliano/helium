const fs = require('fs-extra');
const path = require('path');

const getFilePaths = async (dir, filePaths = []) => {
  const newFilePaths = filePaths;
  const contents = await fs.readdir(dir);

  for (const content of contents) {
    const filePath = path.join(dir, content);
    const stat = await fs.stat(filePath);

    if (stat.isFile()) {
      newFilePaths.push(filePath);
    } else {
      await getFilePaths(filePath, newFilePaths);
    }
  }

  return newFilePaths;
};

const filePathIsValid = filePath => {
  return (
    filePath.endsWith('.js') ||
    filePath.endsWith('.jsx') ||
    filePath.endsWith('.ts') ||
    filePath.endsWith('.tsx')
  );
};

module.exports = { getFilePaths, filePathIsValid };
