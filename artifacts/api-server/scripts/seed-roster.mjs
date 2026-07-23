// Seed the REAL Island Haven talent roster (61 members) into roster_members.
// Source: the official "المقبولين النهائي" roster provided by IH admin.
// Public fields (name/type/gender/skill) are exact; sensitive fields
// (phone/birthYear/cv/internetUser/days/period/seat) are stored but served
// ONLY through the admin API; LinkedIn is stored with linkedin_public=false.
//
//   node scripts/seed-roster.mjs | psql "$DATABASE_URL"
const S = "student", G = "graduate", F = "freelancer";
const M = "male", W = "female";

// [ref, name, type, gender, skill, days, period, seat, username, linkedin, phone, birthYear, cv]
const ROWS = [
  // ── Students (14) ──
  [1,"لمى أسامة زيد لبد",S,W,"Data Science / Data Analysis","أحد، تلاتاء، خميس","1 إلى 5",13,"lama","https://www.linkedin.com/in/lama-lubbad-6619b8257","0567606645",2004,"https://drive.google.com/open?id=16kmTUtgLuw29-Jhb8h1cDd8xtYB4hrUy"],
  [2,"سجى عاهد ابراهيم الدردساوي",S,W,"Digital Marketing","أحد، تلاتاء، خميس","1 إلى 5",6,"saja","https://www.linkedin.com/in/saja-aldardasawi-250bb2259","0595177013",2004,"https://drive.google.com/open?id=1w_SoFOBN0bSXRYgHCaDtEjr_VJacez4f"],
  [3,"توجان نافذ أديب العكلوك",S,W,"Back End Developer","سبت، اثنين، اربعاء","9 إلى 1",6,"tojan","https://www.linkedin.com/in/tojan-al-aklook-bb015224b","0592346467",2003,"https://drive.google.com/open?id=1stCko7bKFmEGPXVSlFwf1tIGcKdzLBQp"],
  [4,"أسماء أحمد شفيق ساق الله",S,W,"Frontend Developer and UIUX Design","سبت، اتنين، اربعاء","9 إلى 1",7,"asmaa-s","https://www.linkedin.com/in/asmaa-saqallah-85b5713a3","0569269111",2003,"https://drive.google.com/open?id=105fGPg8TUAMOXrhOuPCcnZxCAuzqiZAS"],
  [5,"اسراء احمد شفيق ساق الله",S,W,"Graphic Design","احد،ثلاثاء،خميس","1 إلى 5",6,"esraa-s","https://www.linkedin.com/in/esraa-ahmed-b225263b5/","0568583331",2004,"https://drive.google.com/open?id=1G0hfzkBnQ4mviBRkQi1KsTMj7kM3iV-G"],
  [6,"ابراهيم سعيد ابراهيم ابو سيف",S,M,"Back End Developer","أحد، تلاتاء، خميس","9 إلى 1",19,"ibrahim-s","https://www.linkedin.com/in/ibrahim-abu-saif-394aa03b7","0598307048",2003,"https://drive.google.com/open?id=1uzVQvvVY8_TRX9asoT8gXMNASfWNvIqZ"],
  [7,"يوسف باسل يوسف الهبيل",S,M,"Data Science / Data Analysis","أحد، تلاتاء، خميس","1 إلى 5",19,"yousef-ha","","0597368936",2004,"https://drive.google.com/open?id=1SH4inM83ANUe2GXiacSZEwp0R4AkkzZf"],
  [8,"ترنيم شريف عبد الجواد عليان",S,W,"Data Analysis","أحد، تلاتاء، خميس","1 إلى 5",12,"tarneem","https://linkedin.com/in/tarneem-elyan-a8656b259","0597349979",2004,"https://docs.google.com/document/d/1QfKxJ6rIdOyYUJyqD0Sy7-Lvhoks-MPg9mBmYk44DSY/edit?usp=sharing"],
  [9,"محمد نضال محمد ابو عبدو",S,M,"video editing and other multimedia specializations","سبت، اثنين، أربعاء","9 إلى 1",19,"mohammed-abdo","","0595978124",2008,""],
  [10,"نور عصام يونس الحلو",S,W,"Digital Media","أحد، تلاتاء، خميس","1 إلى 5",12,"nour-h","https://www.linkedin.com/in/nour-esam-al-helou-a1605a3a4","0567634773",2002,"https://drive.google.com/open?id=1wFvUYTy-E0KND4RBBIBgJgJYmjfMMhYk"],
  [11,"محمود هشام محمود المدلل",S,M,"Back End Development","سبت، اثنين، أربعاء","1 إلى 5",19,"mo-dallal","https://www.linkedin.com/in/mahmoud-almodalal-7a296a360","0597747084",2003,"https://drive.google.com/open?id=19bltigVIRxpiBrQZkNOzg0xZyee64-yZ"],
  [12,"مرح أمجد رفيق قنديل",S,W,"Data Science / Data Analysis","أحد، ثلاثاء، خميس","9 إلى 1",6,"marah-qa","https://www.linkedin.com/in/marah-qandeel-9b2941291/","0598575704",2004,"https://drive.google.com/open?id=1fBwJpZ9nZoqIj0D5MrGYJzcCPPLf9irS"],
  [13,"غاليه حسام وصفي حرارة",S,W,"AI Engineering","أحد، ثلاثاء، خميس","9 إلى 1",7,"ghaliya","","0595330093",2002,""],
  [14,"سامر مصطفى اسماعيل قنوع",S,M,"Mobile Development","سبت، اثنين،","9 إلى 1",27,"samer-kan","","0595560332",2005,"https://drive.google.com/open?id=1XF1nynctW51iwAmQi5pkIETh4t_9TulK"],
  // ── Graduates (29) ──
  [15,"محمد مؤمن محمد شمعة",G,M,"Full Stack Development","ست، اثنين، أربعاء","كامل",31,"mohamad-sh","","0597744476",2004,""],
  [16,"أحمد فرج ياسر أحمد بعلوشة",G,M,"Back End Developer","أحد، ثلاثاء، خميس","كامل",29,"","https://www.linkedin.com/in/ahmedbalousha","0592554516",2000,"https://drive.google.com/open?id=1yvONHWgJ9Tn5RjlVmJDP8Ghm-LcOP7xf"],
  [17,"ملاك عماد الدين محمد عابد",G,W,"Back End Developer","ست، اثنين، أربعاء","كامل",10,"malak-ab","https://www.linkedin.com/in/malak-abed-907645271","0567004513",2004,"https://drive.google.com/open?id=1vNrYBpN5cgCy0vC2A-X5bXZfG5LhXynz"],
  [18,"عزالدين مجدي رزق شمالي",G,M,"Flutter Developer","احد،ثلاثاء،خميس","كامل",27,"ezz-shamali","http://www.linkedin.com/in/ezzdeen-shamaly","0595711623",2003,"https://drive.google.com/open?id=1cW1FKqruXdZl9mgrOCYfysl8G7cOceA2"],
  [19,"هيا محمد أحمد عبيد",G,W,"Mobile Development","احد،ثلاثاء،خميس","كامل",3,"haya-ab","https://www.linkedin.com/in/haya-obaid-01300625b/","0592359255",2002,"https://drive.google.com/open?id=1y04TTFJzMTgcq_VTWmrel2FQ_0DZUSRZ"],
  [20,"انغام سامي رمضان الشاعر",G,W,"UX/UI Design","سبت، أتنين، أربعاء","كامل",11,"angham","","0595435251",2004,"https://drive.google.com/open?id=1lZkt6a2CayGE2S08d6IKcqWMFtqM47ox"],
  [21,"هديل محمد طلب صالح",G,W,"Front End Developer","احد،ثلاثاء،خميس","كامل",10,"hadeel-s","https://www.linkedin.com/in/hadeel-saleh-312375376/","0599702446",2003,"https://drive.google.com/open?id=1pU6mr9viGUc5HxmSMm1SYXVX95eLeqh_"],
  [22,"آيات اسلام سلمان ايوب",G,W,"Full Stack Development","سبت، اثنين، أربعاء","كامل",5,"ayat","https://www.linkedin.com/in/ayatayyoub","0592497292",2002,"https://drive.google.com/open?id=1K9Nc53CXXS5Pd3bG_pDeG0XkS4j_GOzR"],
  [23,"دانا محمد صالح أبو الخير",G,W,"Instructor for Kids","سبت، اثنين، أربعاء","كامل",7,"dana","https://www.linkedin.com/in/dana-abu-alkhair-9aa6911a1/","0595663860",2002,""],
  [24,"ندى مهدي مصباح الجراح",G,W,"Mobile Development","سبت، اثنين، أربعاء","كامل",12,"nada","https://www.linkedin.com/in/nada-al-jarrah","0597370500",2000,"https://drive.google.com/open?id=13U04XP87HSlZ3lqD48dd_V9hBODXepsj"],
  [25,"شيماء ماجد يوسف حلس",G,W,"Translation and Content Writing","أحد، ثلاثاء، خميس","كامل",14,"shimaa","https://www.linkedin.com/in/shaimaa-helles-173191265/","0595346291",2001,"https://drive.google.com/open?id=1ALqLFjXFqRLmYCosBZsvp1BFyS9yQyMz"],
  [26,"أنس أشرف محمود الصفدي",G,M,"Mobile Development","سبت، اثنين، أربعاء","كامل",22,"anas-sa","https://www.linkedin.com/in/anas-alsafadi-7297b8394","0592204656",2003,"https://drive.google.com/open?id=1DDCxt5occodokE4XuKIyrFEcXerqrfV1"],
  [27,"مرح ناهض رمضان نعيم",G,W,"video editing and other multimedia specializations","سبت، اثنين، اربعاء","كامل",9,"marah","https://www.linkedin.com/in/marah-naim-39b434261/","0567249801",1999,"https://drive.google.com/open?id=1UPI5GxRHIfRk7KvliyYq602ZqRffndAH"],
  [28,"معاذ باسم جمال صيام",G,M,"Full Stack Development","أحد، تلاتاء، خميس","كامل",33,"moa-siam","https://www.linkedin.com/in/moaz-siam","0598297458",2003,"https://drive.google.com/open?id=1UG3pD4iwscMLwduUemlp6ICOOks8Zzpy"],
  [29,"أسيل عاطف شحادة عوض",G,W,"Mobile Development flutter","أحد، تلاتاء، خميس","كامل",11,"aseel-a","https://www.linkedin.com/in/asil-awad-675419240/","0592139424",2000,"https://drive.google.com/open?id=1fAIvoj_h1ZYh_8jHvx5dXdL72L19LHAI"],
  [30,"أحمد محمد احمد زغبر",G,M,"backend laravel","كامل","كامل",28,"ahmad-z","https://www.linkedin.com/in/ahmad-zughbor-242613252/","0592866801",2002,"https://drive.google.com/open?id=1ybNxrR7tHR-tT5b8DCQ4vtj1CGbi4nK-"],
  [32,"أحمد حسام بشير البربري",G,M,"Back End Developer","أحد، تلاتاء، خميس","كاملة",21,"ahmad-bar","https://www.linkedin.com/in/ahmed-al-barbari-bb8528244","0567190376",2002,"https://drive.google.com/open?id=1wv_jS_aJY42cH-L29jJm1KhsxcFda52O"],
  [33,"مروة فخري أحمد حمدان",G,W,"Motion Graphic","سبت، اثنين، أربعاء","كاملة",13,"marwa-ha","https://www.linkedin.com/in/marwaillustaion/","0595292784",2001,"https://drive.google.com/open?id=1P7mrdc1nE9Zhh-nD7BysjTR9IxemKs7d"],
  [34,"إبراهيم فلاح عبد حسونه",G,M,"Back End Developer","أحد، ثلاثاء، خميس","كاملة",29,"ibrahim-has","https://www.linkedin.com/in/ibrahim-hassoua-b364013aa/","0593280628",2005,"https://drive.google.com/open?id=1kisgizTjW8Qa3y6y9rlS7IPyP9SFIpUG"],
  [35,"أشرف سهيل أحمد الكحلوت",G,M,"Front End Developer","سبت، اثنين، أربعاء","كامل",21,"ashraf-k","https://www.linkedin.com/in/ashraf-s-alkahlout-2b9932340/","0599603688",2003,"https://drive.google.com/open?id=1x9I-HPErOhqWSLMueuEGuDdv2RI1ZMpv"],
  [36,"محمود عاطف عبد الرحمن عابد",G,M,"Full Stack Development","كامل","كامل",16,"mahmoud-ab","https://www.linkedin.com/in/mahmoud-a-abed-ab8758245","0597050715",2002,"https://drive.google.com/open?id=1xMGf1JYpu85CjK-KSo6ajm55G2vJUxFE"],
  [37,"محمد ناصر حسن شويخ",G,M,"Mobile Development","سبت، اثنين، أربعاء","كامل",15,"mohamad-sh","","0567680780",1999,"https://drive.google.com/open?id=16kmTUtgLuw29-Jhb8h1cDd8xtYB4hrUy"],
  [38,"عبدالفتاح نضال عبدالله سالم",G,M,"Back End Developer","سبت، اثنين، اربعاء","كامل",25,"abed-fattah","","0598045064",2001,"https://drive.google.com/open?id=1fNU7BY8EPW6Yt9JFDzdecde4XYYRAdwZ"],
  [39,"مها احمد ابراهيم الكحلوت",G,W,"Front End Developer","أحد، ثلاثاء، خميس","كامل",9,"maha-ka","https://www.linkedin.com/in/maha-alkahlout/","0592378853",2002,"https://drive.google.com/open?id=1FYhV74oLzd-T3LZ_NtjY96nESGrJQz99"],
  [40,"ندى عبد الكريم الكحلوت",G,W,"Back End Developer","أحد، ثلاثاء، خميس","كامل",4,"nada-ka","https://www.linkedin.com/in/nada-elkahlout-laravel/","0568188846",2002,"https://drive.google.com/open?id=1-JWsIige1Xuw394Fhorjf8sxACWHkgdi"],
  [41,"أحمد رجب حسن ثاري",G,M,"Front End Developer","سبت، اثنين، أربعاء","كامل",33,"","","0593656095",2003,""],
  [42,"وسيم مروان عدنان الجندي",G,M,"Mobile Development","سبت، اثنين، أربعاء","كامل",1,"","https://www.linkedin.com/in/wasem-aljundy-983ab73a6/","0592463727",2002,"https://drive.google.com/open?id=1LSSeMhSi6VgsAMngI4zA1P-bDOqEEyng"],
  [43,"محمد عطية عبدالله جودة",G,M,"Back End Developer","أحد، ثلاثاء، خميس","كامل",23,"","https://www.linkedin.com/in/mohammed-joudaa/","0599108787",2002,"Mohammed_Jouda_Resume - Mohammed Jouda.pdf"],
  [44,"نسمة طلال سلامة ابو يوسف",G,W,"Mobile Development","سبت، اثنين، أربعاء","كامل",4,"nesma-yo","","0594051920",2000,"https://drive.google.com/open?id=1Z-xlJ5FfEZj-s0sLg_Q9UypC1ID-pnn6"],
  // ── Freelancers (18) ──
  [45,"رياد أحمد عبد الرحمن بدر",F,M,"3D Multimedia","كامل","كامل",17,"riad-b","https://www.linkedin.com/in/reyad-bader-8722293a8","0599417615",1976,"https://drive.google.com/open?id=1Hg6auoCxcSpLeRMG4LICuHhQWiYRGGHQ"],
  [46,"محمد رباح أبراهيم شملخ",F,M,"UX/UI Design","كامل","كامل",32,"sham-ra","https://www.linkedin.com/in/mohamedshamlakh/","0599065415",1993,"https://drive.google.com/open?id=1BoPKBIYs_HmDonqLjUokOLNJiycZ0xN9"],
  [47,"محمد يوسف أحمد شملخ",F,M,"Motion Graphic","كامل","كامل",36,"sham-yo","https://www.linkedin.com/in/mohamedysh/","0597354404",1997,"https://drive.google.com/open?id=1OjS-T4oKIptDc-5YHNPn-cs33D9xXVQi"],
  [48,"احمد صبحي احمد الصادي",F,M,"Mobile Development","كامل","كامل",36,"ahmed-sa","https://www.linkedin.com/in/ahmed-al-sadi-8466246a","0599622866",1987,"https://drive.google.com/open?id=19L0IlmT7G0_a7u5P74J0sFRHN4yzzQsI"],
  [49,"محمد الهادي عليوة",F,M,"Full Stack Development","كامل","كامل",37,"mo-el","https://www.linkedin.com/in/mohammed-elewa-3542795a","0599450041",1983,"https://drive.google.com/open?id=1sxaw1V8ikKEWNlo5pOJZLm9HLNNVJvWX"],
  [50,"محمد أحمد عبدالفتاح الشوبكي",F,M,"Back End Developer","كامل","كامل",38,"mo-sh","https://www.linkedin.com/in/mohammed-alshobaki-697a7116b/","0567777437",1996,"https://drive.google.com/open?id=159n0rmfAaMpNUMJ5YtgZXYz0Zwc85-7T"],
  [51,"أحمد حسام الدين محمود الطويل",F,M,"Motion Graphic","كامل","كامل",30,"ah-ta","https://www.linkedin.com/in/ahmad-eltawil/","0597204869",2005,"https://drive.google.com/open?id=1QkrskiVV78lUq-8J7WC-lGTjLIccPNKH"],
  [52,"سمر نزار عبدالهادي نصار",F,W,"Artist &Infograpic designer","كامل","كامل",8,"samar","https://www.linkedin.com/in/samar-nassar-b36055156/","0599954246",1987,"https://drive.google.com/open?id=1AoXOoQ_CQyfdcQdKDp7CKx1x3ohS1Qs3"],
  [53,"حذيفة ماهر خضر جندية",F,M,"Translation and Content Writing","كامل","كامل",35,"hothaifa","https://www.linkedin.com/in/huthaifajendieh","0597716447",2001,"https://drive.google.com/open?id=1NQjKQZXF6KuFNw7rJ4-dGCsGukvsWleZ"],
  [54,"محمود سائد البورنو",F,M,"Motion Graphic","سبت، اثنين، أربعاء","كامل",15,"mahmoud-bo","https://www.linkedin.com/in/mhmoud-motion/","0598994925",2003,"https://drive.google.com/open?id=1A5mCi9jWi_6UlNuFzHjQjGoRekflJwgy"],
  [55,"محمود رياض سالم السقا",F,M,"Syber security and frontend react","أحد، تلاتاء، خميس","كامل",20,"ma-saqqa","https://www.linkedin.com/in/mahmoud-alsaqqa/","0597226023",1992,"https://drive.google.com/open?id=1dFfnPHYscXVoUIL3Zuzdv7RfxlxAXF4-"],
  [56,"احمد انور احمد الطلاع",F,M,"UX/UI Design","أحد، ثلاثاء، خميس","كامل",31,"","","0595209294",null,""],
  [57,"عبد الرحمن عماد حسين الغول",F,M,"Digital Marketing","أحد، ثلاثاء، خميس","كامل",25,"abed-goul","","0597214911",2001,""],
  [58,"اباء ايمن الخضري",F,W,"Digital artist","سبت، اثنين، اربعاء","كامل",3,"ebaa","","0599900616",1992,""],
  [59,"أحمد عادل يوسف المجدلاوي",F,M,"Mobile Development","أحد، ثلاثاء، خميس","كامل",1,"ahmad-ma","https://www.linkedin.com/in/ahmad-al-majdalawi-74564b18b/","0594418545",1998,"Ahmad_Adel_ElMajdalawi_CV - Ahmad Al-Majdalawi.pdf"],
  [60,"آلاء عاطف سليم العرعير",F,W,"UX/UI Design","سبت، اثنين، أربعاء","كامل",2,"alaa-ar","","0598330973",1991,""],
  [61,"أحمد مجدي حسن بدح",F,M,"Mobile Development","أحد، ثلاثاء، خميس","كامل",2,"","","0595134291",1998,""],
  [62,"عبدالله نضال حسن الزعانين",F,M,"Graphic Design","سبت، اثنين، أربعاء","كامل",24,"","","0592067054",1999,""],
];

// Emit an idempotent SQL transaction to stdout (pipe to psql). Single quotes are
// doubled for SQL string literals; empty strings stay '', missing years → NULL.
const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined || v === "" ? "NULL" : String(v));

const values = ROWS.map((r) => {
  const [ref, name, type, gender, skill, days, period, seat, username, linkedin, phone, birthYear, cv] = r;
  return `(${ref},${q(name)},${q(type)},${q(gender)},${q(skill)},${q(days)},${q(period)},${n(seat)},${q(username)},${q(linkedin)},false,${q(phone)},${n(birthYear)},${q(cv)},${ref},'visible')`;
}).join(",\n  ");

process.stdout.write(
  "BEGIN;\n" +
  "TRUNCATE roster_members RESTART IDENTITY;\n" +
  "INSERT INTO roster_members\n" +
  "  (id, full_name, type, gender, skill, days, period, seat, internet_user, linkedin_url, linkedin_public, phone, birth_year, cv_url, sort_order, status)\nVALUES\n  " +
  values + ";\n" +
  "SELECT setval('roster_members_id_seq', (SELECT MAX(id) FROM roster_members));\n" +
  "COMMIT;\n",
);
