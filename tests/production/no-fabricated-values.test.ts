import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'tests') {
        getSourceFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe('Zero Fabricated Values Scanner Test Suite', () => {
  const rootDir = process.cwd();
  const targetDirs = [
    path.join(rootDir, 'app'),
    path.join(rootDir, 'components'),
    path.join(rootDir, 'hooks'),
  ];

  const forbiddenPatterns = [
    /'0\.800 ETH'/,
    /"0\.800 ETH"/,
    /totalVolumeEth:\s*'48\.50'/,
    /1\.25\s*\+\s*\(idx\s*\*\s*0\.4\)/,
  ];

  it('verifies no fabricated placeholder values exist in application frontend code', () => {
    const allFiles: string[] = [];
    for (const d of targetDirs) {
      if (fs.existsSync(d)) {
        getSourceFiles(d, allFiles);
      }
    }

    const violations: { file: string; pattern: string }[] = [];

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          violations.push({
            file: path.relative(rootDir, filePath),
            pattern: pattern.toString(),
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
