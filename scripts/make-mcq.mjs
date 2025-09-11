import fs from 'fs/promises';

const filePath = new URL('../challenges.json', import.meta.url);

// Pools for plausible distractors by category
const pools = {
  capitals: ['Lyon','Marseille','Nice','Lille','Bordeaux','Toulouse','Rome','Milan','Venice','Naples','Tokyo','Osaka','Kyoto','Beijing','Shanghai','Seoul','Busan','Madrid','Barcelona','Valencia','Lisbon','Porto','Athens','Thessaloniki','Cairo','Alexandria','Istanbul','Ankara','Dubai','Abu Dhabi','Prague','Brno','Bratislava','Zagreb','Ljubljana','Budapest','Warsaw','Krakow','Riga','Vilnius','Tallinn','Helsinki','Oslo','Stockholm'],
  dishes: ['Paella','Tapas','Gazpacho','Churros','Sushi','Ramen','Tempura','Tacos','Burrito','Enchiladas','Tandoori','Biryani','Samosa','Pho','Bún chả','Tagine','Couscous','Baklava','Kunafa','Hummus','Falafel','Asado','Empanadas'],
  landmarks: ['Eiffel Tower','St. Basil\'s Cathedral','Big Ben','CN Tower','Taj Mahal','Machu Picchu','Uluru (Ayers Rock)','Statue of Liberty','Christ the Redeemer','Pyramids of Giza','Sagrada Familia','Sydney Opera House','Matterhorn','Blue Lagoon','Hagia Sophia','Great Wall of China'],
  instruments: ['Guitar','Violin','Accordion','Oboe','Ngoni','Kora','Djembe','Tabla','Sitar','Piano','Tin whistle','Bagpipes','Marimba'],
  animals: ['Kangaroo','Koala','Panda','Lemur','Lynx','Moose','Beaver','Polar Bear','Elephant','Tiger','Lion','Giraffe'],
  festivals: ['Diwali','Holi','Eid','Vesak','Carnival','Oktoberfest','Día de Muertos','Sinulog','Holi','Tihar'],
  artists: ['Van Gogh','Beethoven','Mozart','Michelangelo','Da Vinci','Raphael','Rembrandt'],
  musicGenres: ['K-Pop','J-Pop','Reggae','Salsa','Samba','Hip-Hop','Merengue'],
  generic: ['Option A','Option B','Option C','Option D','Another option','None of the above']
};

function pickFromPool(poolName, exclude = [], n = 3) {
  const pool = pools[poolName] || pools.generic;
  const choices = pool.filter(x => !exclude.includes(x));
  const out = [];
  for (let i = 0; i < n && choices.length > 0; i++) {
    const idx = Math.floor(Math.random() * choices.length);
    out.push(choices.splice(idx, 1)[0]);
  }
  return out;
}

function generateChoices(item) {
  const correct = item.correct_answer;
  const lower = (correct || '').toString().toLowerCase();
  let choices = null;

  // Heuristics by keywords in title or correct answer
  if (/capital|city|capital city|capital of/i.test(item.title) || /city/i.test(item.description) || /capital/i.test(item.description)) {
    choices = [correct, ...pickFromPool('capitals', [correct], 3)];
  } else if (/dish|food|cuisine|dessert|eat|taste|dish|meal|pastry|cookie|cake/i.test(item.title) || /dish|food|pastry|dessert/i.test(item.description)) {
    choices = [correct, ...pickFromPool('dishes', [correct], 3)];
  } else if (/identify|landmark|cathedral|tower|monument|statue|temple|bridge|waterfall|relic|site/i.test(item.title) || /identify|landmark/i.test(item.description)) {
    choices = [correct, ...pickFromPool('landmarks', [correct], 3)];
  } else if (/instrument|drum|guitar|piano|violin|music|song|genre|dance/i.test(item.title) || /instrument|music/i.test(item.description)) {
    choices = [correct, ...pickFromPool('instruments', [correct], 3)];
  } else if (/animal|primate|bear|dog|cat|kangaroo|lemur/i.test(item.title) || /animal/i.test(item.description)) {
    choices = [correct, ...pickFromPool('animals', [correct], 3)];
  } else if (/festival|holiday|carnival|festival of lights/i.test(item.title) || /festival/i.test(item.description)) {
    choices = [correct, ...pickFromPool('festivals', [correct], 3)];
  } else if (/artist|painter|composer|who painted|who wrote/i.test(item.title) || /painter|composer/i.test(item.description)) {
    choices = [correct, ...pickFromPool('artists', [correct], 3)];
  } else if (/genre|music|pop|k-pop|kpop/i.test(item.title) || /genre/i.test(item.description)) {
    choices = [correct, ...pickFromPool('musicGenres', [correct], 3)];
  } else if (Array.isArray(item.options?.choices) && item.options.choices.length >= 2) {
    return item.options.choices; // already fine
  } else {
    // Fallback: try to create plausible distractors by using generic pool and short transformations
    const base = correct || 'Option';
    const transformed = pickFromPool('generic', [], 3).map((g, i) => `${g}`);
    choices = [correct, ...transformed];
  }

  // Ensure uniqueness and limit to 4 choices
  const unique = Array.from(new Set(choices)).slice(0, 4);
  // If we ended up with less than 2 choices, fallback to generic pool
  while (unique.length < 2) {
    unique.push(...pickFromPool('generic', unique, 1));
  }
  return unique;
}

(async () => {
  const raw = await fs.readFile(filePath, 'utf8');
  const items = JSON.parse(raw);
  let changed = 0;

  const normalized = items.map((it) => {
    const copy = { ...it };
    const hasChoices = copy.options && Array.isArray(copy.options.choices) && copy.options.choices.length >= 2;
    if (!hasChoices) {
      copy.options = { choices: generateChoices(copy) };
      changed++;
    } else {
      // Ensure the correct answer is included and first
      const opts = copy.options.choices;
      if (!opts.includes(copy.correct_answer)) {
        opts.unshift(copy.correct_answer);
      }
      copy.options.choices = Array.from(new Set(opts)).slice(0, 4);
    }
    return copy;
  });

  await fs.writeFile(filePath, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
  console.log(`Updated ${changed} items to MCQ format in challenges.json`);
})();
