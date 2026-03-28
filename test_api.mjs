import { readFileSync } from 'fs';

const filePath = "C:\\Jonah\\rcm-doc-intelligence\\corpus\\cms_forms\\cms1500_0000.pdf";;
const fileBytes = readFileSync(filePath);

const formData = new FormData();
const blob = new Blob([fileBytes], { type: 'application/pdf' });
formData.append('file', blob, '00064657.pdf');
formData.append('mode', 'intelligence');

console.log('Sending request...');

const response = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(JSON.stringify(result, null, 2));