import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

let dataBuffer = fs.readFileSync('c:/Users/German Rauda/.gemini/antigravity/playground/ancient-feynman/Guía Técnica API Biblia RVR1960.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(function (error) {
    console.error(error);
});
