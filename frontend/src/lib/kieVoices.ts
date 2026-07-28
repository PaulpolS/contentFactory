// เสียงพากย์พรีเมียมจาก Kie.ai (ElevenLabs text-to-dialogue-v3)
// อ้างอิงลิสต์ทางการ docs.kie.ai/market/elevenlabs/text-to-dialogue-v3
// ฟังตัวอย่างเสียง: https://static.aiquickdraw.com/elevenlabs/voice/<voice_id>.mp3
export interface KieVoice {
  id: string;
  name: string;
  lang: string;
}

export const KIEAI_VOICES: KieVoice[] = [
  // สุภาพสตรี (Females)
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella (หญิง - มืออาชีพ สดใส อบอุ่น เหมาะกับเล่าเรื่อง/สารคดี)', lang: 'th-TH' },
  { id: 'Z3R5wn05IrDiVCyEkUrK', name: 'Arabella (หญิง - ลึกลับ มีอารมณ์ร่วม เหมาะกับเรื่องเล่าลี้ลับ/ดราม่า)', lang: 'th-TH' },
  { id: '5l5f8iK3YPeGga21rQIX', name: 'Adeline (หญิง - นุ่มนวล เป็นกันเอง เหมาะกับคลิปไลฟ์สไตล์)', lang: 'th-TH' },
  { id: 'BZgkqPqms7Kj9ulSkVzn', name: 'Eve (หญิง - สดใส มีพลัง ร่าเริง เหมาะกับคลิปสั้นสนุก)', lang: 'th-TH' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (หญิง - ขี้เล่น มีเอกลักษณ์ เหมาะกับคลิปสั้นวัยรุ่น)', lang: 'th-TH' },
  { id: 'kPzsL2i3teMYv0FxEYQ6', name: 'Brittney (หญิง - วัยรุ่น สนุก ทันสมัย เหมาะกับโซเชียลคอนเทนต์)', lang: 'th-TH' },
  { id: '6aDn1KB0hjpdcocrUkmq', name: 'Tiffany (หญิง - เป็นธรรมชาติ อบอุ่นน่าฟัง เหมาะกับคลิปทั่วไป)', lang: 'th-TH' },
  { id: '1wGbFxmAM3Fgw63G1zZJ', name: 'Allison (หญิง - สงบ ผ่อนคลาย เหมาะกับ ASMR/เล่าเรื่องก่อนนอน)', lang: 'th-TH' },
  { id: 'pPdl9cQBQq4p6mRkZy2Z', name: 'Emma (หญิง - น่ารัก สดใส เหมาะกับคลิปบันเทิง/ไลฟ์สไตล์)', lang: 'th-TH' },

  // สุภาพบุรุษ (Males)
  { id: 'EkK5I93UQWFDigLMpZcX', name: 'James (ชาย - เข้ม ทรงพลัง ดึงดูด เหมาะกับสารคดี/ประวัติศาสตร์)', lang: 'th-TH' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian (ชาย - ทุ้มลึก หนักแน่น อบอุ่น โทนข่าว/สารคดีระดับสากล)', lang: 'th-TH' },
  { id: 'LruHrtVF6PSyGItzMNHS', name: 'Benjamin (ชาย - ทุ้ม อบอุ่น สุขุม เหมาะกับคลิปพัฒนาตนเอง/ปรัชญา)', lang: 'th-TH' },
  { id: 'MJ0RnG71ty4LH3dvNfSd', name: 'Leon (ชาย - นุ่มลึก ผ่อนคลาย เหมาะกับเล่าเรื่องก่อนนอน/ธรรมะ)', lang: 'th-TH' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (ชาย - กระฉับกระเฉง ทันสมัย เหมาะกับแนวไอที/ข่าวสั้น)', lang: 'th-TH' },
  { id: 'nzeAacJi50IvxcyDnMXa', name: 'Marshal (ชาย - เป็นมิตร สนุก สไตล์อาจารย์เล่าเรื่อง เหมาะกับคลิปสอน/How-to)', lang: 'th-TH' },
  { id: 'qDuRKMlYmrm8trt5QyBn', name: 'Taksh (ชาย - เรียบ สุขุม จริงจัง เหมาะกับคลิปธุรกิจ/การเงิน)', lang: 'th-TH' },
  { id: '6F5Zhi321D3Oq7v1oNT4', name: 'Hank (ชาย - ทุ้มลึก นักเล่าเรื่อง เหมาะกับเรื่องยาว/พอดแคสต์)', lang: 'th-TH' },
];

export const DEFAULT_KIE_VOICE_ID = KIEAI_VOICES[0].id; // Bella
