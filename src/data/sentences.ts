export interface Sentence {
  chinese: string;
  pinyin: string;
  vietnamese: string;
  category?: string; // Topic: office, social, school, shopping, etc.
}

export type SentenceTopic = 'office' | 'social' | 'school' | 'shopping' | 'daily' | 'travel' | 'food' | 'health';

export interface SentencesByLevel {
  [level: string]: {
    [topic: string]: Sentence[];
  };
}

// HSK 1 - Giao tiếp cơ bản
export const hsk1Sentences: Record<string, Sentence[]> = {
  daily: [
    { chinese: "你好。", pinyin: "nǐ hǎo", vietnamese: "Xin chào.", category: "daily" },
    { chinese: "再见。", pinyin: "zài jiàn", vietnamese: "Tạm biệt.", category: "daily" },
    { chinese: "谢谢。", pinyin: "xiè xiè", vietnamese: "Cảm ơn.", category: "daily" },
    { chinese: "不客气。", pinyin: "bú kè qì", vietnamese: "Không có gì.", category: "daily" },
    { chinese: "对不起。", pinyin: "duì bu qǐ", vietnamese: "Xin lỗi.", category: "daily" },
    { chinese: "我很好。", pinyin: "wǒ hěn hǎo", vietnamese: "Tôi rất khỏe.", category: "daily" },
    { chinese: "你好吗？", pinyin: "nǐ hǎo ma", vietnamese: "Bạn khỏe không?", category: "daily" },
    { chinese: "明天见。", pinyin: "míng tiān jiàn", vietnamese: "Mai gặp lại.", category: "daily" }
  ],
  school: [
    { chinese: "我是学生。", pinyin: "wǒ shì xué sheng", vietnamese: "Tôi là học sinh.", category: "school" },
    { chinese: "你叫什么名字？", pinyin: "nǐ jiào shén me míng zì", vietnamese: "Bạn tên gì?", category: "school" }
  ],
  shopping: [
    { chinese: "这是多少钱？", pinyin: "zhè shì duō shao qián", vietnamese: "Cái này bao nhiêu tiền?", category: "shopping" },
    { chinese: "我要这个。", pinyin: "wǒ yào zhè ge", vietnamese: "Tôi muốn cái này.", category: "shopping" },
    { chinese: "我喜欢这个。", pinyin: "wǒ xǐ huān zhè ge", vietnamese: "Tôi thích cái này.", category: "shopping" }
  ],
  food: [
    { chinese: "你吃饭了吗？", pinyin: "nǐ chī fàn le ma", vietnamese: "Bạn ăn cơm chưa?", category: "food" }
  ],
  daily2: [
    { chinese: "今天天气很好。", pinyin: "jīn tiān tiān qì hěn hǎo", vietnamese: "Hôm nay thời tiết rất đẹp.", category: "daily" }
  ]
};

// HSK 2
export const hsk2Sentences: Record<string, Sentence[]> = {
  social: [
    { chinese: "很高兴认识你。", pinyin: "hěn gāo xìng rèn shi nǐ", vietnamese: "Rất vui được gặp bạn.", category: "social" },
    { chinese: "你最近怎么样？", pinyin: "nǐ zuì jìn zěn me yàng", vietnamese: "Dạo này bạn thế nào?", category: "social" },
    { chinese: "你住在哪里？", pinyin: "nǐ zhù zài nǎ lǐ", vietnamese: "Bạn sống ở đâu?", category: "social" },
    { chinese: "你做什么工作？", pinyin: "nǐ zuò shén me gōng zuò", vietnamese: "Bạn làm nghề gì?", category: "social" },
    { chinese: "你家有几口人？", pinyin: "nǐ jiā yǒu jǐ kǒu rén", vietnamese: "Nhà bạn có mấy người?", category: "social" },
    { chinese: "我喜欢听音乐。", pinyin: "wǒ xǐ huān tīng yīn yuè", vietnamese: "Tôi thích nghe nhạc.", category: "social" },
    { chinese: "周末你有什么计划？", pinyin: "zhōu mò nǐ yǒu shén me jì huà", vietnamese: "Cuối tuần bạn có kế hoạch gì?", category: "social" }
  ],
  school: [
    { chinese: "可以借我一支笔吗？", pinyin: "kě yǐ jiè wǒ yī zhī bǐ ma", vietnamese: "Có thể cho tôi mượn một cây bút không?", category: "school" },
    { chinese: "今天上什么课？", pinyin: "jīn tiān shàng shén me kè", vietnamese: "Hôm nay học môn gì?", category: "school" },
    { chinese: "我迟到了，对不起。", pinyin: "wǒ chí dào le, duì bu qǐ", vietnamese: "Tôi đến muộn, xin lỗi.", category: "school" }
  ],
  shopping: [
    { chinese: "这个多少钱？", pinyin: "zhè ge duō shao qián", vietnamese: "Cái này bao nhiêu tiền?", category: "shopping" },
    { chinese: "可以便宜一点吗？", pinyin: "kě yǐ pián yí yī diǎn ma", vietnamese: "Có thể rẻ hơn một chút không?", category: "shopping" },
    { chinese: "我要买这个。", pinyin: "wǒ yào mǎi zhè ge", vietnamese: "Tôi muốn mua cái này.", category: "shopping" },
    { chinese: "有别的颜色吗？", pinyin: "yǒu bié de yán sè ma", vietnamese: "Có màu khác không?", category: "shopping" }
  ],
  daily: [
    { chinese: "我们去看电影吧。", pinyin: "wǒ men qù kàn diàn yǐng ba", vietnamese: "Chúng ta đi xem phim nhé.", category: "daily" }
  ]
};

// HSK 3
export const hsk3Sentences: Record<string, Sentence[]> = {
  office: [
    { chinese: "你好，我是新来的员工。", pinyin: "nǐ hǎo, wǒ shì xīn lái de yuán gōng", vietnamese: "Xin chào, tôi là nhân viên mới.", category: "office" },
    { chinese: "请问，会议室在哪里？", pinyin: "qǐng wèn, huì yì shì zài nǎ lǐ", vietnamese: "Xin hỏi, phòng họp ở đâu?", category: "office" },
    { chinese: "今天下午三点开会。", pinyin: "jīn tiān xià wǔ sān diǎn kāi huì", vietnamese: "Chiều nay ba giờ họp.", category: "office" },
    { chinese: "我需要打印这份文件。", pinyin: "wǒ xū yào dǎ yìn zhè fèn wén jiàn", vietnamese: "Tôi cần in tài liệu này.", category: "office" },
    { chinese: "请把报告发给我。", pinyin: "qǐng bǎ bào gào fā gěi wǒ", vietnamese: "Vui lòng gửi báo cáo cho tôi.", category: "office" }
  ],
  school: [
    { chinese: "老师好！", pinyin: "lǎo shī hǎo", vietnamese: "Chào thầy/cô!", category: "school" },
    { chinese: "请问，这道题怎么做？", pinyin: "qǐng wèn, zhè dào tí zěn me zuò", vietnamese: "Xin hỏi, bài này làm thế nào?", category: "school" },
    { chinese: "我还没做完作业。", pinyin: "wǒ hái méi zuò wán zuò yè", vietnamese: "Tôi chưa làm xong bài tập.", category: "school" },
    { chinese: "考试什么时候开始？", pinyin: "kǎo shì shén me shí hou kāi shǐ", vietnamese: "Khi nào bắt đầu thi?", category: "school" },
    { chinese: "请再说一遍。", pinyin: "qǐng zài shuō yī biàn", vietnamese: "Vui lòng nói lại một lần nữa.", category: "school" }
  ],
  shopping: [
    { chinese: "这个太大了，有小一点的吗？", pinyin: "zhè ge tài dà le, yǒu xiǎo yī diǎn de ma", vietnamese: "Cái này quá lớn, có nhỏ hơn không?", category: "shopping" },
    { chinese: "可以试穿吗？", pinyin: "kě yǐ shì chuān ma", vietnamese: "Có thể thử được không?", category: "shopping" },
    { chinese: "我刷卡付款。", pinyin: "wǒ shuā kǎ fù kuǎn", vietnamese: "Tôi thanh toán bằng thẻ.", category: "shopping" },
    { chinese: "有发票吗？", pinyin: "yǒu fā piào ma", vietnamese: "Có hóa đơn không?", category: "shopping" },
    { chinese: "这个质量怎么样？", pinyin: "zhè ge zhì liàng zěn me yàng", vietnamese: "Chất lượng cái này thế nào?", category: "shopping" }
  ]
};

// HSK 4
export const hsk4Sentences: Record<string, Sentence[]> = {
  office: [
    { chinese: "这个项目什么时候完成？", pinyin: "zhè ge xiàng mù shén me shí hou wán chéng", vietnamese: "Dự án này khi nào hoàn thành?", category: "office" },
    { chinese: "我需要请假一天。", pinyin: "wǒ xū yào qǐng jià yī tiān", vietnamese: "Tôi cần xin nghỉ một ngày.", category: "office" },
    { chinese: "老板在办公室等你。", pinyin: "lǎo bǎn zài bàn gōng shì děng nǐ", vietnamese: "Sếp đang đợi bạn ở văn phòng.", category: "office" },
    { chinese: "请帮我安排一下会议。", pinyin: "qǐng bāng wǒ ān pái yī xià huì yì", vietnamese: "Vui lòng giúp tôi sắp xếp cuộc họp.", category: "office" },
    { chinese: "这个月的业绩怎么样？", pinyin: "zhè ge yuè de yè jì zěn me yàng", vietnamese: "Kết quả kinh doanh tháng này thế nào?", category: "office" },
    { chinese: "我需要和客户见面。", pinyin: "wǒ xū yào hé kè hù jiàn miàn", vietnamese: "Tôi cần gặp khách hàng.", category: "office" },
    { chinese: "请填写这份表格。", pinyin: "qǐng tián xiě zhè fèn biǎo gé", vietnamese: "Vui lòng điền vào biểu mẫu này.", category: "office" },
    { chinese: "电脑出问题了，需要修理。", pinyin: "diàn nǎo chū wèn tí le, xū yào xiū lǐ", vietnamese: "Máy tính bị hỏng, cần sửa.", category: "office" }
  ],
  school: [
    { chinese: "我不懂这个问题。", pinyin: "wǒ bù dǒng zhè ge wèn tí", vietnamese: "Tôi không hiểu câu hỏi này.", category: "school" },
    { chinese: "作业交到哪里？", pinyin: "zuò yè jiāo dào nǎ lǐ", vietnamese: "Nộp bài tập ở đâu?", category: "school" },
    { chinese: "图书馆几点开门？", pinyin: "tú shū guǎn jǐ diǎn kāi mén", vietnamese: "Thư viện mấy giờ mở cửa?", category: "school" },
    { chinese: "这个单词怎么读？", pinyin: "zhè ge dān cí zěn me dú", vietnamese: "Từ này đọc thế nào?", category: "school" }
  ],
  shopping: [
    { chinese: "我要退货。", pinyin: "wǒ yào tuì huò", vietnamese: "Tôi muốn trả hàng.", category: "shopping" },
    { chinese: "包邮吗？", pinyin: "bāo yóu ma", vietnamese: "Có miễn phí vận chuyển không?", category: "shopping" },
    { chinese: "什么时候能到货？", pinyin: "shén me shí hou néng dào huò", vietnamese: "Khi nào hàng đến?", category: "shopping" }
  ]
};

// HSK 5
export const hsk5Sentences: Record<string, Sentence[]> = {
  office: [
    { chinese: "明天早上九点上班。", pinyin: "míng tiān zǎo shang jiǔ diǎn shàng bān", vietnamese: "Sáng mai chín giờ đi làm.", category: "office" },
    { chinese: "这个任务交给你了。", pinyin: "zhè ge rèn wù jiāo gěi nǐ le", vietnamese: "Nhiệm vụ này giao cho bạn.", category: "office" }
  ],
  school: [
    { chinese: "我需要复习考试。", pinyin: "wǒ xū yào fù xí kǎo shì", vietnamese: "Tôi cần ôn thi.", category: "school" },
    { chinese: "下课后一起学习吧。", pinyin: "xià kè hòu yī qǐ xué xí ba", vietnamese: "Sau giờ học cùng học nhé.", category: "school" },
    { chinese: "我通过了考试。", pinyin: "wǒ tōng guò le kǎo shì", vietnamese: "Tôi đã đỗ kỳ thi.", category: "school" }
  ],
  social: [
    { chinese: "一起去喝咖啡吧。", pinyin: "yī qǐ qù hē kā fēi ba", vietnamese: "Cùng đi uống cà phê nhé.", category: "social" },
    { chinese: "祝你生日快乐！", pinyin: "zhù nǐ shēng rì kuài lè", vietnamese: "Chúc mừng sinh nhật!", category: "social" },
    { chinese: "你多大了？", pinyin: "nǐ duō dà le", vietnamese: "Bạn bao nhiêu tuổi?", category: "social" }
  ],
  shopping: [
    { chinese: "我要两件。", pinyin: "wǒ yào liǎng jiàn", vietnamese: "Tôi muốn mua hai cái.", category: "shopping" },
    { chinese: "这个打折吗？", pinyin: "zhè ge dǎ zhé ma", vietnamese: "Cái này có giảm giá không?", category: "shopping" },
    { chinese: "谢谢，我再看看。", pinyin: "xiè xiè, wǒ zài kàn kan", vietnamese: "Cảm ơn, để tôi xem thêm.", category: "shopping" }
  ]
};

/** Tu Luyen: cap do tu luyen, khong chua cau mac dinh */
export const tuluyenSentences: Record<string, Sentence[]> = {};

// Helper function to flatten sentences by level
export function getSentencesByLevel(level: string): Sentence[] {
  const levelData: Record<string, Record<string, Sentence[]>> = {
    hsk1: hsk1Sentences,
    hsk2: hsk2Sentences,
    hsk3: hsk3Sentences,
    hsk4: hsk4Sentences,
    hsk5: hsk5Sentences,
    tuluyen: tuluyenSentences
  };
  
  const sentences: Sentence[] = [];
  const topics = levelData[level] || {};
  Object.values(topics).forEach(topicSentences => {
    sentences.push(...topicSentences);
  });
  return sentences;
}

export const hskSentences: Record<string, Sentence[]> = {
  hsk1: getSentencesByLevel('hsk1'),
  hsk2: getSentencesByLevel('hsk2'),
  hsk3: getSentencesByLevel('hsk3'),
  hsk4: getSentencesByLevel('hsk4'),
  hsk5: getSentencesByLevel('hsk5'),
  tuluyen: getSentencesByLevel('tuluyen')
};
