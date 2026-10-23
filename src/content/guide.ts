import type { LanguageCode } from "@/config";

/**
 * GUIDE: MEDBORGARSKAPSPROVET
 * Egna formuleringar. Fakta kommer från UHR:s och Migrationsverkets webbplatser och
 * kontrollerades 2026-10-23 – uppdatera CHECKED och texterna när något ändras
 * (t.ex. när UHR publicerar datum, avgift, provtid och antal frågor).
 * Kapitlens namn hämtas från konfigurationen och visas på svenska.
 */
export const GUIDE_CHECKED = "2026-10-23";

export const GUIDE_LINKS = {
  uhr: "https://www.uhr.se/medborgarskapsprovet/",
  material: "https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/",
  adjustments: "https://www.uhr.se/medborgarskapsprovet/anpassningar/",
  migrationsverket:
    "https://www.migrationsverket.se/du-vill-ansoka/svenskt-medborgarskap/medborgarskap-for-vuxna/medborgarskap-for-vuxna.html",
};

export type GuideSection = { heading: string; paragraphs?: string[]; bullets?: string[]; chapters?: boolean };

export type Guide = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  intro: string;
  sections: GuideSection[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  sourcesTitle: string;
  sourcesText: string;
  linkUhr: string;
  linkMaterial: string;
  linkAdjustments: string;
  linkMigrationsverket: string;
};

const sv: Guide = {
  metaTitle: "Medborgarskapsprovet 2027 – allt du behöver veta",
  metaDescription:
    "Vem ska skriva medborgarskapsprovet, när är nästa prov, hur ser det ut och hur förbereder du dig? En enkel guide med fakta från UHR och Migrationsverket.",
  title: "Medborgarskapsprovet – allt du behöver veta",
  intro:
    "Här får du en enkel överblick över medborgarskapsprovet i samhällskunskap: vem som ska skriva det, när nästa prov är, hur provet ser ut och hur du förbereder dig.",
  sections: [
    {
      heading: "Vad är medborgarskapsprovet?",
      paragraphs: [
        "Sedan den 6 juni 2026 gäller nya regler för att bli svensk medborgare. Ett av kraven är grundläggande kunskaper i svenska och om det svenska samhället. Ett sätt att visa kunskaperna om samhället är att klara medborgarskapsprovet i samhällskunskap. Universitets- och högskolerådet (UHR) ansvarar för provet.",
        "Provet införs i steg. Det första provet i samhällskunskap hölls i augusti 2026. Ett prov i svenska språket kommer senare.",
      ],
    },
    {
      heading: "Vem ska skriva provet?",
      paragraphs: [
        "Migrationsverket avgör vem som ska skriva provet. Du kan bara anmäla dig om du har fått ett brev (anvisningsbrev) från Migrationsverket.",
        "I vissa fall kan du visa kunskaperna på andra sätt, till exempel med betyg. Då behöver du inte skriva provet. Frågor om ditt ärende ställer du till Migrationsverket.",
      ],
    },
    {
      heading: "När är nästa prov?",
      paragraphs: [
        "Enligt UHR planeras nästa prov i samhällskunskap till april–maj 2027. Datum, orter och när anmälan öppnar är inte publicerade än. Anmälningsavgiften är inte heller bestämd.",
      ],
    },
    {
      heading: "Hur ser provet ut?",
      bullets: [
        "Provet är bara på svenska. Det går inte att skriva det på sitt modersmål.",
        "Det skrivs på papper.",
        "Alla frågor är flervalsfrågor med fyra svarsalternativ, där ett är rätt.",
        "Det finns inga minuspoäng – svara därför på alla frågor.",
        "Provtid och antal frågor för nästa prov är inte publicerade än.",
      ],
    },
    {
      heading: "Vad ska jag läsa?",
      paragraphs: [
        "Provet bygger på UHR:s studiematerial Sverige i fokus. Det är gratis och finns som PDF hos UHR. Materialet har 13 kapitel:",
      ],
      chapters: true,
    },
    {
      heading: "Provdagen – kom ihåg",
      bullets: [
        "Ta med giltig svensk id-handling: id-kort från Skatteverket, svenskt körkort eller svenskt SIS-märkt id-kort. Utländskt pass och e-legitimation räcker inte.",
        "Skriv ut kallelsen som kommer till ditt anmälningskonto och ta med den.",
        "Mobil, smarta klockor och hörlurar får inte vara med vid skrivplatsen.",
        "Kom i god tid – det kan bli kö vid id-kontrollen.",
      ],
    },
    {
      heading: "Behöver du anpassning?",
      paragraphs: [
        "Har du till exempel dyslexi, ADHD eller nedsatt syn kan du ansöka om anpassning, som förlängd provtid eller större text. Oftast behöver du ett intyg.",
      ],
    },
    {
      heading: "Så förbereder du dig",
      bullets: [
        "Läs ett kapitel i taget i Sverige i fokus.",
        "Öva på frågor på svenska – precis som på provet.",
        "Läs förklaringen på ditt eget språk när något är svårt.",
        "Repetera frågorna du har svarat fel på tills du kan dem.",
        "Gör ett helt övningsprov med klocka innan provdagen.",
      ],
    },
  ],
  ctaTitle: "Börja öva gratis",
  ctaText: "Testa 15 frågor gratis utan konto – på svenska som på provet, med förklaringar på ditt språk.",
  ctaButton: "Öva gratis nu",
  sourcesTitle: "Källor",
  sourcesText:
    "Fakta i guiden kommer från UHR:s och Migrationsverkets webbplatser och kontrollerades {date}. Reglerna kan ändras – kontrollera alltid aktuell information hos UHR och Migrationsverket. Medborgarhjälpen är en privat övningstjänst och inte kopplad till någon myndighet.",
  linkUhr: "UHR – Medborgarskapsprovet",
  linkMaterial: "UHR – Sverige i fokus (gratis studiematerial)",
  linkAdjustments: "UHR – Anpassningar",
  linkMigrationsverket: "Migrationsverket – Medborgarskap för vuxna",
};

const en: Guide = {
  metaTitle: "Swedish citizenship test 2027 – everything you need to know",
  metaDescription:
    "Who has to take the Swedish citizenship test, when is the next test, what does it look like and how do you prepare? A simple guide based on UHR and the Swedish Migration Agency.",
  title: "The Swedish citizenship test – everything you need to know",
  intro:
    "A simple overview of the citizenship test in civics (samhällskunskap): who has to take it, when the next test is, what the test looks like and how to prepare.",
  sections: [
    {
      heading: "What is the citizenship test?",
      paragraphs: [
        "New rules for becoming a Swedish citizen apply from 6 June 2026. One requirement is basic knowledge of Swedish and of Swedish society. One way to show your knowledge of society is to pass the citizenship test in civics. The Swedish Council for Higher Education (UHR) is responsible for the test.",
        "The test is being introduced step by step. The first civics test was held in August 2026. A test in the Swedish language will come later.",
      ],
    },
    {
      heading: "Who has to take the test?",
      paragraphs: [
        "The Swedish Migration Agency (Migrationsverket) decides who should take the test. You can only register if you have received a letter (anvisningsbrev) from the Migration Agency.",
        "In some cases you can show your knowledge in other ways, for example with school grades. Then you don't need to take the test. Ask the Migration Agency about your own case.",
      ],
    },
    {
      heading: "When is the next test?",
      paragraphs: [
        "According to UHR, the next civics test is planned for April–May 2027. Dates, locations and when registration opens have not been published yet. The registration fee has not been decided either.",
      ],
    },
    {
      heading: "What does the test look like?",
      bullets: [
        "The test is only in Swedish. You cannot take it in your native language.",
        "It is taken on paper.",
        "All questions are multiple choice with four options, one of which is correct.",
        "There are no minus points – so answer every question.",
        "The test time and number of questions for the next test have not been published yet.",
      ],
    },
    {
      heading: "What should I read?",
      paragraphs: [
        "The test is based on UHR's study material Sverige i fokus. It is free and available as a PDF from UHR (in Swedish). It has 13 chapters:",
      ],
      chapters: true,
    },
    {
      heading: "Test day – remember",
      bullets: [
        "Bring valid Swedish ID: an ID card from the Swedish Tax Agency (Skatteverket), a Swedish driving licence or a Swedish SIS-marked ID card. A foreign passport or e-ID is not enough.",
        "Print the notice (kallelse) that appears in your registration account and bring it.",
        "Phones, smartwatches and headphones are not allowed at your desk.",
        "Arrive early – there may be a queue at the ID check.",
      ],
    },
    {
      heading: "Do you need adjustments?",
      paragraphs: [
        "If you have, for example, dyslexia, ADHD or impaired vision, you can apply for adjustments such as extra time or larger text. You usually need a certificate.",
      ],
    },
    {
      heading: "How to prepare",
      bullets: [
        "Read one chapter at a time in Sverige i fokus.",
        "Practise questions in Swedish – just like the real test.",
        "Read the explanation in your own language when something is difficult.",
        "Repeat the questions you got wrong until you know them.",
        "Take a full timed practice test before test day.",
      ],
    },
  ],
  ctaTitle: "Start practising for free",
  ctaText: "Try 15 questions for free without an account – in Swedish like the real test, with explanations in your language.",
  ctaButton: "Practise for free",
  sourcesTitle: "Sources",
  sourcesText:
    "The facts in this guide come from the websites of UHR and the Swedish Migration Agency and were checked on {date}. Rules can change – always check the latest information with UHR and the Migration Agency. Medborgarhjälpen is a private practice service and is not affiliated with any authority.",
  linkUhr: "UHR – The citizenship test (Swedish)",
  linkMaterial: "UHR – Sverige i fokus (free study material)",
  linkAdjustments: "UHR – Adjustments (Swedish)",
  linkMigrationsverket: "Migration Agency – Citizenship for adults",
};

const ar: Guide = {
  metaTitle: "اختبار الجنسية السويدية 2027 – كل ما تحتاج معرفته",
  metaDescription:
    "من يجب أن يخوض اختبار الجنسية السويدية، ومتى الاختبار القادم، وكيف يبدو، وكيف تستعد؟ دليل بسيط يعتمد على معلومات UHR ومصلحة الهجرة.",
  title: "اختبار الجنسية السويدية – كل ما تحتاج معرفته",
  intro:
    "نظرة عامة بسيطة على اختبار الجنسية في التربية المدنية (المعرفة بالمجتمع): من يجب أن يخوضه، ومتى الاختبار القادم، وكيف يبدو، وكيف تستعد له.",
  sections: [
    {
      heading: "ما هو اختبار الجنسية؟",
      paragraphs: [
        "منذ 6 يونيو 2026 تسري قواعد جديدة للحصول على الجنسية السويدية. أحد الشروط هو معرفة أساسية باللغة السويدية وبالمجتمع السويدي. إحدى طرق إثبات معرفتك بالمجتمع هي النجاح في اختبار الجنسية في المعرفة بالمجتمع. مجلس الجامعات والمعاهد العليا (UHR) هو المسؤول عن الاختبار.",
        "يُطبَّق الاختبار على مراحل. أُجري أول اختبار في المعرفة بالمجتمع في أغسطس 2026. وسيأتي اختبار في اللغة السويدية لاحقًا.",
      ],
    },
    {
      heading: "من يجب أن يخوض الاختبار؟",
      paragraphs: [
        "مصلحة الهجرة (Migrationsverket) هي التي تقرر من يجب أن يخوض الاختبار. لا يمكنك التسجيل إلا إذا تلقيت رسالة (anvisningsbrev) من مصلحة الهجرة.",
        "في بعض الحالات يمكنك إثبات معرفتك بطرق أخرى، مثل الدرجات المدرسية، وعندها لا تحتاج إلى الاختبار. اسأل مصلحة الهجرة عن حالتك.",
      ],
    },
    {
      heading: "متى الاختبار القادم؟",
      paragraphs: [
        "بحسب UHR، من المخطط إجراء اختبار المعرفة بالمجتمع القادم في أبريل–مايو 2027. لم تُنشر بعد المواعيد والأماكن وموعد فتح التسجيل. ولم تُحدَّد رسوم التسجيل بعد.",
      ],
    },
    {
      heading: "كيف يبدو الاختبار؟",
      bullets: [
        "الاختبار باللغة السويدية فقط، ولا يمكن إجراؤه بلغتك الأم.",
        "يُجرى على الورق.",
        "جميع الأسئلة اختيار من متعدد بأربعة خيارات، واحد منها صحيح.",
        "لا توجد نقاط سالبة – لذلك أجب عن كل الأسئلة.",
        "لم تُنشر بعد مدة الاختبار القادم وعدد أسئلته.",
      ],
    },
    {
      heading: "ماذا أقرأ؟",
      paragraphs: [
        "يعتمد الاختبار على مادة UHR الدراسية Sverige i fokus. وهي مجانية ومتاحة بصيغة PDF لدى UHR (باللغة السويدية). تتكون من 13 فصلًا:",
      ],
      chapters: true,
    },
    {
      heading: "يوم الاختبار – تذكّر",
      bullets: [
        "أحضر وثيقة هوية سويدية سارية: بطاقة هوية من مصلحة الضرائب (Skatteverket) أو رخصة قيادة سويدية أو بطاقة هوية سويدية بعلامة SIS. جواز السفر الأجنبي والهوية الإلكترونية لا يكفيان.",
        "اطبع الاستدعاء (kallelse) الذي يظهر في حساب التسجيل وأحضره معك.",
        "لا يُسمح بالهاتف والساعات الذكية وسماعات الأذن عند مكان الكتابة.",
        "احضر مبكرًا – قد يكون هناك طابور عند التحقق من الهوية.",
      ],
    },
    {
      heading: "هل تحتاج إلى تسهيلات؟",
      paragraphs: [
        "إذا كان لديك مثلًا عسر القراءة أو اضطراب ADHD أو ضعف في البصر، يمكنك طلب تسهيلات مثل وقت إضافي أو خط أكبر. غالبًا تحتاج إلى شهادة.",
      ],
    },
    {
      heading: "كيف تستعد",
      bullets: [
        "اقرأ فصلًا واحدًا في كل مرة من Sverige i fokus.",
        "تدرّب على الأسئلة باللغة السويدية – تمامًا كما في الاختبار.",
        "اقرأ الشرح بلغتك عندما يكون شيء ما صعبًا.",
        "كرّر الأسئلة التي أخطأت فيها حتى تتقنها.",
        "قم باختبار تجريبي كامل مع مؤقت قبل يوم الاختبار.",
      ],
    },
  ],
  ctaTitle: "ابدأ التدريب مجانًا",
  ctaText: "جرّب 15 سؤالًا مجانًا بدون حساب – باللغة السويدية كما في الاختبار، مع شرح بلغتك.",
  ctaButton: "تدرّب مجانًا الآن",
  sourcesTitle: "المصادر",
  sourcesText:
    "المعلومات في هذا الدليل مأخوذة من موقعي UHR ومصلحة الهجرة وتم التحقق منها في {date}. قد تتغير القواعد – تحقق دائمًا من أحدث المعلومات لدى UHR ومصلحة الهجرة. Medborgarhjälpen خدمة تدريب خاصة وغير مرتبطة بأي جهة حكومية.",
  linkUhr: "UHR – اختبار الجنسية (بالسويدية)",
  linkMaterial: "UHR – Sverige i fokus (مادة دراسية مجانية)",
  linkAdjustments: "UHR – التسهيلات (بالسويدية)",
  linkMigrationsverket: "مصلحة الهجرة – الجنسية للبالغين",
};

const fa: Guide = {
  metaTitle: "آزمون تابعیت سوئد ۲۰۲۷ – هر آنچه باید بدانید",
  metaDescription:
    "چه کسی باید آزمون تابعیت سوئد را بدهد، آزمون بعدی کی است، چه شکلی دارد و چطور آماده شوید؟ راهنمایی ساده بر اساس اطلاعات UHR و اداره مهاجرت.",
  title: "آزمون تابعیت سوئد – هر آنچه باید بدانید",
  intro:
    "نگاهی ساده به آزمون تابعیت در دانش اجتماعی: چه کسی باید آن را بدهد، آزمون بعدی کی است، آزمون چه شکلی دارد و چطور آماده شوید.",
  sections: [
    {
      heading: "آزمون تابعیت چیست؟",
      paragraphs: [
        "از ۶ ژوئن ۲۰۲۶ قوانین جدیدی برای گرفتن تابعیت سوئد اجرا می‌شود. یکی از شرط‌ها دانش پایه از زبان سوئدی و جامعهٔ سوئد است. یکی از راه‌های نشان دادن دانش اجتماعی، قبولی در آزمون تابعیت در دانش اجتماعی است. شورای دانشگاه‌ها و مؤسسات آموزش عالی (UHR) مسئول این آزمون است.",
        "آزمون مرحله‌به‌مرحله اجرا می‌شود. نخستین آزمون دانش اجتماعی در اوت ۲۰۲۶ برگزار شد. آزمون زبان سوئدی بعداً اضافه می‌شود.",
      ],
    },
    {
      heading: "چه کسی باید آزمون بدهد؟",
      paragraphs: [
        "ادارهٔ مهاجرت (Migrationsverket) تعیین می‌کند چه کسی باید آزمون بدهد. فقط وقتی می‌توانید ثبت‌نام کنید که از ادارهٔ مهاجرت نامه (anvisningsbrev) دریافت کرده باشید.",
        "در بعضی موارد می‌توانید دانش خود را به شکل‌های دیگر، مثلاً با نمره‌های مدرسه، نشان دهید و دیگر لازم نیست آزمون بدهید. دربارهٔ پروندهٔ خود از ادارهٔ مهاجرت بپرسید.",
      ],
    },
    {
      heading: "آزمون بعدی کی است؟",
      paragraphs: [
        "به گفتهٔ UHR، آزمون بعدی دانش اجتماعی برای آوریل تا مه ۲۰۲۷ برنامه‌ریزی شده است. تاریخ، محل و زمان باز شدن ثبت‌نام هنوز منتشر نشده است. هزینهٔ ثبت‌نام هم هنوز تعیین نشده است.",
      ],
    },
    {
      heading: "آزمون چه شکلی دارد؟",
      bullets: [
        "آزمون فقط به زبان سوئدی است و نمی‌توان آن را به زبان مادری داد.",
        "روی کاغذ برگزار می‌شود.",
        "همهٔ سؤال‌ها چهارگزینه‌ای هستند و یک گزینه درست است.",
        "نمرهٔ منفی وجود ندارد – پس به همهٔ سؤال‌ها پاسخ دهید.",
        "زمان آزمون و تعداد سؤال‌های آزمون بعدی هنوز منتشر نشده است.",
      ],
    },
    {
      heading: "چه بخوانم؟",
      paragraphs: [
        "آزمون بر اساس منبع آموزشی UHR به نام Sverige i fokus است. این منبع رایگان است و به صورت PDF نزد UHR (به زبان سوئدی) موجود است. ۱۳ فصل دارد:",
      ],
      chapters: true,
    },
    {
      heading: "روز آزمون – یادتان باشد",
      bullets: [
        "مدرک شناسایی معتبر سوئدی همراه داشته باشید: کارت شناسایی ادارهٔ مالیات (Skatteverket)، گواهینامهٔ رانندگی سوئدی یا کارت شناسایی سوئدی با نشان SIS. پاسپورت خارجی و شناسهٔ الکترونیکی کافی نیست.",
        "دعوت‌نامه (kallelse) را که در حساب ثبت‌نام شما می‌آید چاپ کنید و همراه بیاورید.",
        "موبایل، ساعت هوشمند و هدفون در محل نوشتن مجاز نیست.",
        "زود بیایید – ممکن است در بررسی مدارک صف باشد.",
      ],
    },
    {
      heading: "به شرایط ویژه نیاز دارید؟",
      paragraphs: [
        "اگر مثلاً دیسلکسی، ADHD یا کم‌بینایی دارید، می‌توانید برای شرایط ویژه مثل زمان بیشتر یا متن بزرگ‌تر درخواست دهید. معمولاً به گواهی نیاز دارید.",
      ],
    },
    {
      heading: "چطور آماده شوید",
      bullets: [
        "هر بار یک فصل از Sverige i fokus را بخوانید.",
        "سؤال‌ها را به زبان سوئدی تمرین کنید – درست مثل آزمون.",
        "وقتی چیزی سخت است، توضیح را به زبان خودتان بخوانید.",
        "سؤال‌هایی را که اشتباه جواب داده‌اید تکرار کنید تا یاد بگیرید.",
        "پیش از روز آزمون یک آزمون آزمایشی کامل با زمان‌سنج بدهید.",
      ],
    },
  ],
  ctaTitle: "رایگان تمرین را شروع کنید",
  ctaText: "۱۵ سؤال را رایگان و بدون حساب کاربری امتحان کنید – به زبان سوئدی مثل آزمون، با توضیحات به زبان شما.",
  ctaButton: "همین حالا رایگان تمرین کنید",
  sourcesTitle: "منابع",
  sourcesText:
    "اطلاعات این راهنما از وب‌سایت‌های UHR و ادارهٔ مهاجرت گرفته شده و در {date} بررسی شده است. قوانین ممکن است تغییر کنند – همیشه آخرین اطلاعات را نزد UHR و ادارهٔ مهاجرت بررسی کنید. Medborgarhjälpen یک سرویس تمرینی خصوصی است و به هیچ نهاد دولتی وابسته نیست.",
  linkUhr: "UHR – آزمون تابعیت (به سوئدی)",
  linkMaterial: "UHR – Sverige i fokus (منبع آموزشی رایگان)",
  linkAdjustments: "UHR – شرایط ویژه (به سوئدی)",
  linkMigrationsverket: "ادارهٔ مهاجرت – تابعیت برای بزرگسالان",
};

const so: Guide = {
  metaTitle: "Imtixaanka dhalashada Iswiidhan 2027 – wax kasta oo aad u baahan tahay",
  metaDescription:
    "Yaa gali doona imtixaanka dhalashada Iswiidhan, goorma ayuu yahay imtixaanka xiga, sidee ayuu u eg yahay, sideense loogu diyaargaroobaa? Hage fudud oo ku salaysan UHR iyo Hay'adda Socdaalka.",
  title: "Imtixaanka dhalashada Iswiidhan – wax kasta oo aad u baahan tahay",
  intro:
    "Dulmar fudud oo ku saabsan imtixaanka dhalashada ee aqoonta bulshada: yaa gali doona, goorma ayuu yahay imtixaanka xiga, sida uu u eg yahay iyo sida loogu diyaargaroobo.",
  sections: [
    {
      heading: "Waa maxay imtixaanka dhalashada?",
      paragraphs: [
        "Laga bilaabo 6 Juun 2026 waxaa dhaqan galay sharciyo cusub oo lagu helo dhalashada Iswiidhan. Mid ka mid ah shuruudaha waa aqoon aasaasi ah oo luqadda Iswiidhishka iyo bulshada Iswiidhan ah. Hal hab oo lagu muujiyo aqoonta bulshada waa in aad ku guulaysato imtixaanka dhalashada ee aqoonta bulshada. Golaha Jaamacadaha iyo Machadyada Sare (UHR) ayaa mas'uul ka ah imtixaanka.",
        "Imtixaanka waxaa loo hirgelinayaa tallaabo tallaabo. Imtixaankii ugu horreeyay ee aqoonta bulshada waxaa la qaaday Agoosto 2026. Imtixaan luqadda Iswiidhishka ah ayaa imaan doona hadhow.",
      ],
    },
    {
      heading: "Yaa gali doona imtixaanka?",
      paragraphs: [
        "Hay'adda Socdaalka (Migrationsverket) ayaa go'aamisa cidda gali doonta imtixaanka. Waxaad isku diiwaangelin kartaa oo keliya haddii aad warqad (anvisningsbrev) ka heshay Hay'adda Socdaalka.",
        "Mararka qaarkood waxaad aqoontaada ku muujin kartaa siyaabo kale, tusaale ahaan dhibcaha dugsiga, markaas uma baahnid imtixaanka. Kiiskaaga wax ka weydii Hay'adda Socdaalka.",
      ],
    },
    {
      heading: "Goorma ayuu yahay imtixaanka xiga?",
      paragraphs: [
        "Sida uu sheegay UHR, imtixaanka xiga ee aqoonta bulshada waxaa loo qorsheeyay Abriil–Maajo 2027. Taariikhaha, goobaha iyo goorta diiwaangelintu furmayso weli lama daabicin. Lacagta diiwaangelinta sidoo kale weli lama go'aamin.",
      ],
    },
    {
      heading: "Sidee buu u eg yahay imtixaanku?",
      bullets: [
        "Imtixaanku waa Iswiidhish oo keliya. Laguma qaadan karo afkaaga hooyo.",
        "Waxaa lagu qoraa warqad.",
        "Dhammaan su'aaluhu waa doorasho badan oo leh afar jawaab, mid ayaa sax ah.",
        "Ma jiraan dhibco laga jaro – sidaa darteed ka jawaab su'aal kasta.",
        "Waqtiga iyo tirada su'aalaha imtixaanka xiga weli lama daabicin.",
      ],
    },
    {
      heading: "Maxaan akhriyaa?",
      paragraphs: [
        "Imtixaanku wuxuu ku salaysan yahay buugga waxbarashada ee UHR ee Sverige i fokus. Waa bilaash, waxaana laga heli karaa PDF ahaan UHR (Iswiidhish). Wuxuu leeyahay 13 cutub:",
      ],
      chapters: true,
    },
    {
      heading: "Maalinta imtixaanka – xusuuso",
      bullets: [
        "Keen aqoonsi Iswiidhish ah oo ansax ah: kaarka aqoonsiga ee Hay'adda Canshuuraha (Skatteverket), liisanka darawalnimada Iswiidhan ama kaarka aqoonsiga Iswiidhan ee leh calaamadda SIS. Baasaboor shisheeye iyo aqoonsi elektaroonig ah kuma filna.",
        "Daabac yeedhitaanka (kallelse) ee ka soo muuqda akoonkaaga diiwaangelinta oo keen.",
        "Taleefanka, saacadaha casriga ah iyo dhegaha-dhegeysiga looma oggola goobta qorista.",
        "Goor hore imow – waxaa laga yaabaa in saf ka jiro hubinta aqoonsiga.",
      ],
    },
    {
      heading: "Ma u baahan tahay habayn gaar ah?",
      paragraphs: [
        "Haddii aad leedahay tusaale ahaan dyslexia, ADHD ama aragti daciif ah, waxaad codsan kartaa habayn sida waqti dheeraad ah ama qoraal weyn. Inta badan waxaad u baahan tahay shahaado.",
      ],
    },
    {
      heading: "Sida loo diyaargaroobo",
      bullets: [
        "Akhri hal cutub markiiba oo ka mid ah Sverige i fokus.",
        "Ku tababaro su'aalaha Iswiidhish – sida imtixaanka oo kale.",
        "Akhri sharaxaadda afkaaga marka wax adag yihiin.",
        "Ku celi su'aalaha aad khaldantay ilaa aad ka barato.",
        "Samee imtixaan tijaabo ah oo dhammaystiran oo saacad leh ka hor maalinta imtixaanka.",
      ],
    },
  ],
  ctaTitle: "Bilow tababarka bilaash",
  ctaText: "Isku day 15 su'aalood bilaash, akoon la'aan – Iswiidhish sida imtixaanka, sharaxaadna afkaaga.",
  ctaButton: "Hadda bilaash ku tababaro",
  sourcesTitle: "Ilaha",
  sourcesText:
    "Xogta hagahan waxaa laga soo qaaday bogagga UHR iyo Hay'adda Socdaalka, waxaana la hubiyay {date}. Sharciyadu way isbeddeli karaan – had iyo jeer ka hubi macluumaadka ugu dambeeyay UHR iyo Hay'adda Socdaalka. Medborgarhjälpen waa adeeg tababar oo gaar ah, kumana xirna hay'ad dawladeed.",
  linkUhr: "UHR – Imtixaanka dhalashada (Iswiidhish)",
  linkMaterial: "UHR – Sverige i fokus (buug waxbarasho oo bilaash ah)",
  linkAdjustments: "UHR – Habaynta gaarka ah (Iswiidhish)",
  linkMigrationsverket: "Hay'adda Socdaalka – Dhalashada dadka waaweyn",
};

const ti: Guide = {
  metaTitle: "ፈተና ዜግነት ሽወደን 2027 – ክትፈልጦ ዘለካ ኩሉ",
  metaDescription:
    "መን እዩ ፈተና ዜግነት ሽወደን ዝወስድ፣ ዝቕጽል ፈተና መዓስ እዩ፣ ከመይ ይመስል፣ ከመይ ትዳሎ? ኣብ UHRን ቤት ጽሕፈት ስደትን ዝተመርኮሰ ቀሊል መምርሒ።",
  title: "ፈተና ዜግነት ሽወደን – ክትፈልጦ ዘለካ ኩሉ",
  intro:
    "ብዛዕባ ፈተና ዜግነት ኣብ ፍልጠት ሕብረተሰብ ቀሊል ሓበሬታ፦ መን ይወስዶ፣ ዝቕጽል ፈተና መዓስ እዩ፣ እቲ ፈተና ከመይ ይመስል፣ ከመይ ከም እትዳሎን።",
  sections: [
    {
      heading: "ፈተና ዜግነት እንታይ እዩ?",
      paragraphs: [
        "ካብ 6 ሰነ 2026 ጀሚሩ ሽወደናዊ ዜግነት ንምርካብ ሓደስቲ ሕግታት ይሰርሑ። ሓደ ካብቶም ቅድመ ኩነታት መሰረታዊ ፍልጠት ቋንቋ ሽወደንን ሕብረተሰብ ሽወደንን እዩ። ፍልጠት ሕብረተሰብ ንምርኣይ ሓደ መንገዲ፣ ፈተና ዜግነት ኣብ ፍልጠት ሕብረተሰብ ምሕላፍ እዩ። ባይቶ ዩኒቨርሲታትን ላዕለዎት ትምህርቲ ትካላትን (UHR) ሓላፍነት ናይቲ ፈተና ኣለዎ።",
        "እቲ ፈተና ብደረጃ ይትግበር። እቲ ቀዳማይ ፈተና ፍልጠት ሕብረተሰብ ኣብ ነሓሰ 2026 ተኻይዱ። ፈተና ቋንቋ ሽወደን ድሒሩ ክመጽእ እዩ።",
      ],
    },
    {
      heading: "መን እዩ ነቲ ፈተና ዝወስድ?",
      paragraphs: [
        "ቤት ጽሕፈት ስደት (Migrationsverket) እዩ መን ፈተና ከም ዝወስድ ዝውስን። ካብ ቤት ጽሕፈት ስደት ደብዳበ (anvisningsbrev) እንተ ተቐቢልካ ጥራይ እዩ ክትምዝገብ እትኽእል።",
        "ኣብ ገለ ኩነታት ፍልጠትካ ብኻልእ መንገዲ ክትገልጽ ትኽእል፣ ንኣብነት ብነጥቢ ትምህርቲ፣ ሽዑ ፈተና ኣየድልየካን። ብዛዕባ ጉዳይካ ንቤት ጽሕፈት ስደት ሕተት።",
      ],
    },
    {
      heading: "ዝቕጽል ፈተና መዓስ እዩ?",
      paragraphs: [
        "ከም ዝበሎ UHR፣ ዝቕጽል ፈተና ፍልጠት ሕብረተሰብ ኣብ ሚያዝያ–ግንቦት 2027 ክካየድ ተመዲቡ ኣሎ። ዕለታት፣ ቦታታትን ምዝገባ መዓስ ከም ዝኽፈትን ገና ኣይተሓበረን። ክፍሊት ምዝገባ ውን ገና ኣይተወሰነን።",
      ],
    },
    {
      heading: "እቲ ፈተና ከመይ ይመስል?",
      bullets: [
        "እቲ ፈተና ብሽወድኛ ጥራይ እዩ። ብቋንቋ ኣዴኻ ክትወስዶ ኣይከኣልን።",
        "ኣብ ወረቐት ይጽሓፍ።",
        "ኩሎም ሕቶታት ኣርባዕተ ምርጫ ዘለዎም እዮም፣ ሓደ ካብኦም ቅኑዕ እዩ።",
        "ዝጐድል ነጥቢ የለን – ስለዚ ንኹሉ ሕቶ መልሲ ሃብ።",
        "ግዜን ብዝሒ ሕቶታትን ናይቲ ዝቕጽል ፈተና ገና ኣይተሓበረን።",
      ],
    },
    {
      heading: "እንታይ ከንብብ ኣለኒ?",
      paragraphs: [
        "እቲ ፈተና ኣብ ናይ UHR መጽናዕቲ Sverige i fokus ዝተመርኮሰ እዩ። ብነጻ እዩ፣ ከም PDF ኣብ UHR (ብሽወድኛ) ይርከብ። 13 ምዕራፋት ኣለዉዎ፦",
      ],
      chapters: true,
    },
    {
      heading: "መዓልቲ ፈተና – ዘክር",
      bullets: [
        "ዝሰርሕ ሽወደናዊ መንነት ሒዝካ ምጻእ፦ ካብ ቤት ጽሕፈት ግብሪ (Skatteverket) ዝተዋህበ መንነት፣ ሽወደናዊ መንጃ ፍቓድ ወይ SIS ምልክት ዘለዎ ሽወደናዊ መንነት። ናይ ወጻኢ ፓስፖርትን ኤሌክትሮኒካዊ መንነትን ኣይኣኽሉን።",
        "ኣብ ሕሳብ ምዝገባኻ ዝመጽእ ጻውዒት (kallelse) ሕተሞ፣ ሒዝካዮ ምጻእ።",
        "ሞባይል፣ ስማርት ሰዓትን ሰማዕቲ እዝንን ኣብ ቦታ ጽሕፈት ኣይፍቀዱን።",
        "ኣቐዲምካ ምጻእ – ኣብ ምርመራ መንነት መስርዕ ክህሉ ይኽእል እዩ።",
      ],
    },
    {
      heading: "ፍሉይ ምትዕርራይ የድልየካ ዶ?",
      paragraphs: [
        "ንኣብነት ዲስለክሲያ፣ ADHD ወይ ድኹም ርእዮት እንተ ኣልዩካ፣ ከም ተወሳኺ ግዜ ወይ ዓቢ ጽሑፍ ዝኣመሰለ ምትዕርራይ ክትሓትት ትኽእል። መብዛሕትኡ ግዜ ምስክር ወረቐት የድልየካ።",
      ],
    },
    {
      heading: "ከመይ ትዳሎ",
      bullets: [
        "ካብ Sverige i fokus ሓደ ምዕራፍ ብሓደ ኣንብብ።",
        "ሕቶታት ብሽወድኛ ተለማመድ – ከምቲ ፈተና።",
        "ዝኸበደካ ነገር እንተ ሃልዩ መብርሂ ብቋንቋኻ ኣንብብ።",
        "ዝተጋገኻዮም ሕቶታት ክሳብ እትፈልጦም ደጋግም።",
        "ቅድሚ መዓልቲ ፈተና ምሉእ ናይ ልምምድ ፈተና ምስ ሰዓት ግበር።",
      ],
    },
  ],
  ctaTitle: "ብነጻ ምልምማድ ጀምር",
  ctaText: "15 ሕቶታት ብነጻ ብዘይ ሕሳብ ፈትን – ብሽወድኛ ከም ኣብቲ ፈተና፣ መብርሂ ድማ ብቋንቋኻ።",
  ctaButton: "ሕጂ ብነጻ ተለማመድ",
  sourcesTitle: "ምንጭታት",
  sourcesText:
    "እቲ ሓበሬታ ኣብዚ መምርሒ ካብ መርበብ ሓበሬታ UHRን ቤት ጽሕፈት ስደትን ዝተወስደ ኮይኑ ኣብ {date} ተረጋጊጹ። ሕግታት ክቕየሩ ይኽእሉ – ኩሉ ግዜ ሓድሽ ሓበሬታ ኣብ UHRን ቤት ጽሕፈት ስደትን ኣረጋግጽ። Medborgarhjälpen ብሕታዊ ናይ ልምምድ ኣገልግሎት እዩ፣ ምስ ዝኾነ መንግስታዊ ትካል ዝተኣሳሰረ ኣይኮነን።",
  linkUhr: "UHR – ፈተና ዜግነት (ብሽወድኛ)",
  linkMaterial: "UHR – Sverige i fokus (ናጻ መጽናዕቲ)",
  linkAdjustments: "UHR – ፍሉይ ምትዕርራይ (ብሽወድኛ)",
  linkMigrationsverket: "ቤት ጽሕፈት ስደት – ዜግነት ንዓበይቲ",
};

const ckb: Guide = {
  metaTitle: "تاقیکردنەوەی ڕەگەزنامەی سوید 2027 – هەموو ئەوەی پێویستە بیزانیت",
  metaDescription:
    "کێ دەبێت تاقیکردنەوەی ڕەگەزنامەی سوید بکات، تاقیکردنەوەی داهاتوو کەیە، چۆنە و چۆن خۆت ئامادە دەکەیت؟ ڕێنمایییەکی سادە لەسەر بنەمای زانیارییەکانی UHR و دەزگای کۆچ.",
  title: "تاقیکردنەوەی ڕەگەزنامەی سوید – هەموو ئەوەی پێویستە بیزانیت",
  intro:
    "تێڕوانینێکی سادە بۆ تاقیکردنەوەی ڕەگەزنامە لە زانستی کۆمەڵایەتی: کێ دەبێت بیکات، تاقیکردنەوەی داهاتوو کەیە، چۆنە و چۆن خۆت ئامادە بکەیت.",
  sections: [
    {
      heading: "تاقیکردنەوەی ڕەگەزنامە چییە؟",
      paragraphs: [
        "لە 6ی حوزەیرانی 2026ەوە یاسای نوێ بۆ وەرگرتنی ڕەگەزنامەی سوید جێبەجێ دەکرێت. یەکێک لە مەرجەکان زانینی بنەڕەتیی زمانی سویدی و کۆمەڵگای سویدە. یەکێک لە ڕێگاکانی نیشاندانی زانینی کۆمەڵگا، دەرچوونە لە تاقیکردنەوەی ڕەگەزنامە لە زانستی کۆمەڵایەتی. ئەنجومەنی زانکۆ و پەیمانگا باڵاکان (UHR) بەرپرسیارە لە تاقیکردنەوەکە.",
        "تاقیکردنەوەکە قۆناغ بە قۆناغ جێبەجێ دەکرێت. یەکەم تاقیکردنەوەی زانستی کۆمەڵایەتی لە ئابی 2026 ئەنجامدرا. تاقیکردنەوەی زمانی سویدی دواتر دێت.",
      ],
    },
    {
      heading: "کێ دەبێت تاقیکردنەوەکە بکات؟",
      paragraphs: [
        "دەزگای کۆچ (Migrationsverket) بڕیار دەدات کێ تاقیکردنەوەکە بکات. تەنها کاتێک دەتوانیت ناو تۆمار بکەیت کە نامەیەکت (anvisningsbrev) لە دەزگای کۆچ وەرگرتبێت.",
        "لە هەندێک حاڵەتدا دەتوانیت زانینەکەت بە ڕێگای تر نیشان بدەیت، بۆ نموونە بە نمرەی قوتابخانە، ئەوکات پێویستت بە تاقیکردنەوە نییە. دەربارەی دۆسیەکەت پرسیار لە دەزگای کۆچ بکە.",
      ],
    },
    {
      heading: "تاقیکردنەوەی داهاتوو کەیە؟",
      paragraphs: [
        "بەپێی UHR، تاقیکردنەوەی داهاتووی زانستی کۆمەڵایەتی بۆ نیسان–ئایاری 2027 پلان دانراوە. بەروار، شوێن و کاتی کردنەوەی تۆمارکردن هێشتا بڵاو نەکراونەتەوە. کرێی تۆمارکردنیش هێشتا دیاری نەکراوە.",
      ],
    },
    {
      heading: "تاقیکردنەوەکە چۆنە؟",
      bullets: [
        "تاقیکردنەوەکە تەنها بە سویدییە. ناتوانیت بە زمانی دایکت بیکەیت.",
        "لەسەر کاغەز دەنووسرێت.",
        "هەموو پرسیارەکان هەڵبژاردنی چەندانەن بە چوار وەڵام، یەکێکیان ڕاستە.",
        "خاڵی سالب نییە – بۆیە وەڵامی هەموو پرسیارەکان بدەرەوە.",
        "کات و ژمارەی پرسیارەکانی تاقیکردنەوەی داهاتوو هێشتا بڵاو نەکراونەتەوە.",
      ],
    },
    {
      heading: "چی بخوێنمەوە؟",
      paragraphs: [
        "تاقیکردنەوەکە لەسەر بنەمای کەرەستەی خوێندنی UHR بە ناوی Sverige i fokus ە. بەخۆڕاییە و وەک PDF لای UHR (بە سویدی) بەردەستە. 13 بەشی هەیە:",
      ],
      chapters: true,
    },
    {
      heading: "ڕۆژی تاقیکردنەوە – لەبیرت بێت",
      bullets: [
        "ناسنامەیەکی سویدیی کارا بهێنە: کارتی ناسنامە لە دەزگای باج (Skatteverket)، مۆڵەتی شۆفێریی سویدی یان کارتی ناسنامەی سویدی بە نیشانەی SIS. پاسپۆرتی بیانی و ناسنامەی ئەلیکترۆنی بەس نین.",
        "بانگهێشتنامەکە (kallelse) کە لە هەژماری تۆمارکردنەکەت دەردەکەوێت چاپ بکە و لەگەڵ خۆت بیهێنە.",
        "مۆبایل، کاتژمێری زیرەک و گوێگر لە شوێنی نووسین ڕێگەپێدراو نین.",
        "زوو بێ – لەوانەیە لە پشکنینی ناسنامە ڕیز هەبێت.",
      ],
    },
    {
      heading: "پێویستت بە ڕێکخستنی تایبەت هەیە؟",
      paragraphs: [
        "ئەگەر بۆ نموونە دیسلێکسیا، ADHD یان بینینی لاواز هەیە، دەتوانیت داوای ڕێکخستنی تایبەت بکەیت وەک کاتی زیادە یان نووسینی گەورەتر. زۆربەی کات پێویستت بە بڕوانامە هەیە.",
      ],
    },
    {
      heading: "چۆن خۆت ئامادە بکەیت",
      bullets: [
        "هەر جارێک بەشێک لە Sverige i fokus بخوێنەوە.",
        "پرسیارەکان بە سویدی ڕاهێنان بکە – وەک تاقیکردنەوەکە.",
        "کاتێک شتێک قورسە، ڕوونکردنەوەکە بە زمانی خۆت بخوێنەوە.",
        "ئەو پرسیارانەی هەڵەت تێدا کردوون دووبارە بکەرەوە تا فێریان دەبیت.",
        "پێش ڕۆژی تاقیکردنەوە تاقیکردنەوەیەکی تەواوی ڕاهێنان لەگەڵ کاتژمێر بکە.",
      ],
    },
  ],
  ctaTitle: "بەخۆڕایی ڕاهێنان دەست پێبکە",
  ctaText: "15 پرسیار بەخۆڕایی و بێ هەژمار تاقی بکەرەوە – بە سویدی وەک تاقیکردنەوەکە، لەگەڵ ڕوونکردنەوە بە زمانی خۆت.",
  ctaButton: "ئێستا بەخۆڕایی ڕاهێنان بکە",
  sourcesTitle: "سەرچاوەکان",
  sourcesText:
    "زانیارییەکانی ئەم ڕێنماییە لە ماڵپەڕەکانی UHR و دەزگای کۆچ وەرگیراون و لە {date} پشکنراون. یاساکان لەوانەیە بگۆڕێن – هەمیشە نوێترین زانیاری لای UHR و دەزگای کۆچ بپشکنە. Medborgarhjälpen خزمەتگوزارییەکی ڕاهێنانی تایبەتە و پەیوەندی بە هیچ دامەزراوەیەکی حکومییەوە نییە.",
  linkUhr: "UHR – تاقیکردنەوەی ڕەگەزنامە (بە سویدی)",
  linkMaterial: "UHR – Sverige i fokus (کەرەستەی خوێندنی بەخۆڕایی)",
  linkAdjustments: "UHR – ڕێکخستنی تایبەت (بە سویدی)",
  linkMigrationsverket: "دەزگای کۆچ – ڕەگەزنامە بۆ گەورەساڵان",
};

export const GUIDES: Partial<Record<LanguageCode, Guide>> = { sv, en, ar, fa, so, ti, ckb };

export { GUIDE_LANGUAGES, guidePath, hasGuide } from "./guideLanguages";
