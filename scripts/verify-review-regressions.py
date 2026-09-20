"""Temporarily reintroduce each reviewed defect; restore exact source bytes in finally.

Run from the repository root after pnpm install. Do not run alongside other builds.
Requires Python 3 and the repository's browser test dependencies.
"""
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
PNPM = "pnpm.cmd" if os.name == "nt" else "pnpm"
BASELINE = "2719a6baa6b2986a7bdaade7751470a17106ed2d"
results = []

def replace(old, new):
    def transform(source):
        assert old in source, old
        return source.replace(old, new)
    return transform

def original_initialization(source):
    original = subprocess.check_output(["git", "show", f"{BASELINE}:apps/docs/src/catalog/shared.ts"], text=True, encoding="utf-8")
    pattern = r'function initialization\(plugin: PluginName\): string \{.*?\n\}'
    old = re.search(pattern, original, re.S).group()
    return re.sub(pattern, lambda _: old, source, flags=re.S)

def numeric_pages(source):
    start = source.index('      else if (Number(action)) {')
    end = source.index('\n    });', start)
    return source[:start] + '      else if (Number(action)) button.setAttribute("aria-current", Number(action) === this.tableState.page ? "page" : "false");' + source[end:]

def single_rating(source):
    return re.sub(r'  <input class="sr-only" id="nyx-rating-[1-4]"[^\n]+\n  <label[^\n]+\n', '', source)

def no_focus(source):
    return source.replace('  const active = element.ownerDocument.activeElement;', '  return;\n  const active = element.ownerDocument.activeElement;').replace('  if (element.contains(element.ownerDocument.activeElement)) focusElement(destination);', '  void element; void destination;')

cases = [
    ('progress-layout', 'packages/core/src/components.css', replace('.nyx-progress-bar { display: block;', '.nyx-progress-bar {'), 'progress renders'),
    ('rating-scale', 'registry/components/media.html', single_rating, 'rating offers'),
    ('rating-selection', 'packages/core/src/components.css', replace('input:checked + label, .nyx-rating label:has', 'input:checked ~ label, .nyx-rating label:has'), 'rating offers'),
    ('numeric-pages', 'packages/plugins/src/data-table.ts', numeric_pages, 'table numeric'),
    ('focus-succession', 'packages/plugins/src/internal/focus.ts', no_focus, 'queue actions|dismissal preserves position|attachment removal|regenerated tags'),
    ('scoped-themes', 'packages/core/src/tokens.css', replace('\n[data-nyx-theme=', '\n:root[data-nyx-theme='), 'nested themes'),
    ('accent-utility', 'packages/core/src/tokens.css', replace('--color-nyx-accent: var(--nyx-accent);', '--color-nyx-accent: #f5d90a;'), 'accent utilities'),
    ('initialization-copy', 'apps/docs/src/catalog/shared.ts', original_initialization, 'initialization alternatives'),
    ('font-installation', 'apps/docs/src/catalog/guides.ts', lambda source: re.sub(r'      \$\{prose\("Load the font"[^\n]+\n', '', source), 'installation includes'),
    ('notification-naming', 'packages/plugins/src/notification-center.ts', replace('toggle.removeAttribute("aria-pressed");', 'toggle.setAttribute("aria-pressed", String(read));'), 'read actions name'),
    ('notification-timing', 'packages/plugins/src/notification-center.ts', replace('    animateRemoval(notification, () => {\n      this.sync();\n      dispatchNyxEvent(this.element, "nyx:notification-center:dismiss", detail);\n    });', '    animateRemoval(notification);\n    dispatchNyxEvent(this.element, "nyx:notification-center:dismiss", detail);'), 'event observes'),
]

def build():
    subprocess.run([PNPM, '--filter', '@nyx-ui/plugins', 'build'], check=True, capture_output=True)

try:
    for name, filename, transform, pattern in cases:
        path = Path(filename)
        original = path.read_bytes()
        try:
            source = original.decode('utf-8').replace('\r\n', '\n')
            mutated = transform(source)
            assert mutated != source, f'{name}: mutation had no effect'
            path.write_text(mutated, encoding='utf-8')
            if filename.startswith('packages/plugins'): build()
            run = subprocess.run([PNPM, 'exec', 'playwright', 'test', 'tests/browser/release-review.spec.ts', '-g', pattern, '--workers=2'], capture_output=True, text=True, encoding='utf-8', errors='replace')
            output = run.stdout + run.stderr
            assertions = re.findall(r'Error: (?:expect[^\n]*|.*Expected[^\n]*)', output)
            caught = run.returncode != 0 and bool(assertions) and 'failed' in output
            results.append({'mutation': name, 'file': filename, 'test': pattern, 'exitCode': run.returncode, 'caughtByAssertion': caught, 'assertions': assertions})
            print(f'{name}: {"CAUGHT" if caught else "NOT CAUGHT"}', flush=True)
            assert caught, output
        finally:
            path.write_bytes(original)
            if filename.startswith('packages/plugins'): build()
finally:
    Path('review/release-mutation-audit.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
