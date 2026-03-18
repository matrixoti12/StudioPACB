// Script robusto para convertir archivos .js de cancionero
// Usa vm.runInNewContext para evaluar el JS de forma segura
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { runInNewContext } from 'vm';

const SOURCE_DIR = 'C:\\Users\\German Rauda\\Downloads\\Proyektor - 64Bits\\Canciones Locales';
const OUT_DIR = './src/data/cancioneros';

const files = [
    { file: 'Canciones.js',                       key: 'canciones',     label: 'Canciones Generales' },
    { file: 'Corario IPUC castilla.js',            key: 'ipuc',          label: 'Corario IPUC Castilla' },
    { file: 'Himnario Lluvias de Bendicion.js',    key: 'himnario',      label: 'Himnario Lluvias de Bendición' },
    { file: 'Infantiles.js',                       key: 'infantiles',    label: 'Infantiles' },
    { file: 'Manantial de Inspiracion.js',         key: 'manantial',     label: 'Manantial de Inspiración' },
    { file: 'Mi Cancionero.js',                    key: 'micancionero',  label: 'Mi Cancionero' },
];

mkdirSync(OUT_DIR, { recursive: true });

const index = [];

for (const { file, key, label } of files) {
    try {
        const raw = readFileSync(join(SOURCE_DIR, file), 'utf-8');
        
        // Evaluar el JS en sandbox seguro
        const sandbox = {};
        runInNewContext(raw, sandbox);
        
        // Buscar la variable array (puede llamarse jscanciones, jscoros, etc.)
        const arr = Object.values(sandbox).find(v => Array.isArray(v));
        if (!arr) { console.warn(`SKIP: ${file} — no se encontró array`); continue; }

        const songs = arr
            .filter(c => c.ti && String(c.ti).trim().length > 1 && c.le && String(c.le).trim().length > 10)
            .map((c, i) => ({
                id: `${key}_${i}`,
                titulo: String(c.ti).trim(),
                letra: String(c.le).trim()
            }));

        const outPath = join(OUT_DIR, `${key}.json`);
        writeFileSync(outPath, JSON.stringify(songs), 'utf-8');
        index.push({ key, label, count: songs.length });
        console.log(`✅ ${label}: ${songs.length} canciones`);
    } catch (e) {
        console.error(`❌ Error en ${file}: ${e.message}`);
    }
}

// Escribir el índice
writeFileSync(
    join(OUT_DIR, 'catalogIndex.json'),
    JSON.stringify(index, null, 2),
    'utf-8'
);
console.log(`\n📚 Índice generado con ${index.length} cancioneros.`);
