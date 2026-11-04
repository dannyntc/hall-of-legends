const characterRoster = [
  {
    id: 'zoro',
    name: 'Roronoa Zoro',
    epithet: 'The Swordsman',
    series: 'ONE PIECE',
    image: 'public/assets/zoro.png',
    quote: 'When the world shoves you around, you just gotta stand up and shove back.',
    attribution: 'Roronoa Zoro',
    sourceUrl: 'https://www.azquotes.com/quote/893997',
    sourceLabel: 'One Piece · attributed line',
    color: '#cbbf89',
    left: '13%',
    bottom: '12%',
    size: '24%',
    zIndex: 4,
    focusLabel: 'Focus on Roronoa Zoro, the swordsman of the Straw Hat crew',
  },
  {
    id: 'naruto',
    name: 'Naruto Uzumaki',
    epithet: 'The Unbroken',
    series: 'NARUTO',
    image: 'public/assets/naruto.png',
    quote: 'All the effort is pointless if you don’t believe in yourself!',
    attribution: 'Naruto Uzumaki',
    sourceUrl: 'https://en.wikiquote.org/wiki/Naruto',
    sourceLabel: 'Naruto · episode quotation',
    color: '#e5a13d',
    left: '28%',
    bottom: '10%',
    size: '25%',
    zIndex: 5,
    focusLabel: 'Focus on Naruto Uzumaki, the unbroken shinobi',
  },
  {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    epithet: 'The Free Soul',
    series: 'ONE PIECE',
    image: 'public/assets/luffy.png',
    quote: 'I don’t want to conquer anything. It’s the person who has the most freedom on the sea!',
    attribution: 'Monkey D. Luffy',
    sourceUrl: 'https://quotegeek.com/anime/one-piece-anime/i-don-t-want-to-conquer-anything-i-just/',
    sourceLabel: 'One Piece · chapter 507',
    color: '#e1784e',
    left: '51%',
    bottom: '9%',
    size: '25%',
    zIndex: 5,
    focusLabel: 'Focus on Monkey D. Luffy, captain of the Straw Hat crew',
  },
  {
    id: 'bell',
    name: 'Bell Cranel',
    epithet: 'The White Rabbit',
    series: 'DANMACHI',
    image: 'public/assets/bell.png',
    quote: 'I want to become a hero!',
    attribution: 'Bell Cranel',
    sourceUrl: 'https://danfull.bushiroad.com/en/character/bell-cranel/',
    sourceLabel: 'DanMachi · official character profile',
    color: '#b9d6df',
    left: '72%',
    bottom: '12%',
    size: '22%',
    zIndex: 4,
    focusLabel: 'Focus on Bell Cranel, the white rabbit who dreams of becoming a hero',
  },
];

function getCharacterById(id) {
  return characterRoster.find((character) => character.id === id);
}

function getFocusLabel(character) {
  return character?.focusLabel ?? 'Focus on a legend';
}

globalThis.HallOfLegendsScene = Object.freeze({
  characterRoster,
  getCharacterById,
  getFocusLabel,
});
