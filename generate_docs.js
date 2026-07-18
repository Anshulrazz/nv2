const fs = require('fs');
const path = require('path');

function findRoutes(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findRoutes(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const routes = findRoutes('./src/app/api');
let markdown = '# Notexia API Documentation\n\n';
markdown += 'This document outlines the available REST API endpoints for the Notexia backend.\n\n';

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const routeGroups = {};

for (const route of routes) {
  const content = fs.readFileSync(route, 'utf-8');
  let endpoint = route.replace('src/app', '').replace('/route.ts', '').replace('/route.js', '');
  if (!endpoint) endpoint = '/';
  
  const availableMethods = methods.filter(m => content.includes(`export const ${m}`) || content.includes(`export async function ${m}`) || content.includes(`export function ${m}`));
  
  if (availableMethods.length > 0) {
    const group = endpoint.split('/')[2] || 'core';
    if (!routeGroups[group]) routeGroups[group] = [];
    routeGroups[group].push({ endpoint, availableMethods });
  }
}

for (const group in routeGroups) {
  markdown += `## ${group.charAt(0).toUpperCase() + group.slice(1)} Endpoints\n\n`;
  for (const info of routeGroups[group]) {
    markdown += `### \`${info.endpoint}\`\n\n`;
    markdown += `**Supported Methods:** ${info.availableMethods.map(m => `\`${m}\``).join(', ')}\n\n`;
    // Simple placeholder for params based on path
    const params = [...info.endpoint.matchAll(/\[(.*?)\]/g)].map(m => m[1]);
    if (params.length > 0) {
      markdown += `**Path Parameters:**\n`;
      for (const p of params) {
        let pClean = p.replace('...', '');
        markdown += `- \`${pClean}\`: (Required)\n`;
      }
      markdown += `\n`;
    }
  }
}

fs.writeFileSync('API_DOCS.md', markdown);
console.log('API_DOCS.md generated successfully');
