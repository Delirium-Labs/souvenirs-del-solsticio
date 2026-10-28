// Convierte el build de un solo archivo (dist-artifact/index.html) en la página que se publica como artifact:
// sin <html>/<head>/<body> propios, con three.js desde el CDN y el bundle como script clásico al final.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('dist-artifact/index.html', 'utf8');
const style = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const script = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => s.trim()).join('\n');
const body = src.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '').trim();

if (script.includes('</script')) throw new Error('El bundle contiene </script>; no se puede incrustar.');

const out = `<title>Souvenirs del Solsticio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap">
<style>
${style}
</style>
${body}
<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>
<script>
${script}
</script>
`;
writeFileSync('dist-artifact/souvenirs.html', out);
console.log('dist-artifact/souvenirs.html', (out.length / 1024).toFixed(1) + ' KB');
