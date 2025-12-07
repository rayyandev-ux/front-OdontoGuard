// Outlines for 100x100 viewBox
export const TOOTH_OUTLINES = {
  incisor: "M28,22 Q50,12 72,22 Q82,46 78,82 Q50,94 22,82 Q18,46 28,22 Z",
  canine: "M24,30 Q50,8 76,30 Q86,58 70,90 Q50,100 30,90 Q14,58 24,30 Z",
  premolar: "M18,26 Q50,8 82,26 Q92,50 82,76 Q50,94 18,76 Q8,50 18,26 Z",
  molar: "M14,22 Q50,4 86,22 Q98,50 86,82 Q50,98 14,82 Q2,50 14,22 Z"
};

export const getToothType = (id) => {
  const n = parseInt(id);
  // Standard ISO numbering
  // 1-8 per quadrant. 1=Central Incisor, 8=Third Molar
  const toothNum = n % 10; 
  
  if (toothNum >= 1 && toothNum <= 2) return 'incisor';
  if (toothNum === 3) return 'canine';
  if (toothNum >= 4 && toothNum <= 5) return 'premolar';
  if (toothNum >= 6 && toothNum <= 8) return 'molar';
  
  // Deciduous: 1-5. 1=Central, 5=Second Molar
  if (toothNum >= 1 && toothNum <= 2) return 'incisor';
  if (toothNum === 3) return 'canine';
  if (toothNum >= 4 && toothNum <= 5) return 'molar';
  
  return 'molar';
};

export const getRootsFor = (type, isUpper) => {
  if (type === 'molar') return isUpper ? 3 : 2;
  if (type === 'premolar') return isUpper ? 2 : 1;
  return 1;
};

export const getToothName = (id) => {
  const n = parseInt(id);
  const unit = n % 10;
  const quadrant = Math.floor(n / 10);
  const isChild = quadrant >= 5;
  const mapAdult = {
    1: 'Incisivo central',
    2: 'Incisivo lateral',
    3: 'Canino',
    4: 'Primer premolar',
    5: 'Segundo premolar',
    6: 'Primer molar',
    7: 'Segundo molar',
    8: 'Tercer molar'
  };
  const mapChild = {
    1: 'Incisivo central',
    2: 'Incisivo lateral',
    3: 'Canino',
    4: 'Primer molar',
    5: 'Segundo molar'
  };
  const base = (isChild ? mapChild : mapAdult)[unit] || 'Molar';
  return isChild ? `${base} (niño)` : base;
};
