import os
import re
from pathlib import Path
import shutil

def fix_open_encoding(pyfile):
    with open(pyfile, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    changed = False
    new_lines = []
    open_write_pattern = re.compile(
        r'open\(([^,]+),\s*["\']([wa][bt]?)(["\'][^)]*)?\)'
    )

    for line in lines:
        if ("open(" in line and
            (('"w"' in line or "'w'" in line or '"a"' in line or "'a'" in line)) and
            "encoding=" not in line):
            # Add encoding="utf-8" before the closing parenthesis
            newline = re.sub(r'(\))(\s*#?.*)$',
                             r', encoding="utf-8")\2',
                             line)
            new_lines.append(newline)
            changed = True
        else:
            new_lines.append(line)
    
    if changed:
        shutil.copy(pyfile, pyfile + ".bak")
        with open(pyfile, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Fixed: {pyfile} (backup created as .bak)")
    return changed

def main():
    root = Path('.')
    count = 0
    for pyfile in root.rglob('*.py'):
        if fix_open_encoding(str(pyfile)):
            count += 1
    print(f"Completed! {count} file(s) auto-fixed for encoding='utf-8'.")

if __name__ == "__main__":
    main()
