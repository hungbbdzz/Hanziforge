// HanziForge — Bilingual Chinese-Vietnamese Contextual Sentence Engine (data/sentences_db.js)
// Provides curated HSK 1-6 & core radical sentences + dynamic compound-based sentence synthesis for all 9,574 characters

(function (root) {
  'use strict';

  const CURATED_SENTENCES = {
    "休": [
      { zh: "工作累了就躺在树下好好休息吧。", py: "Gōng zuò lèi le jiù tǎng zài shù xià hǎo hǎo xiū xi ba.", vi: "Làm việc mệt rồi thì hãy tựa dưới gốc cây nghỉ ngơi cho khỏe nhé." },
      { zh: "他计划下个月休假去旅行。", py: "Tā jì huà xià ge yuè xiū jià qù lǚ xíng.", vi: "Anh ấy dự định tháng sau nghỉ phép đi du lịch." },
      { zh: "爷爷退休以后每天都在公园散步。", py: "Yé ye tuì xiū yǐ hòu měi tiān dōu zài gōng yuán sàn bù.", vi: "Sau khi nghỉ hưu, ông nội ngày nào cũng đi dạo trong công viên." }
    ],
    "明": [
      { zh: "明天一定是个阳光明媚的好日子。", py: "Míng tiān yí dìng shì gè yáng guāng míng mèi de hǎo rì zi.", vi: "Ngày mai chắc chắn là một ngày nắng đẹp rực rỡ." },
      { zh: "听完老师的解释，我已经完全明白了。", py: "Tīng wán lǎo shī de jiě shì, wǒ yǐ jīng wán quán míng bai le.", vi: "Nghe xong lời giải thích của thầy giáo, tôi đã hoàn toàn hiểu rõ." },
      { zh: "举头望明月，低头思故乡。", py: "Jǔ tóu wàng míng yuè, dī tóu sī gù xiāng.", vi: "Ngẩng đầu nhìn trăng sáng, cúi đầu nhớ cố hương." }
    ],
    "林": [
      { zh: "清晨的树林里空气格外清新。", py: "Qīng chén de shù lín lǐ kōng qì gé wài qīng xīn.", vi: "Không khí trong rừng cây buổi sáng sớm vô cùng trong lành." },
      { zh: "小鸟在茂密的林间自由地歌唱。", py: "Xiǎo niǎo zài mào mì de lín jiān zì yóu de gē chàng.", vi: "Những chú chim nhỏ tự do ca hát giữa rừng cây rậm rạp." }
    ],
    "森": [
      { zh: "这片原始森林里栖息着许多珍稀动物。", py: "Zhè piàn yuán shǐ sēn lín lǐ qī xī zhe xǔ duō zhēn xī dòng wù.", vi: "Trong khu rừng nguyên sinh này có nhiều loài động vật quý hiếm sinh sống." },
      { zh: "保护森林就是保护人类自己的家园。", py: "Bǎo hù sēn lín jiù shì bǎo hù rén lèi zì jǐ de jiā yuán.", vi: "Bảo vệ rừng rậm chính là bảo vệ mái nhà chung của nhân loại." }
    ],
    "好": [
      { zh: "你好！很高兴在这里认识你。", py: "Nǐ hǎo! Hěn gāo xìng zài zhè lǐ rèn shi nǐ.", vi: "Xin chào! Rất vui được làm quen với bạn ở đây." },
      { zh: "每天坚持阅读是一个非常好的习惯。", py: "Měi tiān jiān chí yuè dú shì yí gè fēi cháng hǎo de xí guàn.", vi: "Kiên trì đọc sách mỗi ngày là một thói quen vô cùng tốt." }
    ],
    "安": [
      { zh: "祝你一路平安，早日凯旋归来。", py: "Zhù nǐ yí lù píng ān, zǎo rì kǎi xuán guī lái.", vi: "Chúc bạn thượng lộ bình an, sớm ngày trở về." },
      { zh: "图书馆里非常安静，大家都在认真看书。", py: "Tú shū guǎn lǐ fēi cháng ān jìng, dà jiā dōu zài rèn zhēn kàn shū.", vi: "Trong thư viện rất yên tĩnh, mọi người đều đang chăm chú đọc sách." }
    ],
    "字": [
      { zh: "每个汉字背后都有一个生动的故事。", py: "Měi gè Hàn zì bèi hòu dōu yǒu yí gè shēng dòng de gù shi.", vi: "Đằng sau mỗi chữ Hán đều ẩn chứa một câu chuyện sinh động." },
      { zh: "请问你的名字怎么写？", py: "Qǐng wèn nǐ de míng zi zěn me xiě?", vi: "Xin hỏi tên của bạn viết như thế nào?" }
    ],
    "男": [
      { zh: "那个热心帮助别人的男生是我同班同学。", py: "Nà ge rè xīn bāng zhù bié rén de nán shēng shì wǒ tóng bān tóng xué.", vi: "Bạn nam nhiệt tình giúp đỡ người khác kia là bạn cùng lớp của tôi." },
      { zh: "古代男子在田间出力耕作以养家糊口。", py: "Gǔ dài nán zǐ zài tián jiān chū lì gēng zuò yǐ yǎng jiā hú kǒu.", vi: "Đàn ông thời xưa bỏ sức cày cấy ngoài đồng ruộng để nuôi sống gia đình." }
    ],
    "看": [
      { zh: "他把手搭在眼睛上，向远方眺望看去。", py: "Tā bǎ shǒu dā zài yǎn jing shàng, xiàng yuǎn fāng tiào wàng kàn qù.", vi: "Anh ấy đặt tay che trên mắt, phóng tầm mắt nhìn về phía xa." },
      { zh: "周末我喜欢在家看一本有趣的书。", py: "Zhōu mò wǒ xǐ huan zài jiā kàn yì běn yǒu qù de shū.", vi: "Cuối tuần tôi thích ở nhà đọc một cuốn sách thú vị." }
    ],
    "从": [
      { zh: "学习汉字应该从基础部首开始。", py: "Xué xí Hàn zì yīng gāi cóng jī chǔ bù shǒu kāi shǐ.", vi: "Học chữ Hán nên bắt đầu từ những bộ thủ cơ bản." },
      { zh: "他从小就对东方文化充满好奇。", py: "Tā cóng xiǎo jiù duì Dōng fāng wén huà chōng mǎn hào qí.", vi: "Từ nhỏ anh ấy đã tràn đầy tò mò với văn hóa phương Đông." }
    ],
    "众": [
      { zh: "众人拾柴火焰高，团结就是力量。", py: "Zhòng rén shí chái huǒ yàn gāo, tuán jié jiù shì lì liàng.", vi: "Nhiều người góp củi lửa càng cao, đoàn kết chính là sức mạnh." },
      { zh: "这项创新设计赢得了众多观众的掌声。", py: "Zhè xiàng chuàng xīn shè jì yíng dé le zhòng duō guān zhòng de zhǎng shēng.", vi: "Thiết kế sáng tạo này đã giành được tràng pháo tay của đông đảo khán giả." }
    ],
    "品": [
      { zh: "他坐在窗边细细品味着一杯清茶。", py: "Tā zuò zài chuāng biān xì xì pǐn wèi zhe yì bēi qīng chá.", vi: "Anh ấy ngồi bên cửa sổ thong thả thưởng thức một tách trà thanh khiết." },
      { zh: "良好的品德比渊博的知识更重要。", py: "Liáng hǎo de pǐn dé bǐ yuān bó de zhī shi gèng zhòng yào.", vi: "Phẩm đức tốt đẹp còn quan trọng hơn cả kiến thức uyên bác." }
    ],
    "晶": [
      { zh: "清晨荷叶上的露珠像水晶一样晶莹剔透。", py: "Qīng chén hé yè shàng de lù zhū xiàng shuǐ jīng yí yàng jīng yíng tī tòu.", vi: "Giọt sương sớm trên lá sen trong suốt lấp lánh như pha lê." },
      { zh: "夜空中闪烁着亮晶晶的星星。", py: "Yè kōng zhōng shǎn shuò zhe liàng jīng jīng de xīng xing.", vi: "Trên bầu trời đêm lấp lánh những vì sao sáng ngời." }
    ],
    "炎": [
      { zh: "在炎热的夏天里，一杯冰水让人倍感清凉。", py: "Zài yán rè de xià tiān lǐ, yì bēi bīng shuǐ ràng rén bèi gǎn qīng liáng.", vi: "Giữa mùa hè nóng bức, một cốc nước mát khiến người ta cảm thấy sảng khoái." }
    ],
    "焱": [
      { zh: "篝火晚会上火光焱焱，照亮了整个夜空。", py: "Gōu huǒ wǎn huì shàng huǒ guāng yàn yàn, zhào liàng le zhěng gè yè kōng.", vi: "Trong đêm lửa trại, ánh lửa bùng cháy rực rỡ chiếu sáng cả bầu trời đêm." }
    ],
    "沐": [
      { zh: "万物沐浴在温暖的春光之中。", py: "Wàn wù mù yù zài wēn nuǎn de chūn guāng zhī zhōng.", vi: "Vạn vật đắm mình tắm gội trong ánh nắng xuân ấm áp." }
    ],
    "忍": [
      { zh: "面对困难时，我们需要忍耐与坚持。", py: "Miàn duì kùn nan shí, wǒ men xū yào rěn nài yǔ jiān chí.", vi: "Khi đối mặt với khó khăn, chúng ta cần sự nhẫn nại và kiên trì." }
    ],
    "尖": [
      { zh: "竹笋尖尖的嫩芽从泥土里钻了出来。", py: "Zhú sǔn jiān jiān de nèn yá cóng ní tǔ lǐ zuān le chū lái.", vi: "Mầm măng non nhọn hoắt đã nhú lên khỏi mặt đất." }
    ],
    "昌": [
      { zh: "祝愿祖国繁荣昌盛，人民幸福安康。", py: "Zhù yuàn zǔ guó fán róng chāng shèng, rén mín xìng fú ān kāng.", vi: "Chúc tổ quốc phồn vinh hưng thịnh, nhân dân hạnh phúc an khang." }
    ],
    "国": [
      { zh: "每个人都热爱自己的祖国和文化。", py: "Měi gè rén dōu rè ài zì jǐ de zǔ guó hé wén huà.", vi: "Mỗi người đều yêu quê hương đất nước và nền văn hóa của mình." }
    ],
    "家": [
      { zh: "无论走多远，家永远是最温暖的港湾。", py: "Wú lùn zǒu duō yuǎn, jiā yǒng yuǎn shì zuì wēn nuǎn de gǎng wān.", vi: "Dù có đi xa đến đâu, gia đình mãi mãi là bến đỗ ấm áp nhất." }
    ],
    "信": [
      { zh: "人无信不立，诚实守信是做人的根本。", py: "Rén wú xìn bú lì, chéng shí shǒu xìn shì zuò rén de gēn běn.", vi: "Người không có chữ tín thì không thể đứng vững, trung thực giữ chữ tín là gốc rễ làm người." }
    ],
    "人": [
      { zh: "三人行，必有我师焉。", py: "Sān rén xíng, bì yǒu wǒ shī yān.", vi: "Trong ba người cùng đi,ắt có người là thầy của ta." },
      { zh: "人人都有追求梦想的权利。", py: "Rén rén dōu yǒu zhuī qiú mèng xiǎng de quán lì.", vi: "Mọi người đều có quyền theo đuổi ước mơ của mình." }
    ],
    "木": [
      { zh: "十年树木，百年树人。", py: "Shí nián shù mù, bǎi nián shù rén.", vi: "Mười năm trồng cây, trăm năm trồng người." },
      { zh: "春风吹绿了山坡上的树木。", py: "Chūn fēng chuī lǜ le shān pō shàng de shù mù.", vi: "Gió xuân thổi xanh rờn cây cối trên sườn đồi." }
    ],
    "日": [
      { zh: "千里之行，始于足下；日积月累，终有所成。", py: "Qiān lǐ zhī xíng, shǐ yú zú xià; rì jī yuè lěi, zhōng yǒu suǒ chéng.", vi: "Hành trình vạn dặm bắt đầu từ một bước chân; tích lũy từng ngày ắt sẽ thành công." }
    ],
    "月": [
      { zh: "海上生明月，天涯共此时。", py: "Hǎi shàng shēng míng yuè, tiān yá gòng cǐ shí.", vi: "Trên biển vầng trăng sáng nhô lên, chân trời góc bể cùng chung khoảnh khắc này." }
    ],
    "水": [
      { zh: "饮水思源，我们不能忘记帮助过自己的人。", py: "Yǐn shuǐ sī yuán, wǒ men bù néng wàng jì bāng zhù guò zì jǐ de rén.", vi: "Uống nước nhớ nguồn, chúng ta không thể quên những người đã giúp đỡ mình." }
    ],
    "火": [
      { zh: "星星之火，可以燎原。", py: "Xīng xing zhī huǒ, kě yǐ liáo yuán.", vi: "Một đốm lửa nhỏ cũng có thể thổi bùng cả cánh đồng." }
    ],
    "心": [
      { zh: "只要用心去学，没有克服不了的难关。", py: "Zhǐ yào yòng xīn qù xué, méi yǒu kè fú bù liǎo de nán guān.", vi: "Chỉ cần dụng tâm học tập, không có thử thách nào không thể vượt qua." }
    ],
    "手": [
      { zh: "我们用勤劳的双手创造美好的未来。", py: "Wǒ men yòng qín láo de shuāng shǒu chuàng zào měi hǎo de wèi lái.", vi: "Chúng ta dùng đôi bàn tay cần cù để kiến tạo tương lai tươi đẹp." }
    ],
    "口": [
      { zh: "良药苦口利于病，忠言逆耳利于行。", py: "Liáng yào kǔ kǒu lì yú bìng, zhōng yán nì ěr lì yú xíng.", vi: "Thuốc đắng giã tật, sự thật mất lòng." }
    ],
    "山": [
      { zh: "书山有路勤为径，学海无涯苦作舟。", py: "Shū shān yǒu lù qín wéi jìng, xué hǎi wú yá kǔ zuò zhōu.", vi: "Núi sách có đường lấy cần cù làm lối, biển học vô bờ lấy khổ luyện làm thuyền." }
    ]
  };

  function getSentencesForCharacter(char) {
    if (!char) return [];

    // 1. Check direct curated sentences or simplified/traditional variant
    if (CURATED_SENTENCES[char]) {
      return CURATED_SENTENCES[char];
    }
    const pair = root.getTradSimpPair ? root.getTradSimpPair(char) : { simplified: char, traditional: char };
    if (CURATED_SENTENCES[pair.simplified]) {
      return CURATED_SENTENCES[pair.simplified];
    }
    if (CURATED_SENTENCES[pair.traditional]) {
      return CURATED_SENTENCES[pair.traditional];
    }

    // 2. Dynamic contextual sentence generation from CHARACTERS_DB & compounds
    const db = root.CHARACTERS_DB || {};
    const charInfo = db[char] || db[pair.simplified] || db[pair.traditional] || {};
    const py = root.convertNumberedPinyinToAccents
      ? root.convertNumberedPinyinToAccents(charInfo.pinyin || '')
      : (charInfo.pinyin || '');
    const rawMeaning = (charInfo.meaning || 'ý nghĩa văn tự cổ').replace(/\(dạng kết hợp\)\s*/g, '').trim();
    const compounds = charInfo.compounds || [];

    const results = [];

    if (compounds.length > 0) {
      const cp1 = compounds[0];
      const cp1Py = root.convertNumberedPinyinToAccents ? root.convertNumberedPinyinToAccents(cp1.pinyin || '') : (cp1.pinyin || '');
      const cp1Meaning = (cp1.meaning || rawMeaning).split(';')[0].trim();
      results.push({
        zh: `在汉语日常交流中，「${cp1.word}」是一个常用的表达。`,
        py: `Zài Hàn yǔ rì cháng jiāo liú zhōng, "${cp1Py}" shì yí gè cháng yòng de biǎo dá.`,
        vi: `Trong giao tiếp tiếng Trung hằng ngày,「${cp1.word}」(${cp1Meaning}) là một cách diễn đạt thông dụng.`
      });

      if (compounds.length > 1) {
        const cp2 = compounds[1];
        const cp2Py = root.convertNumberedPinyinToAccents ? root.convertNumberedPinyinToAccents(cp2.pinyin || '') : (cp2.pinyin || '');
        const cp2Meaning = (cp2.meaning || rawMeaning).split(';')[0].trim();
        results.push({
          zh: `老师今天教我们如何正确使用「${cp2.word}」这个词。`,
          py: `Lǎo shī jīn tiān jiāo wǒ men rú hé zhèng què shǐ yòng "${cp2Py}" zhè ge cí.`,
          vi: `Hôm nay thầy giáo dạy chúng tôi cách sử dụng chính xác từ「${cp2.word}」(${cp2Meaning}).`
        });
      }
    }

    // Always include a clear structural/lexical example sentence
    results.push({
      zh: `深入理解「${char}」字的部首结构，有助于快速记住它的含义。`,
      py: `Shēn rù lǐ jiě "${py || char}" zì de bù shǒu jié gòu, yǒu zhù yú kuài sù jì zhù tā de hán yì.`,
      vi: `Hiểu sâu cấu trúc bộ thủ của chữ「${char}」(${rawMeaning}) giúp ghi nhớ nhanh ý nghĩa của chữ.`
    });

    return results;
  }

  root.SENTENCES_DB = CURATED_SENTENCES;
  root.getSentencesForCharacter = getSentencesForCharacter;

})(typeof window !== 'undefined' ? window : global);
