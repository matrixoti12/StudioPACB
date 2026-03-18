const fs = require('fs');

fetch('https://bible.helloao.org/api/available_translations.json')
  .then(res => res.json())
  .then(data => {
    const spanish = data.translations.filter(t => t.language === 'spa');
    const results = spanish.map(s => ({id: s.id, name: s.name, shortName: s.shortName}));
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(console.error);
