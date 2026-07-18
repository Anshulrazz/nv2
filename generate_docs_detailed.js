const fs = require('fs');

const text = fs.readFileSync('api_dump.txt', 'utf-8');
const parts = text.split(/===\s+(src\/app\/api\/.*?\/route\.ts)\s+===/);

let markdown = '# Notexia API Documentation (Detailed)\n\nThis document outlines the available REST API endpoints for the Notexia backend, including request and response details.\n\n';

const endpoints = {};

for (let i = 1; i < parts.length; i += 2) {
  const file = parts[i];
  const content = parts[i + 1];
  
  let endpointPath = file.replace('src/app', '').replace('/route.ts', '');
  if (endpointPath.endsWith('/') && endpointPath.length > 1) endpointPath = endpointPath.slice(0, -1);
  
  if (!endpoints[endpointPath]) endpoints[endpointPath] = {};
  
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  methods.forEach(method => {
    // Find method block
    const methodRegex = new RegExp(`export\\s+(?:async\\s+)?(?:const|function)\\s+${method}\\s*=\\s*(?:auth\\()?async\\s+function\\s+${method}\\s*\\(.*?\\)\\s*{([\\s\\S]*?)^\\}\\)?;?`, 'gm');
    const methodRegex2 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(.*?\\)\\s*{([\\s\\S]*?)^\\}`, 'gm');

    let match = methodRegex.exec(content) || methodRegex2.exec(content);

    if (match) {
      const bodyStr = match[1];
      const details = { params: [], bodyParams: [], responses: [] };
      
      const searchParamsMatches = [...bodyStr.matchAll(/searchParams\.get\("([^"]+)"\)/g)];
      details.params = searchParamsMatches.map(m => m[1]);
      
      const jsonDestructureMatch = bodyStr.match(/const\s+{([^}]+)}\s*=\s*(?:await\s+req\.json\(\)|body)/);
      if (jsonDestructureMatch) {
         details.bodyParams = jsonDestructureMatch[1].split(',').map(s => s.trim().split(':')[0].trim()).filter(s => s && !s.startsWith('//'));
      } else {
         const directAssign = [...bodyStr.matchAll(/const\s+([a-zA-Z0-9_]+)\s*=\s*await\s+req\.json\(\)/g)];
         if (directAssign.length > 0) {
            // let's look for destructuring from body
            const destructure2 = bodyStr.match(/const\s+{([^}]+)}\s*=\s*body/);
            if (destructure2) {
                details.bodyParams = destructure2[1].split(',').map(s => s.trim().split(':')[0].trim()).filter(s => s && !s.startsWith('//'));
            } else {
                details.bodyParams.push('JSON Payload Object');
            }
         }
      }
      
      if (bodyStr.includes('.safeParse(body)')) {
          details.bodyParams.push('(Validated via Zod Schema)');
      }

      const resMatches = [...bodyStr.matchAll(/NextResponse\.json\(([\s\S]*?)\)/g)];
      resMatches.forEach(m => {
          let res = m[1].trim();
          if (res.startsWith('{') && res.endsWith('}')) {
              const keys = res.match(/([a-zA-Z0-9_]+):/g);
              if (keys) details.responses.push(`Object { ${keys.map(k => k.replace(':','')).join(', ')} }`);
              else details.responses.push(res.split('\n')[0].substring(0, 50) + '...');
          } else {
              details.responses.push(res.split(',')[0].trim());
          }
      });
      
      endpoints[endpointPath][method] = details;
    } else if (content.includes(`export const ${method}`) || content.includes(`export async function ${method}`)) {
      endpoints[endpointPath][method] = { params: [], bodyParams: [], responses: ['(Dynamic response)'] };
    }
  });
}

const grouped = {};
for (const endpoint in endpoints) {
  const group = endpoint.split('/')[2] || 'core';
  if (!grouped[group]) grouped[group] = [];
  grouped[group].push({ path: endpoint, methods: endpoints[endpoint] });
}

for (const group in grouped) {
  markdown += `## ${group.charAt(0).toUpperCase() + group.slice(1)} Endpoints\n\n`;
  for (const { path, methods } of grouped[group]) {
    markdown += `### \`${path}\`\n\n`;
    for (const method in methods) {
      markdown += `#### ${method}\n\n`;
      const data = methods[method];
      
      const pathParams = [...path.matchAll(/\[(.*?)\]/g)].map(m => m[1]);
      if (pathParams.length > 0) {
        markdown += `**Path Parameters:**\n`;
        pathParams.forEach(p => markdown += `- \`${p}\` (Required)\n`);
        markdown += `\n`;
      }
      
      if (data.params && data.params.length > 0) {
        markdown += `**Query Parameters:**\n`;
        data.params.forEach(p => markdown += `- \`${p}\`\n`);
        markdown += `\n`;
      }
      
      if (data.bodyParams && data.bodyParams.length > 0) {
        markdown += `**Request Body:**\n`;
        data.bodyParams.forEach(p => markdown += `- \`${p}\`\n`);
        markdown += `\n`;
      } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        markdown += `**Request Body:** (Required payload)\n\n`;
      }
      
      if (data.responses && data.responses.length > 0) {
        const uniqueRes = [...new Set(data.responses)];
        markdown += `**Responses:**\n`;
        uniqueRes.forEach(r => markdown += `- \`${r.replace(/\n/g, '')}\`\n`);
        markdown += `\n`;
      } else {
        markdown += `**Responses:**\n- Standard JSON Response\n\n`;
      }
    }
  }
}

fs.writeFileSync('API_DOCS_DETAILED.md', markdown);
console.log('Detailed API docs generated');
