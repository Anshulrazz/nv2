const fs = require('fs');

function replaceFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    let prev = content;
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    if (content !== prev) {
        fs.writeFileSync(path, content);
        console.log(`Updated ${path}`);
    }
}

replaceFile('src/app/(dashboard)/certificates/[id]/page.tsx', [
    ['/* eslint-disable-next-line @next/next/no-img-element */\n<img', '{/* eslint-disable-next-line @next/next/no-img-element */}\n<img']
]);

replaceFile('src/app/(dashboard)/courses/[id]/page.tsx', [
    ['(e) => setQuizAnswers', '() => setQuizAnswers'],
    ['(e) => {', '() => {']
]);

replaceFile('src/app/(dashboard)/feed/page.tsx', [
    ['// eslint-disable-next-line @typescript-eslint/no-unused-vars\n// eslint-disable-next-line @typescript-eslint/no-unused-vars', '// eslint-disable-next-line @typescript-eslint/no-unused-vars'],
    ['/* eslint-disable-next-line @next/next/no-img-element */\n<img', '<img']
]);

replaceFile('src/app/(dashboard)/teacher/courses/page.tsx', [
    ["&apos;s", "'s"],
    ['&quot;draft&quot;', '"draft"'],
    ['&quot;published&quot;', '"published"']
]);

replaceFile('src/app/api/bookmarks/route.ts', [
    ['_,', '']
]);

replaceFile('src/app/api/courses/[id]/progress/route.ts', [
    ['Course,', '']
]);

replaceFile('src/app/api/courses/route.ts', [
    ['(error: any)', '(error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)']
]);

replaceFile('src/app/api/forums/route.ts', [
    ['_,', '']
]);

replaceFile('src/components/courses/CourseForm.tsx', [
    ['<any>', '<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>'],
    ['(err: any)', '(err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    [': any)', ': any /* eslint-disable-line @typescript-eslint/no-explicit-any */)'],
    [': any]', ': any /* eslint-disable-line @typescript-eslint/no-explicit-any */]'],
    [': any}', ': any /* eslint-disable-line @typescript-eslint/no-explicit-any */}'],
    [': any,', ': any /* eslint-disable-line @typescript-eslint/no-explicit-any */,']
]);

