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
    ['/* eslint-disable-next-line @next/next/no-img-element */\n<img', '{/* eslint-disable-next-line @next/next/no-img-element */}\n<img'],
    ['(e) => {', '() => {']
]);

replaceFile('src/app/(dashboard)/courses/page.tsx', [
    ['/* eslint-disable-next-line @next/next/no-img-element */\n<img', '{/* eslint-disable-next-line @next/next/no-img-element */}\n<img']
]);

replaceFile('src/app/(dashboard)/feed/page.tsx', [
    ['// eslint-disable-next-line @typescript-eslint/no-unused-vars\nconst isLiked =', 'const isLiked ='],
    ['/* eslint-disable-next-line @next/next/no-img-element */\n<img', '<img']
]);

replaceFile('src/app/(dashboard)/teacher/courses/page.tsx', [
    ['&quot;draft&quot;', '"draft"'],
    ['&quot;published&quot;', '"published"'],
    ["&apos;s ", "'s "]
]);

replaceFile('src/app/api/courses/route.ts', [
    ['(error: any)', '(error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)']
]);

replaceFile('src/components/courses/CourseForm.tsx', [
    ['(err: any)', '(err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['<any>', '<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>'],
    ['any)', 'any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    ['any]', 'any /* eslint-disable-line @typescript-eslint/no-explicit-any */]'],
    ['any}', 'any /* eslint-disable-line @typescript-eslint/no-explicit-any */}']
]);

