import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

// `cn()` runs tailwind-merge: a consumer utility from the same group REPLACES
// the primitive's base utility instead of adding to it. Passing `relative`
// into DialogContent deletes its base `fixed`, so `top-1/2` offsets the
// dialog from its flow position and it renders at the bottom of the page
// (see dialog-scroll-contract.test.ts for the original regression).
//
// This scanner fails the build whenever any consumer passes a position,
// translate, or z-index utility into a portal-positioned primitive. If an
// override is ever genuinely needed, change the primitive itself instead.
const PORTAL_PRIMITIVES = [
  'DialogContent',
  'AlertDialogContent',
  'SheetContent',
  'PopoverContent',
  'SelectContent',
  'DropdownMenuContent',
  'TooltipContent',
] as const;

const TAG_PATTERN = new RegExp(String.raw`<(${PORTAL_PRIMITIVES.join('|')})\b([^>]*)>`, 'g');
const CLASSNAME_PATTERN = /className=({[^}]*}|"[^"]*")/;
const STRING_LITERAL_PATTERN = /["']([^"']*)["']/g;

const FORBIDDEN_GROUPS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  {
    label: 'position',
    pattern: /(?<![\w:-])(?:static|relative|absolute|fixed|sticky)(?=$|[\s"'])/,
  },
  { label: 'translate', pattern: /(?<![\w-])-?translate-/ },
  { label: 'z-index', pattern: /(?<![\w:-])z-\d+/ },
];

test('no consumer passes position/translate/z utilities into portal primitives', async () => {
  const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const violations: string[] = [];

  for (const file of await collectTsxFiles(srcRoot)) {
    const source = await readFile(file, 'utf8');

    for (const tagMatch of source.matchAll(TAG_PATTERN)) {
      const [, componentName, attrs] = tagMatch;
      const classNameMatch = attrs?.match(CLASSNAME_PATTERN);
      if (!classNameMatch) continue;

      for (const literal of classNameMatch[1].matchAll(STRING_LITERAL_PATTERN)) {
        for (const { label, pattern } of FORBIDDEN_GROUPS) {
          if (pattern.test(literal[1])) {
            const line = source.slice(0, tagMatch.index).split('\n').length;
            violations.push(
              `${path.relative(srcRoot, file)}:${line} <${componentName}> ` +
                `${label} utility in className "${literal[1]}" would clobber the base class via tailwind-merge`
            );
          }
        }
      }
    }
  }

  assert.deepEqual(violations, []);
});

async function collectTsxFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(root, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(entry.parentPath, entry.name);
    // The primitives may legitimately compose positioned classes internally.
    if (fullPath.includes(`${path.sep}components${path.sep}ui${path.sep}`)) continue;
    if (entry.isFile() && entry.name.endsWith('.tsx')) files.push(fullPath);
  }

  return files;
}
