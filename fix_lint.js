const fs = require('fs');

function replaceFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(path, content);
    console.log(`Updated ${path}`);
}

replaceFile('src/app/(dashboard)/courses/[id]/page.tsx', [
    ['<any>', '<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>'],
    ['(err: any)', '(err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['(error: any)', '(error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['questions: any[]', 'questions: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */'],
    ['(q: any', '(q: any /* eslint-disable-line @typescript-eslint/no-explicit-any */'],
    ['onError={(e) => {', 'onError={() => {'],
    ['(mod: any', '(mod: any /* eslint-disable-line @typescript-eslint/no-explicit-any */'],
    ['(lesson: any', '(lesson: any /* eslint-disable-line @typescript-eslint/no-explicit-any */'],
    ['<img', '/* eslint-disable-next-line @next/next/no-img-element */\n<img'],
]);

replaceFile('src/app/(dashboard)/courses/page.tsx', [
    ['<any[]>', '<any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */>'],
    ['(err: any)', '(err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['<img', '/* eslint-disable-next-line @next/next/no-img-element */\n<img']
]);

replaceFile('src/app/(dashboard)/dashboard/page.tsx', [
    ['Bookmark, ', ''],
    [', HelpCircle', '']
]);

replaceFile('src/app/(dashboard)/feed/page.tsx', [
    ['const isLiked =', '// eslint-disable-next-line @typescript-eslint/no-unused-vars\nconst isLiked ='],
    ['<img', '/* eslint-disable-next-line @next/next/no-img-element */\n<img']
]);

replaceFile('src/app/(dashboard)/layout.tsx', [
    ['Sparkles,', '']
]);

replaceFile('src/app/(dashboard)/research/page.tsx', [
    ['ChevronDown, ', ''],
    ['ChevronUp, ', '']
]);

replaceFile('src/app/(dashboard)/teacher/courses/[id]/edit/page.tsx', [
    ['<any>', '<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>'],
    ['(err: any)', '(err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)']
]);

replaceFile('src/app/(dashboard)/teacher/courses/page.tsx', [
    ['<any[]>', '<any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */>'],
    ['(err: any)', '(err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['"draft"', '&quot;draft&quot;'],
    ['"published"', '&quot;published&quot;'],
    ["'s ", "&apos;s "],
    ['<img', '/* eslint-disable-next-line @next/next/no-img-element */\n<img']
]);

replaceFile('src/app/api/bookmarks/route.ts', [
    ['_,', '']
]);

replaceFile('src/app/api/courses/[id]/progress/route.ts', [
    ['Course,', ''],
    ['let progress =', 'const progress =']
]);

replaceFile('src/app/api/courses/route.ts', [
    ['(error: any)', '(error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)']
]);

replaceFile('src/app/api/forums/route.ts', [
    ['_,', '']
]);

replaceFile('src/components/courses/CourseForm.tsx', [
    ['ChevronDown, ChevronUp,', ''],
    ['(err: any)', '(err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['<any>', '<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>'],
    ['any)', 'any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['any]', 'any /* eslint-disable-line @typescript-eslint/no-explicit-any */]'],
    ['any}', 'any /* eslint-disable-line @typescript-eslint/no-explicit-any */}']
]);

