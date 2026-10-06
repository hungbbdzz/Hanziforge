// HanziForge — Official HSK 1-6 Level Classifier & Authoritative Shuowen Etymology Engine
// Generated from Chinese Ministry of Education HSK 3.0 / 2.0 Standards & Classical Shuowen Jiezi

(function(root) {
  'use strict';

  // 1. Unified HSK Master Map
  const HSK_MAP = {"爱":1,"八":1,"爸":1,"杯":1,"子":1,"北":1,"京":1,"本":1,"体":1,"不":1,"菜":1,"茶":1,"吃":1,"出":1,"租":1,"车":1,"打":1,"电":1,"话":1,"大":1,"的":1,"点":1,"脑":1,"视":1,"影":1,"东":1,"西":1,"都":1,"读":1,"对":1,"起":1,"多":1,"少":1,"儿":1,"二":1,"饭":1,"店":1,"飞":1,"机":1,"分":1,"钟":1,"高":1,"兴":1,"个":1,"工":1,"作":1,"狗":1,"汉":1,"语":1,"好":1,"号":1,"喝":1,"和":1,"很":1,"后":1,"面":1,"回":1,"会":1,"火":1,"站":1,"几":1,"家":1,"叫":1,"今":1,"天":1,"九":1,"开":1,"看":1,"见":1,"块":1,"来":1,"老":1,"师":1,"了":1,"冷":1,"里":1,"六":1,"妈":1,"吗":1,"买":1,"猫":1,"没":1,"关":1,"系":1,"有":1,"米":1,"名":1,"字":1,"明":1,"哪":1,"那":1,"呢":1,"能":1,"你":1,"年":1,"女":1,"朋":1,"友":1,"漂":1,"亮":1,"苹":1,"果":1,"七":1,"钱":1,"前":1,"请":1,"去":1,"热":1,"人":1,"认":1,"识":1,"三":1,"商":1,"上":1,"午":1,"谁":1,"什":1,"么":1,"十":1,"时":1,"候":1,"是":1,"书":1,"水":1,"睡":1,"觉":1,"说":1,"四":1,"岁":1,"他":1,"她":1,"太":1,"气":1,"听":1,"同":1,"学":1,"喂":1,"我":1,"们":1,"五":1,"喜":1,"欢":1,"下":1,"雨":1,"先":1,"生":1,"现":1,"在":1,"想":1,"小":1,"姐":1,"些":1,"写":1,"谢":1,"星":1,"期":1,"习":1,"校":1,"一":1,"衣":1,"服":1,"医":1,"院":1,"椅":1,"月":1,"再":1,"怎":1,"样":1,"这":1,"真":1,"中":1,"国":1,"住":1,"桌":1,"昨":1,"坐":1,"做":1,"吧":2,"白":2,"百":2,"帮":2,"助":2,"报":2,"纸":2,"比":2,"别":2,"宾":2,"馆":2,"长":2,"唱":2,"歌":2,"穿":2,"次":2,"从":2,"错":2,"到":2,"得":2,"等":2,"弟":2,"第":2,"懂":2,"贵":2,"过":2,"还":2,"孩":2,"黑":2,"红":2,"答":2,"场":2,"鸡":2,"蛋":2,"件":2,"教":2,"室":2,"介":2,"绍":2,"进":2,"近":2,"就":2,"咖":2,"啡":2,"始":2,"考":2,"试":2,"可":2,"以":2,"快":2,"乐":2,"累":2,"离":2,"两":2,"零":2,"路":2,"旅":2,"游":2,"卖":2,"慢":2,"忙":2,"每":2,"妹":2,"门":2,"男":2,"您":2,"跑":2,"步":2,"便":2,"宜":2,"票":2,"妻":2,"床":2,"千":2,"晴":2,"让":2,"班":2,"身":2,"病":2,"日":2,"间":2,"事":2,"情":2,"手":2,"表":2,"送":2,"虽":2,"然":2,"但":2,"它":2,"踢":2,"足":2,"球":2,"题":2,"跳":2,"舞":2,"外":2,"完":2,"玩":2,"晚":2,"往":2,"为":2,"问":2,"希":2,"望":2,"洗":2,"瓜":2,"笑":2,"新":2,"姓":2,"休":2,"息":2,"雪":2,"颜":2,"色":2,"眼":2,"睛":2,"羊":2,"肉":2,"药":2,"要":2,"也":2,"已":2,"经":2,"意":2,"思":2,"因":2,"所":2,"泳":2,"右":2,"鱼":2,"元":2,"远":2,"运":2,"动":2,"早":2,"丈":2,"夫":2,"找":2,"着":2,"正":2,"知":2,"道":2,"准":2,"备":2,"走":2,"最":2,"左":2,"阿":3,"姨":3,"啊":3,"矮":3,"安":3,"静":3,"把":3,"搬":3,"办":3,"法":3,"半":3,"包":3,"饱":3,"保":3,"护":3,"被":3,"鼻":3,"较":3,"赛":3,"必":3,"须":3,"变":3,"演":3,"冰":3,"箱":3,"仅":3,"而":3,"且":3,"才":3,"单":3,"参":3,"加":3,"草":3,"层":3,"差":3,"超":3,"市":3,"衬":3,"衫":3,"成":3,"绩":3,"城":3,"迟":3,"除":3,"船":3,"春":3,"词":3,"典":3,"聪":3,"扫":3,"算":3,"带":3,"糕":3,"担":3,"心":3,"淡":3,"地":3,"灯":3,"低":3,"方":3,"铁":3,"图":3,"丢":3,"冬":3,"物":3,"短":3,"段":3,"锻":3,"炼":3,"饿":3,"发":3,"烧":3,"放":3,"复":3,"干":3,"净":3,"敢":3,"感":3,"冒":3,"趣":3,"刚":3,"告":3,"诉":3,"哥":3,"给":3,"跟":3,"更":3,"公":3,"共":3,"汽":3,"斤":3,"故":3,"刮":3,"风":3,"于":3,"汁":3,"害":3,"怕":3,"河":3,"板":3,"照":3,"花":3,"画":3,"坏":3,"迎":3,"环":3,"境":3,"换":3,"黄":3,"议":3,"或":3,"者":3,"乎":3,"极":3,"季":3,"节":3,"记":3,"寄":3,"检":3,"查":3,"简":3,"健":3,"康":3,"讲":3,"角":3,"脚":3,"接":3,"街":3,"目":3,"结":3,"婚":3,"束":3,"解":3,"决":3,"借":3,"紧":3,"常":3,"理":3,"久":3,"旧":3,"句":3,"定":3,"渴":3,"刻":3,"客":3,"空":3,"调":3,"口":3,"哭":3,"裤":3,"筷":3,"蓝":3,"难":3,"历":3,"史":3,"礼":3,"脸":3,"练":3,"辆":3,"聊":3,"邻":3,"居":3,"留":3,"楼":3,"绿":3,"马":3,"满":3,"帽":3,"拿":3,"奶":3,"鸟":3,"轻":3,"努":3,"力":3,"爬":3,"山":3,"盘":3,"胖":3,"皮":3,"鞋":3,"啤":3,"酒":3,"瓶":3,"平":3,"骑":3,"铅":3,"笔":3,"秋":3,"裙":3,"如":3,"伞":3,"网":3,"声":3,"音":3,"使":3,"世":3,"界":3,"受":3,"瘦":3,"舒":3,"树":3,"双":3,"司":3,"死":3,"阳":3,"特":3,"疼":3,"提":3,"育":3,"甜":3,"条":3,"头":3,"突":3,"腿":3,"脱":3,"袜":3,"碗":3,"万":3,"忘":3,"位":3,"文":3,"化":3,"惯":3,"夏":3,"香":3,"蕉":3,"向":3,"像":3,"信":3,"行":3,"醒":3,"性":3,"需":3,"选":3,"镜":3,"求":3,"页":3,"夜":3,"硬":3,"用":3,"圆":3,"越":3,"张":3,"顾":3,"片":3,"重":3,"主":3,"注":3,"自":3,"总":3,"祖":3,"排":4,"全":4,"按":4,"之":4,"棒":4,"证":4,"抱":4,"歉":4,"格":4,"并":4,"博":4,"士":4,"管":4,"部":4,"擦":4,"猜":4,"材":4,"料":4,"踩":4,"观":4,"尝":4,"江":4,"功":4,"诚":4,"实":4,"熟":4,"乘":4,"惊":4,"抽":4,"烟":4,"厨":4,"房":4,"传":4,"窗":4,"户":4,"粗":4,"存":4,"误":4,"案":4,"扮":4,"扰":4,"印":4,"招":4,"呼":4,"折":4,"概":4,"代":4,"替":4,"陆":4,"戴":4,"刀":4,"导":4,"倒":4,"处":4,"底":4,"登":4,"牌":4,"址":4,"掉":4,"堵":4,"肚":4,"童":4,"展":4,"律":4,"翻":4,"译":4,"烦":4,"恼":4,"反":4,"映":4,"范":4,"围":4,"弃":4,"暑":4,"假":4,"松":4,"费":4,"份":4,"丰":4,"富":4,"否":4,"则":4,"符":4,"合":4,"父":4,"亲":4,"付":4,"款":4,"负":4,"责":4,"杂":4,"改":4,"赶":4,"激":4,"速":4,"各":4,"资":4,"购":4,"够":4,"估":4,"计":4,"鼓":4,"励":4,"挂":4,"键":4,"众":4,"光":4,"广":4,"播":4,"逛":4,"规":4,"矩":4,"籍":4,"际":4,"程":4,"海":4,"洋":4,"羞":4,"寒":4,"汗":4,"航":4,"适":4,"盒":4,"悔":4,"厚":4,"互":4,"联":4,"相":4,"怀":4,"疑":4,"忆":4,"活":4,"泼":4,"获":4,"积":4,"基":4,"础":4,"及":4,"即":4,"划":4,"技":4,"术":4,"既":4,"继":4,"续":4,"油":4,"具":4,"价":4,"坚":4,"持":4,"减":4,"肥":4,"建":4,"将":4,"奖":4,"金":4,"降":4,"落":4,"交":4,"流":4,"通":4,"郊":4,"区":4,"骄":4,"傲":4,"饺":4,"授":4,"约":4,"释":4,"尽":4,"禁":4,"止":4,"剧":4,"济":4,"验":4,"精":4,"彩":4,"神":4,"景":4,"警":4,"察":4,"竞":4,"争":4,"竟":4,"究":4,"举":4,"拒":4,"绝":4,"距":4,"聚":4,"虑":4,"科":4,"棵":4,"咳":4,"嗽":4,"怜":4,"惜":4,"厅":4,"肯":4,"闲":4,"恐":4,"苦":4,"矿":4,"泉":4,"困":4,"扩":4,"垃":4,"圾":4,"拉":4,"懒":4,"浪":4,"漫":4,"虎":4,"貌":4,"厉":4,"例":4,"利":4,"润":4,"连":4,"凉":4,"另":4,"泪":4,"乱":4,"麻":4,"毛":4,"巾":4,"美":4,"丽":4,"梦":4,"迷":4,"密":4,"码":4,"免":4,"秒":4,"民":4,"族":4,"母":4,"耐":4,"内":4,"容":4,"龄":4,"弄":4,"暖":4,"偶":4,"尔":4,"队":4,"列":4,"判":4,"断":4,"陪":4,"批":4,"评":4,"肤":4,"脾":4,"篇":4,"骗":4,"乒":4,"乓":4,"破":4,"葡":4,"萄":4,"普":4,"遍":4,"其":4,"签":4,"墙":4,"敲":4,"桥":4,"巧":4,"克":4,"戚":4,"穷":4,"况":4,"取":4,"缺":4,"却":4,"确":4,"群":4,"闹":4,"币":4,"任":4,"何":4,"务":4,"扔":4,"仍":4,"入":4,"软":4,"散":4,"森":4,"林":4,"沙":4,"量":4,"伤":4,"稍":4,"微":4,"勺":4,"社":4,"申":4,"深":4,"甚":4,"至":4,"命":4,"省":4,"剩":4,"失":4,"败":4,"傅":4,"湿":4,"狮":4,"食":4,"品":4,"纪":4,"收":4,"据":4,"拾":4,"首":4,"悉":4,"输":4,"顺":4,"序":4,"数":4,"刷":4,"牙":4,"硕":4,"度":4,"塑":4,"袋":4,"酸":4,"随":4,"孙":4,"台":4,"弹":4,"钢":4,"琴":4,"抬":4,"态":4,"谈":4,"汤":4,"躺":4,"趟":4,"讨":4,"论":4,"厌":4,"供":4,"纲":4,"填":4,"挺":4,"停":4,"胞":4,"屋":4,"推":4,"退":4,"危":4,"险":4,"卫":4,"味":4,"温":4,"蚊":4,"章":4,"污":4,"染":4,"无":4,"柿":4,"吸":4,"引":4,"咸":4,"显":4,"羡":4,"慕":4,"详":4,"细":4,"响":4,"橡":4,"消":4,"效":4,"辛":4,"闻":4,"李":4,"修":4,"许":4,"血":4,"寻":4,"押":4,"严":4,"研":4,"盐":4,"员":4,"养":4,"邀":4,"钥":4,"匙":4,"叶":4,"切":4,"亿":4,"艺":4,"饮":4,"象":4,"赢":4,"营":4,"勇":4,"永":4,"优":4,"秀":4,"幽":4,"默":4,"尤":4,"由":4,"邮":4,"局":4,"谊":4,"愉":4,"与":4,"原":4,"谅":4,"阅":4,"云":4,"允":4,"志":4,"脏":4,"造":4,"遭":4,"遇":4,"增":4,"窄":4,"急":4,"待":4,"式":4,"整":4,"支":4,"直":4,"值":4,"植":4,"职":4,"业":4,"指":4,"针":4,"只":4,"质":4,"治":4,"疗":4,"秩":4,"制":4,"专":4,"转":4,"赚":4,"仔":4,"组":4,"织":4,"初":4,"尊":4,"座":4,"唉":5,"慰":5,"装":5,"岸":5,"拔":5,"摆":5,"拜":5,"访":5,"裹":5,"含":5,"括":5,"薄":5,"宝":5,"贝":5,"怨":5,"悲":5,"背":5,"彼":5,"此":5,"毕":5,"避":5,"编":5,"辑":5,"秘":5,"鞭":5,"炮":5,"辩":5,"标":5,"达":5,"丙":5,"饼":5,"毒":5,"玻":5,"璃":5,"脖":5,"补":5,"充":5,"布":5,"骤":5,"财":5,"产":5,"采":5,"虹":5,"餐":5,"残":5,"疾":5,"惭":5,"愧":5,"操":5,"册":5,"测":5,"厕":5,"插":5,"拆":5,"途":5,"抄":5,"朝":5,"嘲":5,"吵":5,"架":5,"库":5,"厢":5,"彻":5,"沉":5,"趁":5,"称":5,"赞":5,"承":5,"立":5,"尺":5,"翅":5,"膀":5,"冲":5,"器":5,"屉":5,"愁":5,"丑":5,"臭":5,"版":5,"席":5,"级":5,"非":5,"夕":5,"递":5,"统":5,"帘":5,"闯":5,"创":5,"吹":5,"磁":5,"辞":5,"促":5,"催":5,"措":5,"施":5,"应":5,"喷":5,"嚏":5,"呆":5,"贷":5,"纯":5,"独":5,"耽":5,"胆":5,"鬼":5,"当":5,"挡":5,"岛":5,"致":5,"霉":5,"德":5,"敌":5,"势":5,"震":5,"池":5,"钓":5,"丁":5,"顶":5,"订":5,"峰":5,"冻":5,"洞":5,"豆":5,"腐":5,"斗":5,"逗":5,"端":5,"堆":5,"顿":5,"吨":5,"蹲":5,"亏":5,"余":5,"朵":5,"躲":5,"恶":5,"劣":5,"耳":5,"抖":5,"挥":5,"言":5,"罚":5,"繁":5,"荣":5,"抗":5,"馈":5,"妨":5,"碍":5,"仿":5,"佛":5,"废":5,"配":5,"析":5,"纷":5,"奋":5,"愤":5,"怒":5,"俗":5,"疯":5,"狂":5,"逢":5,"讽":5,"刺":5,"扶":5,"幅":5,"辅":5,"妇":5,"革":5,"脆":5,"涉":5,"预":5,"旱":5,"尴":5,"尬":5,"甘":5,"搞":5,"诫":5,"档":5,"曲":5,"隔":5,"壁":5,"根":5,"劳":5,"贡":5,"献":5,"鸣":5,"勾":5,"构":5,"姑":5,"娘":5,"骨":5,"掌":5,"固":5,"雇":5,"佣":5,"拐":5,"弯":5,"闭":5,"战":5,"官":5,"冠":5,"军":5,"罐":5,"辉":5,"阔":5,"泛":5,"归":5,"纳":5,"模":5,"柜":5,"滚":5,"锅":5,"敏":5,"滤":5,"哈":5,"嗨":5,"鲜":5,"喊":5,"豪":5,"华":5,"奇":5,"核":5,"恨":5,"狠":5,"横":5,"衡":5,"轰":5,"忧":5,"吁":5,"胡":5,"壶":5,"蝴":5,"蝶":5,"糊":5,"涂":5,"滑":5,"梯":5,"念":5,"缓":5,"幻":5,"慌":5,"皇":5,"帝":5,"灰":5,"尘":5,"恢":5,"姻":5,"跃":5,"伙":5,"伴":5,"灵":5,"肌":5,"械":5,"吉":5,"集":5,"寂":5,"寞":5,"托":5,"夹":5,"甲":5,"设":5,"驾":5,"驶":5,"强":5,"艰":5,"兼":5,"捡":5,"剪":5,"筑":5,"酱":5,"临":5,"狡":5,"猾":5,"娇":5,"阶":5,"尾":5,"杰":5,"截":5,"账":5,"届":5,"戒":5,"迫":5,"属":5,"救":5,"舅":5,"拘":5,"橘":5,"鞠":5,"躬":5,"巨":5,"卷":5,"卡":5,"幕":5,"砍":5,"靠":5,"课":5,"怖":5,"孔":5,"控":5,"枯":5,"燥":5,"夸":5,"宽":5,"敞":5,"昆":5,"虫":5,"蜡":5,"烛":5,"辣":5,"椒":5,"拦":5,"惰":5,"烂":5,"狼":5,"朗":5,"捞":5,"姥":5,"雷":5,"类":5,"型":5,"酷":5,"厘":5,"益":5,"粒":5,"络":5,"廉":5,"良":5,"粮":5,"爽":5,"辽":5,"畅":5,"聋":5,"漏":5,"露":5,"录":5,"轮":5,"逻":5,"骂":5,"馒":5,"盲":5,"矛":5,"盾":5,"茂":5,"盛":5,"梅":5,"媒":5,"煤":5,"炭":5,"眉":5,"妙":5,"魅":5,"猛":5,"烈":5,"蒙":5,"粉":5,"描":5,"绘":5,"庙":5,"蔑":5,"捷":5,"锐":5,"誉":5,"胜":5,"额":5,"令":5,"摩":5,"摸":5,"陌":5,"莫":5,"漠":5,"谋":5,"牧":5,"堪":5,"泥":5,"土":5,"逆":5,"捏":5,"宁":5,"愿":5,"牛":5,"浓":5,"农":5,"村":5,"奴":5,"隶":5,"欧":5,"洲":5,"派":5,"盼":5,"培":5,"训":5,"佩":5,"赔":5,"偿":5,"碰":5,"疲":5,"偏":5,"僻":5,"飘":5,"扬":5,"拼":5,"搏":5,"贫":5,"频":5,"率":5,"种":5,"凭":5,"均":5,"魄":5,"剖":5,"欺":5,"齐":5,"迹":5,"企":5,"启":5,"乞":5,"丐":5,"氛":5,"谦":5,"虚":5,"牵":5,"浅":5,"欠":5,"瞧":5,"梁":5,"悄":5,"妾":5,"勤":5,"清":5,"晨":5,"楚":5,"青":5,"易":5,"倾":5,"顷":5,"绪":5,"趋":5,"驱":5,"娶":5,"权":5,"犬":5,"燃":5,"嚷":5,"绕":5,"融":5,"柔":5,"弱":5,"嗓":5,"杀":5,"刹":5,"尚":5,"哨":5,"舍":5,"蛇":5,"射":5,"击":5,"摄":5,"伸":5,"升":5,"审":5,"诗":5,"石":5,"终":5,"兵":5,"示":5,"誓":5,"逝":5,"寿":5,"售":5,"货":5,"鼠":5,"摔":5,"甩":5,"税":5,"帅":5,"眠":5,"瞬":5,"丝":5,"绸":5,"私":5,"寺":5,"耸":5,"搜":5,"索":5,"苏":5,"素":5,"损":5,"缩":5,"锁":5,"踏":5,"湾":5,"坦":5,"掏":5,"逃":5,"淘":5,"桃":5,"陶":5,"醉":5,"汰":5,"套":5,"贴":5,"田":5,"野":5,"挑":5,"亭":5,"痛":5,"铜":5,"投":5,"透":5,"形":5,"徒":5,"径":5,"壤":5,"团":5,"妥":5,"协":5,"威":5,"胁":5,"违":5,"维":5,"委":5,"屈":5,"唯":5,"吻":5,"稳":5,"卧":5,"握":5,"武":5,"雾":5,"稀":5,"菌":5,"瞎":5,"吓":5,"仙":5,"线":5,"限":5,"县":5,"似":5,"乡":5,"享":5,"项":5,"巷":5,"耗":5,"销":5,"灭":5,"园":5,"孝":5,"芯":5,"欣":5,"赏":5,"幸":5,"伪":5,"叙":5,"述":5,"宣":5,"悬":5,"靴":5,"旋":5,"穴":5,"询":5,"迅":5,"压":5,"鸭":5,"齿":5,"膏":5,"肃":5,"依":5,"移":5,"遗":5,"毅":5,"银":5,"隐":5,"藏":5,"英":5,"婴":5,"拥":5,"挤":5,"犹":5,"豫":5,"悠":5,"幼":5,"晕":5,"灾":5,"糟":5,"摘":5,"宅":5,"粘":5,"览":5,"占":5,"领":5,"哲":5,"珍":5,"诊":5,"镇":5,"政":5,"策":5,"蒸":5,"拯":5,"挣":5,"扎":5,"援":5,"执":5,"忠":5,"周":5,"猪":5,"竹":5,"祝":5,"贺":5,"抓":5,"壮":5,"桩":5,"状":5,"追":5,"拙":5,"源":5,"姿":5,"综":5,"宗":5,"裁":5,"纵":5,"弊":5};

  // 2. Curated Masterpiece Etymology Stories
  const CURATED_ETYMOLOGY = {
  "休": "Chữ Hội Ý cổ điển: Hình ảnh con người (亻) tựa lưng vào bóng mát của thân cây gỗ (木) trong rừng để nghỉ ngơi sau buổi làm đồng vất vả, hàm ý an dưỡng, nghỉ ngơi tĩnh tâm.",
  "明": "Chữ Hội Ý: Kết hợp giữa Nhật (日 - Mặt trời ban ngày) và Nguyệt (月 - Mặt trăng ban đêm). Khi hai nguồn sáng vĩ đại nhất của vũ trụ hội tụ, vạn vật đều trở nên sáng tỏ, quang minh chính đại.",
  "安": "Chữ Hội Ý: Hình tượng người phụ nữ (女) ngồi yên bình dưới mái ấm gia đình (宀). Nơi nào có phụ nữ giữ gìn tổ ấm thì nơi đó có sự bình an, an cư lạc nghiệp.",
  "好": "Chữ Hội Ý: Người phụ nữ (女) ẵm bồng đứa con thơ (子) của mình. Tình mẫu tử thiêng liêng là điều đẹp đẽ, tốt lành và viên mãn nhất thế gian.",
  "森": "Chữ Hội Ý hình tháp (Phẩm tự): Ba cây Mộc (木) quần tụ tạo thành một cánh rừng rậm rạp ngút ngàn, biểu thị sự trù phú, râm mát và sinh sôi của thiên nhiên.",
  "众": "Chữ Hội Ý hình tháp: Ba người (人) đứng sát cánh bên nhau, tượng trưng cho đám đông quần chúng, sức mạnh đoàn kết của nhân dân.",
  "炎": "Chữ Hội Ý: Hai ngọn lửa Hỏa (火) xếp chồng lên nhau bốc cháy dữ dội, tượng trưng cho cái nóng thiêu đốt, nhiệt huyết bùng cháy mãnh liệt.",
  "晶": "Chữ Hội Ý: Ba vầng mặt trời (日) cùng tỏa sáng lấp lánh như những viên pha lê, kim cương sáng ngời tinh khiết.",
  "看": "Chữ Hội Ý: Bàn tay (手/龵) khum lại che ngang trên mắt (目) để phóng tầm mắt nhìn xa xăm, quan sát quang cảnh phía trước.",
  "男": "Chữ Hội Ý: Gồm Điền (田 - Ruộng lúa) và Lực (力 - Sức mạnh). Người dùng sức vóc cày cấy canh tác trên đồng ruộng chính là người đàn ông, đấng nam nhi gánh vác việc lớn.",
  "家": "Chữ Hội Ý: Dưới mái nhà (宀) có nuôi dưỡng bầy lợn Thỉ (豕). Trong xã hội nông nghiệp cổ xưa, có nhà che mưa nắng và có gia súc tích trữ của cải chính là một gia đình ấm no.",
  "国": "Chữ Hội Ý: Tường thành kiên cố (囗) bao bọc, bảo vệ ngọc báu chủ quyền (玉) và bờ cõi của giang sơn xã tắc, biểu thị quốc gia độc lập.",
  "學": "Chữ Hội Ý cổ: Đôi bàn tay (𦥑) nâng đỡ mái trường (冖) rèn luyện cho con trẻ (子) tiếp thu tri thức của tiền nhân, hun đúc đạo học thành người.",
  "学": "Dạng giản thể của 學: Tinh giản phần mái trường và đứa trẻ (子) hướng về tri thức, thể hiện tinh thần hiếu học.",
  "信": "Chữ Hội Ý: Gồm Nhân (亻 - Con người) và Ngôn (言 - Lời nói). Lời nói của bậc quân tử nói ra phải trước sau như một, có trọng lượng và giữ trọn chữ Tín.",
  "武": "Chữ Hội Ý: Gồm Chỉ (止 - Dừng lại) và Qua (戈 - Ngọn giáo binh khí). Ý nghĩa tối thượng của đức Võ không phải là chém giết, mà là dùng sức mạnh để ngăn chặn chiến tranh, giữ gìn hòa bình.",
  "尘": "Chữ Hội Ý: Gồm Tiểu (小 - Nhỏ bé) và Thổ (土 - Đất cát). Những hạt đất cát li ti nhỏ bé bay lơ lửng trong không khí chính là bụi trần.",
  "尖": "Chữ Hội Ý: Phía trên thì nhỏ (小), phía dưới lại to rộng (大). Vật thể có đầu nhỏ đáy to tạo thành hình mũi nhọn sắc bén.",
  "歪": "Chữ Hội Ý: Gồm Bất (不 - Không) và Chính (正 - Ngay thẳng). Sự vật không ngay thẳng, thiên lệch thì gọi là xiêu vẹo, bất chính.",
  "卡": "Chữ Hội Ý: Gồm Thượng (上 - Trên) và Hạ (下 - Dưới). Lưng chừng kẹt lại ở giữa, không lên được mà cũng chẳng xuống được, gọi là kẹt cứng (tạp).",
  "泪": "Chữ Hội Ý: Nước (氵 - Thủy) chảy ra từ khóe mắt (目 - Mục) khi vui sướng hoặc đau thương xúc động, tạo thành giọt nước mắt.",
  "鸣": "Chữ Hội Ý: Tiếng kêu phát ra từ miệng (口) của loài chim (鸟/鳥), biểu thị tiếng chim hót vang vọng giữa trời xanh.",
  "鲜": "Chữ Hội Ý: Sự kết hợp hoàn mỹ giữa cá tươi dưới nước (鱼) và thịt cừu non trên cạn (羊), tạo nên hương vị tươi ngon đậm đà bậc nhất.",
  "解": "Chữ Hội Ý: Dùng con dao sắc (刀) rạch theo thớ xương sừng (角) của con trâu (牛) để mổ xẻ phân tách, nghĩa bóng là giải quyết thông suốt mọi gút mắc.",
  "采": "Chữ Hội Ý: Bàn tay (爫/爪) vươn lên tán cây (木) để hái hoa, ngắt quả ngọt ngào.",
  "灭": "Chữ Hội Ý: Dùng một nét gạch chắn ngang (一) đè dập tắt ngọn lửa đang bốc cháy (火), biểu thị sự tiêu diệt, dập tắt tai ương.",
  "问": "Chữ Hình Thanh & Hội Ý: Người đứng ghé miệng (口) bên ngưỡng cửa (门) để cất tiếng hỏi thăm, giao lưu học hỏi.",
  "间": "Chữ Hội Ý: Ánh trăng hoặc ánh nắng (日) xuyên qua khe hở của hai cánh cửa (门), biểu thị khoảng trống không gian và thời gian.",
  "闭": "Chữ Hội Ý: Đóng sập hai cánh cửa (门) và cài chốt chặn (才/十) lại, biểu thị sự bế quan, đóng kín ngăn cách.",
  "闪": "Chữ Hội Ý: Người (人) bất chợt lướt thoăn thoắt qua cánh cửa (门) rồi vụt mất, biểu thị tia chớp lóe sáng nhanh như chớp.",
  "阔": "Chữ Hình Thanh: Cánh cửa rộng mở (门) cùng chữ Hoạt (活) dồi dào sức sống, biểu thị không gian khoáng đạt, rộng lớn thênh thang.",
  "闯": "Chữ Hội Ý: Con ngựa dũng mãnh (马) tung vó phi thẳng xông qua cánh cửa thành (门), biểu thị sự xông pha, dấn thân vượt thử thách.",
  "琉": "Chữ Hình Thanh & Biểu Ý: Kết hợp giữa bộ Ngọc/Vương (王 - Ngọc báu sáng quý) và Lưu (㐬 - Dòng chảy óng ánh), chỉ loại ngọc lưu ly cổ lấp lánh màu sắc rực rỡ.",
  "攸": "Chữ Hội Ý & Hình Thanh: Kết hợp từ Nhân (亻 - Con người), Cổn (丨 - Vạch thẳng định hướng) và Phộc (攵 - Tay cầm roi uốn nắn), chỉ hành vi đi đúng đường hướng, về sau dùng biểu thị sự quan hệ thiết yếu sống còn (Du quan 攸關).",
  "病": "Chữ Hình Thanh: Bộ Nạch (疒 - Nằm trên giường bệnh) kết hợp chữ Bính (丙 - Biểu âm và dương khí quá vượng), biểu thị cơ thể nhiễm bệnh tật cần điều dưỡng.",
  "痛": "Chữ Hình Thanh: Nằm trên giường bệnh (疒) với nỗi đau đớn như dũng khí (甬) bị dồn nén, chỉ nỗi đau nhức buốt từ thể xác đến tâm can.",
  "药": "Chữ Hội Ý: Bộ Thảo (艹 - Cây cỏ dược liệu) kết hợp chữ Ước (约 - Giao ước hòa giải), chỉ các phương thuốc thảo mộc chữa lành vết thương.",
  "草": "Chữ Hội Ý: Bộ Thảo (艹 - Cây cỏ) vươn mình đón ánh mặt trời buổi sáng sớm (早 - Tảo), biểu thị mầm cỏ xanh tươi đầy nhựa sống.",
  "花": "Chữ Hình Thanh: Bộ Thảo (艹 - Hoa cỏ) kết hợp chữ Hóa (化 - Biến hóa, nở rộ), biểu thị sự biến chuyển kỳ diệu của mầm cây khi trổ bông rực rỡ."
};

  // 3. HSK Classifier Helper
  function getHskInfo(character) {
    if (!character) return { levelText: 'Hán Tự', badgeClass: 'hsk-ancient', code: 0 };
    
    // Check direct or variant
    let lvl = HSK_MAP[character];
    if (!lvl && root.getTradSimpPair) {
      const pair = root.getTradSimpPair(character);
      lvl = HSK_MAP[pair.simplified] || HSK_MAP[pair.traditional];
    }

    if (lvl === 1) return { levelText: 'HSK 1', badgeClass: 'hsk-1', code: 1, desc: 'Cơ bản' };
    if (lvl === 2) return { levelText: 'HSK 2', badgeClass: 'hsk-2', code: 2, desc: 'Sơ cấp 1' };
    if (lvl === 3) return { levelText: 'HSK 3', badgeClass: 'hsk-3', code: 3, desc: 'Sơ cấp 2' };
    if (lvl === 4) return { levelText: 'HSK 4', badgeClass: 'hsk-4', code: 4, desc: 'Trung cấp' };
    if (lvl === 5) return { levelText: 'HSK 5', badgeClass: 'hsk-5', code: 5, desc: 'Cao cấp' };
    if (lvl === 6) return { levelText: 'HSK 6', badgeClass: 'hsk-6', code: 6, desc: 'Thành thạo' };

    // For rare/classical characters outside standard HSK 1-6
    return { levelText: 'Hán Cổ / Khang Hy', badgeClass: 'hsk-ancient', code: 7, desc: 'Chuyên sâu' };
  }

  // Vietnamese Position Translation Map
  const POSITION_VIETNAMESE = {
    'LEFT': 'Bên trái',
    'RIGHT': 'Bên phải',
    'TOP': 'Ở trên',
    'BOTTOM': 'Ở dưới',
    'OUTSIDE': 'Bao ngoài',
    'INSIDE': 'Lồng trong',
    'TOPLEFT': 'Góc trên-trái',
    'TOPRIGHT': 'Góc trên-phải',
    'BOTTOMLEFT': 'Góc dưới-trái',
    'INSIDE_BOTTOMLEFT': 'Lồng góc dưới-trái',
    'MIDDLE': 'Ở giữa',
    'FIRST': 'Phần đầu',
    'SECOND': 'Phần sau',
    'THIRD': 'Phần dưới'
  };

  // Helper to validate genuine Vietnamese phonetic readings
  function isValidSinoVietnamese(sino, char) {
    if (!sino || sino === char) return false;
    // Must NOT contain CJK ideographs (CJK Unified, Ext A-I, Radicals)
    if (/[\u2E80-\u2FD5\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(sino)) return false;
    // Must contain Latin / Vietnamese alphabet
    return /[a-zA-ZÀ-ỹ]/.test(sino);
  }

  // 4. Smart 2-Tier Etymological Story Generator
  function getEtymologyStory(ch, components, dbInfo) {
    if (!ch) return '';
    const char = typeof ch === 'string' ? ch : ch.character;
    
    // Tier 1: Authoritative Curated Story
    if (CURATED_ETYMOLOGY[char]) {
      return CURATED_ETYMOLOGY[char];
    }
    if (root.getTradSimpPair) {
      const pair = root.getTradSimpPair(char);
      if (CURATED_ETYMOLOGY[pair.simplified]) return CURATED_ETYMOLOGY[pair.simplified];
      if (CURATED_ETYMOLOGY[pair.traditional]) return CURATED_ETYMOLOGY[pair.traditional];
    }

    // Tier 2: Dynamic Semantic Decomposition Narrative
    const rawSino = (dbInfo && dbInfo.sino_vietnamese) || (ch && ch.sino_vietnamese) || '';
    const hasValidSino = isValidSinoVietnamese(rawSino, char);
    const sinoDisplay = hasValidSino ? `(Hán Việt: <b>${rawSino.toUpperCase()}</b>)` : '';

    const rawMeaning = (dbInfo && dbInfo.meaning) || (ch && ch.meaning) || '';
    const cleanMeaning = rawMeaning
      .replace(/\(dạng kết hợp\)\s*/g, '')
      .replace(/^(\([^\)]+\))\s*/g, '')
      .replace(/^\((.+)\)$/, '$1')
      .trim();

    const compsList = components || (ch && ch.components) || [];
    if (compsList && compsList.length > 0) {
      const partsDesc = compsList.map(c => {
        const rad = c.radical || c.character || '';
        const name = c.name || rad;
        const posText = c.position && POSITION_VIETNAMESE[c.position] ? ` (${POSITION_VIETNAMESE[c.position].toLowerCase()})` : '';
        
        // Informative semantic note (avoid repeating the radical name like 'chỉ ất')
        let meaningNote = '';
        if (c.meaning && c.meaning.toLowerCase() !== name.toLowerCase() && c.meaning.toLowerCase() !== rad.toLowerCase()) {
          meaningNote = ` — tượng trưng cho ${c.meaning.toLowerCase()}`;
        }
        return `<b>Bộ ${name} [${rad}]</b>${posText}${meaningNote}`;
      }).join(' kết hợp cùng ');

      return `Chữ「<b style="color:var(--gold-light);font-size:1.1rem;">${char}</b>」${sinoDisplay ? `${sinoDisplay} ` : ''}được cấu thành từ ${partsDesc}, mang ý nghĩa là: <i>${cleanMeaning || 'đặc trưng văn tự cổ'}</i>.`;
    }

    return `Chữ「<b style="color:var(--gold-light);font-size:1.1rem;">${char}</b>」${sinoDisplay ? `${sinoDisplay}: ` : ': '}<i>${cleanMeaning || 'văn tự mẫu mực'}</i> mang ý nghĩa văn hóa chữ Hán sâu sắc.`;
  }

  // Export to window
  root.POSITION_VIETNAMESE = POSITION_VIETNAMESE;
  root.isValidSinoVietnamese = isValidSinoVietnamese;

  // Export to window
  root.HSK_MAP = HSK_MAP;
  root.CURATED_ETYMOLOGY = CURATED_ETYMOLOGY;
  root.getHskInfo = getHskInfo;
  root.getEtymologyStory = getEtymologyStory;

})(typeof window !== 'undefined' ? window : global);
