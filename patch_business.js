import fs from 'fs';

const filePath = './src/pages/MyBusinesses.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = "setBusinesses(updated.filter((r: any) => r.userId === user?.id && r.status !== 'Deleted'));";
const replacement = "setBusinesses(updated.filter((r: any) => (r.userId === user?.id || (r.email && r.email.toLowerCase() === user?.email?.toLowerCase())) && r.status !== 'Deleted'));";

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully patched MyBusinesses.tsx!");
} else {
  console.log("Could not find target in MyBusinesses.tsx");
}
