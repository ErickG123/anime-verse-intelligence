import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const modeArg = process.argv.find((a) => a.startsWith('--mode='))?.split('=')[1] ?? 'all';

function getRepoFiles() {
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' })
    .split(/\r?\n/)
    .filter(Boolean);
  const untracked = execSync('git ls-files --others --exclude-standard', {
    cwd: ROOT,
    encoding: 'utf-8',
  })
    .split(/\r?\n/)
    .filter(Boolean);
  return Array.from(new Set([...tracked, ...untracked])).sort();
}

async function validateDocs(files) {
  const mdFiles = files.filter((f) => f.endsWith('.md'));
  const brokenLinks = [];
  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const relPath of mdFiles) {
    const absPath = path.join(ROOT, relPath);
    let content = '';
    try {
      content = await fs.readFile(absPath, 'utf-8');
    } catch {
      continue;
    }

    const dir = path.dirname(absPath);
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const rawTarget = match[1]?.trim() ?? '';
      if (
        !rawTarget ||
        rawTarget.startsWith('http://') ||
        rawTarget.startsWith('https://') ||
        rawTarget.startsWith('mailto:') ||
        rawTarget.startsWith('#') ||
        rawTarget.startsWith('file://')
      ) {
        continue;
      }
      const cleanTarget = rawTarget.split('#')[0]?.split('?')[0] ?? '';
      if (!cleanTarget) continue;
      const resolved = path.resolve(dir, cleanTarget);
      try {
        await fs.access(resolved);
      } catch {
        brokenLinks.push({ file: relPath, target: rawTarget });
      }
    }
  }

  // Validate Agent Skills YAML frontmatter
  const skillFiles = files.filter((f) => f.startsWith('.agents/skills/') && f.endsWith('/SKILL.md'));
  const invalidSkills = [];
  for (const skillFile of skillFiles) {
    const content = await fs.readFile(path.join(ROOT, skillFile), 'utf-8');
    const hasFrontmatter = content.startsWith('---\n') || content.startsWith('---\r\n');
    const hasName = /^name:\s+\S+/m.test(content);
    const hasDesc = /^description:\s+\S+/m.test(content);
    if (!hasFrontmatter || !hasName || !hasDesc) {
      invalidSkills.push(skillFile);
    }
  }

  console.log(
    JSON.stringify(
      {
        check: 'docs',
        markdownFiles: mdFiles.length,
        skillsValidated: skillFiles.length,
        invalidSkills,
        brokenLinksCount: brokenLinks.length,
        brokenLinksSample: brokenLinks.slice(0, 15),
      },
      null,
      2,
    ),
  );

  if (invalidSkills.length > 0) {
    process.exitCode = 1;
  }
}

async function validateRepo(files) {
  const forbiddenTracked = files.filter(
    (f) =>
      f === '.env' ||
      f.startsWith('node_modules/') ||
      f.includes('/dist/') ||
      f.endsWith('.dump'),
  );
  const migrations = files.filter((f) => f.startsWith('apps/api/drizzle/') && f.endsWith('.sql'));

  console.log(
    JSON.stringify(
      {
        check: 'repo',
        totalFiles: files.length,
        forbiddenTracked,
        migrationsCount: migrations.length,
        migrations,
      },
      null,
      2,
    ),
  );

  if (forbiddenTracked.length > 0 || migrations.length < 3) {
    process.exitCode = 1;
  }
}

async function validateArch(files) {
  const required = [
    'AGENTS.md',
    'GEMINI.md',
    'eslint.config.mjs',
    'tooling/eslint-plugin-animeverse.mjs',
    'docs/ROADMAP.md',
    'docs/testing/TEST-MATRIX.md',
  ];
  const missing = [];
  for (const req of required) {
    try {
      await fs.access(path.join(ROOT, req));
    } catch {
      missing.push(req);
    }
  }

  const featureDirs = new Set(
    files
      .filter((f) => f.startsWith('apps/web/src/app/features/'))
      .map((f) => f.split('/')[5])
      .filter(Boolean),
  );

  console.log(
    JSON.stringify(
      {
        check: 'architecture',
        missingCanonicalFiles: missing,
        webFeatures: Array.from(featureDirs).sort(),
      },
      null,
      2,
    ),
  );

  if (missing.length > 0) {
    process.exitCode = 1;
  }
}

const files = getRepoFiles();
if (modeArg === 'docs' || modeArg === 'all') await validateDocs(files);
if (modeArg === 'repo' || modeArg === 'all') await validateRepo(files);
if (modeArg === 'arch' || modeArg === 'all') await validateArch(files);
