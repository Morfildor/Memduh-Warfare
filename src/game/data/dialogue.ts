export type Who = 'memduh' | 'deve' | 'ali' | 'cemil' | 'riza' | 'tank' | 'heli' | 'hoca';

export interface Line {
    who: Who;
    text: string;
}

export const SPEAKERS: Record<Who, { name: string; portrait: string; color: string }> = {
    memduh: { name: 'MEMDUH', portrait: 'p_memduh_normal', color: '#ffc23c' },
    deve: { name: 'HACI DEVE', portrait: 'p_deve', color: '#ffe0a0' },
    ali: { name: 'TELSİZCİ ALİ', portrait: 'p_ali', color: '#9fe3ff' },
    cemil: { name: 'MÜHENDİS CEMİL', portrait: 'p_cemil', color: '#ffb066' },
    riza: { name: 'ŞEYH RIZA', portrait: 'p_riza', color: '#e8e8e8' },
    tank: { name: 'MUHASEBECİ TANKI', portrait: 'p_tank', color: '#ff9a7a' },
    heli: { name: 'GENEL MÜFETTİŞ', portrait: 'p_heli', color: '#ff9a7a' },
    hoca: { name: 'REHBER HOCA', portrait: 'p_hoca', color: '#ffe36b' },
};

const m = (text: string): Line => ({ who: 'memduh', text });
const d = (text: string): Line => ({ who: 'deve', text });
const a = (text: string): Line => ({ who: 'ali', text });
const c = (text: string): Line => ({ who: 'cemil', text });
const r = (text: string): Line => ({ who: 'riza', text });

export type Topic =
    | 'start' | 'firstKill' | 'combo' | 'bigCombo' | 'missBomb' | 'bombKill' | 'hurt' | 'lowHp' | 'pit'
    | 'pickupHealth' | 'pickupShield' | 'pickupRapid' | 'pickupBomb' | 'pickupAir' | 'pickupNuke'
    | 'pompa' | 'pompaEnd' | 'pompaReady' | 'jump' | 'nearMiss' | 'idle'
    | 'tankIntro' | 'tankHurt' | 'tankDown' | 'heliIntro' | 'heliHurt' | 'heliDown'
    | 'stage' | 'victory' | 'defeat' | 'endless' | 'camelDrop' | 'enemyKilled'
    | 'friendAnesthesia' | 'friendHack' | 'friendSlap' | 'friendLesson'
    | 'friendPatso' | 'patsoCatch' | 'patsoLand' | 'paraDrop';

// Each entry is a short exchange (1-3 lines) so the jokes get their timing.
export const DIALOGUE: Record<Topic, Line[][]> = {
    start: [
        [a('Memduh, konvoy geliyor! Ne yapıyoruz?'), m('Ben buraya iş gezisine geldim.')],
        [m('Pazartesi uçağım vardı. Şimdi neden silah tutuyorum?'), a('Uçak yok abi.')],
        [d('Plan var mı?'), m('Önce çay. Sonra savaş. Sonra izin dilekçesi.')],
        [m('Isınma yapmadım ama başlıyoruz.'), d('Bu sefer ben seni uyarmadım.')],
        [a('Salon kapalı Memduh, cephe açık.'), m('Bugün bacak günüydü ya.')],
        [m('Mesai bitti sanıyordum. Yeni vardiya mı bu?')],
    ],
    firstKill: [
        [m('Bir tane. Tekrar sayısı 1.')],
        [d('Alkışlamam. Yük taşıyorum, ellerim dolu.')],
        [a('İlk kan! Yani ilk kum. Neyse, tebrikler!')],
        [m('Bunu performans değerlendirmesine yazın.')],
    ],
    combo: [
        [a('Memduh arka arkaya vuruyor! Telsizde herkes ayakta!')],
        [m('Buna set diyorlar. Ara vermeden.')],
        [d('Saydım. Sen saymadın. Ben de söylemem.')],
        [m('Ben bunu bir toplantıda anlatsam kimse inanmaz.')],
        [m('Hocam, ağırlık bu mu? Hafif kaldı.')],
        [c('Vuruş sıklığı artıyor. Ölçtüm, yazmadım.')],
    ],
    bigCombo: [
        [a('Memduh abi, bu ne ya! Ağzım açık kaldı!')],
        [m('Bu hafta KPI tamam. Bir daha sormayın.')],
        [r('Evladım, böyle seri zor görmüştüm. Göz kırpmadım.'), m('Ben de kırpmadım.')],
        [d('Şansa bağlıyorum. Başka açıklama bulamadım.')],
        [m('Tek nefeste on tekrar. Dizim bir şey demedi.')],
    ],
    missBomb: [
        [d('Bomba nereye gitti?'), m('Kumun altına demo yaptım.')],
        [a('Memduh, bomba bedava değil! Bütçe var!'), m('Fatura bana kesilmesin.')],
        [c('Ateşleme süresi iki saniyeydi. Ya da üç. Not almamışım.')],
        [m('O uyarı atışıydı. Düşmanın haberi olsun.')],
        [m('Kaçırdım. Bir sonraki set daha iyi.')],
    ],
    bombKill: [
        [m('Patladı ve çözüldü. Toplantısız çözüm.')],
        [c('Yeni model. Kılavuzu sonra yazarım. Yazarsam.')],
        [d('Kulağım çınlıyor. Şikâyet formu nerede?')],
        [m('Bombayla çözülmeyen mail yoktur.')],
        [a('Memduh, kulaklığımı kırdın ya!')],
    ],
    hurt: [
        [m('Ay! Bu sigortada yoktu.')],
        [d('Sigorta dedim. Protein tozu dedin.'), m('İkisi de bitmiş zaten.')],
        [a('Vuruldun mu?'), m('Yok, sadece vücut sürprizlendi.')],
        [m('Yarın kas ağrısı, bugün can ağrısı.')],
        [m('Bu hasar mesai saatine girer mi?')],
        [m('Yüzüme değil, kefiyeme dikkat.')],
    ],
    lowHp: [
        [d('Çayın azaldı Memduh. Gözüm doldu, deve gözü.')],
        [m('Son bardak. Set arası sayılır mı?')],
        [a('Çay paketi yolluyorum! Kargo yarın çıkar.'), m('Yarın yok burada.')],
        [m('Bir yıllık iznim bu savaşta bitiyor.')],
        [d('Bir çay daha ister misin? Acil durum sorusu.')],
    ],
    pit: [
        [d('Çukur! Çukur! Yol yok!')],
        [m('Çukur dediğin yükseklik meselesidir.')],
        [a('Önünde yol yok Memduh. Hiç yok.')],
        [c('Çukur derinliği kırk metre. Yeminle ölçtüm.')],
        [m('Servis bu yoldan geçmezdi.')],
    ],
    pickupHealth: [
        [m('Taze çay. Şeker de var mı?'), d('Şeker yok. Zam geldi.')],
        [m('Bardağı doldurdum. Hazırım.')],
        [m('Bu çay bana iyi geldi. SGK karşılar mı?')],
    ],
    pickupShield: [
        [m('Kalkan. Selülit bile işlemez.')],
        [c('Sağlam yaptım bu kalkanı. Sağlam yaptım sanıyorum.')],
        [m('Artık yüzüm sigortalı.')],
    ],
    pickupRapid: [
        [m('Hızlı ateş! Set arası yok, gaz!')],
        [c('Namlu biraz ısınır. Biraz. Çok değil.')],
        [m('Kılavuz okumadım, basıyorum.')],
    ],
    pickupBomb: [
        [m('Daha çok bomba! Bu sefer nişan alacağım.'), d('Bu sefer.')],
        [d('Memduh bomba toplarken çocuk gibi oluyor.')],
        [m('Yedek bomba. Yedek çay da olsa.')],
    ],
    pickupAir: [
        [m('Hava desteği! Pilota selam.'), a('Pilot çay molasında, otomatik geldi.')],
        [m('Uçak geliyor. Keşke biletim de olsaydı.')],
    ],
    pickupNuke: [
        [m('Bu büyük. Ben buna "dikkatli" demem. Mesai dışı derim.')],
        [r('Memduh, o düğmeye basma. Basmışsın. Tamam.')],
        [c('Bunu test etmedim. Etmek de istemiyorum.')],
    ],
    pompa: [
        [m('POMPA GELDİ! HERKES KENARA!')],
        [m('Bugün kollar çay içmiş!')],
        [a('Memduh pompalıyor! Tişört dayanır mı?')],
        [m('Damarlar çıktı. Ayna nerede?')],
        [m('Antrenman bitti sanıyordunuz. Yeni set.')],
        [d('Pompalandı. Ben yükü taşıyorum, o yük oldu.')],
    ],
    pompaEnd: [
        [m('Pompa söndü. Aynaya bakmadan devam.')],
        [d('Kolların küçüldü. Ego aynı.')],
        [m('Güç bitti. Protein tozu lazım.')],
        [a('Pompa bitti ama poz devam ediyor.')],
    ],
    pompaReady: [
        [a('Memduh, damarlar belirdi! Pompa hazır!')],
        [c('Basınç göstergesi kırmızıda. İyi mi, kötü mü?')],
        [m('Hissediyorum. Dirsek bile pompalı.')],
        [d('Bir sonraki set yakın. Kaçalım mı?')],
    ],
    jump: [
        [m('Hop. Bugün kum benim bölgem değil.')],
        [d('Zıplaman güzel. İniş de olsa daha güzel.')],
        [m('Bacak günü sayılır.')],
        [a('Memduh uçtu! Telsizden gördüm!')],
    ],
    nearMiss: [
        [m('Kurşun nazik davrandı. Teşekkür ederim.')],
        [d('Bu kadar ucundan kaçmak da yetenek.')],
        [a('Memduh, kafan yerinde mi?'), m('Bilmiyorum, bakmadım.')],
        [m('Şu an ömrüm bir saç teli kadar kısaldı.')],
    ],
    idle: [
        [m('Bu düşmanın mesaisi bitmiyor mu?')],
        [m('Hacı Deve, sen muhasebeye bak.')],
        [d('Günde sekiz saat dinlenirim. Spor değil bu.')],
        [r('Memduh, plan B var mı?'), m('Plan A\'yı hızlı yap.')],
        [c('Silahı yeniledim. Çaydanlığa soğutucu taktım.'), m('Neden?'), c('Sormadım.')],
        [d('Önümüzde kum var. Arkamızda kum. Hayat kum.')],
        [a('Cephede wifi çekmiyor.'), m('Çay çekiyor, yeter.')],
        [m('Yıllık izin dilekçemi verdim. Cevap yok.')],
        [m('Fatura ne zaman gelecek? Bekliyorum.')],
    ],
    tankIntro: [
        [a('Önünde Muhasebeci Tankı. KDV sorarsa cevap verme.'), { who: 'tank', text: 'Evrak getir!' }, m('Fişim kayıp abi.')],
        [{ who: 'tank', text: 'Yetkisiz patlama! Dilekçe nerede?' }, m('Mail attım, baktınız mı?')],
        [{ who: 'tank', text: 'Faturanı kes, sonra savaşırız.' }, m('Ben fatura kesmeye gelmedim.')],
    ],
    tankHurt: [
        [{ who: 'tank', text: 'Kayıt dışı hasar tespit edildi!' }],
        [{ who: 'tank', text: 'Bu zarar bütçede yoktu!' }],
        [d('Bu tank park cezası yazacak gibi bakıyor.')],
        [m('Vur vur, makbuz kes.')],
    ],
    tankDown: [
        [m('Muhasebe kapandı. Makbuz yok.')],
        [{ who: 'tank', text: 'Hesaplar… uyuşmadı…' }, m('Hiç uyuşmaz zaten.')],
        [m('Mali müşavirin hesabı bu kadar.')],
        [c('Denge sayfası dengesiz kaldı.')],
    ],
    heliIntro: [
        [a('Radarda Genel Müfettiş. Uçan denetim.'), { who: 'heli', text: 'İzinsiz kahraman var!' }, m('İznim çayımın altında.')],
        [{ who: 'heli', text: 'Bu bölge denetlenecek!' }, m('Önce randevu alın.')],
        [{ who: 'heli', text: 'Mesai kayıtlarını getir.' }, m('Kum yedi.')],
    ],
    heliHurt: [
        [{ who: 'heli', text: 'Bu hasar bütçede yoktu!' }],
        [{ who: 'heli', text: 'Tutanak tutuyorum!' }, m('Tut, tut.')],
        [d('Üstümüzde müfettiş. İlk kez kuma yakınlık duydum.')],
    ],
    heliDown: [
        [m('Denetim tamam. Not: patlama.')],
        [{ who: 'heli', text: 'Raporum… kumun içinde…' }],
        [m('Rapor yazılmadan düştü. İyi oldu.')],
    ],
    stage: [
        [a('Yeni bölge! Termos hazır, devam!')],
        [c('Yeni bölgede yeni tuzaklar. Benim değil, neyse.')],
        [r('Yol uzun, çay sıcak. Devam evladım.')],
        [m('Yeni bölge. Yeni hedef. Yeni mail yağmuru.')],
    ],
    victory: [
        [m('Çölü kurtardık. Protein çayı kimden?'), d('Baştan biliyordum. Deveyim.')],
        [a('BÖLÜM TAMAM! Herkes mola!')],
        [m('Bugünlük bu kadar. Yarın izin.'), a('Memduh yarın yok.')],
        [d('Kazandık. Bahşiş?')],
    ],
    defeat: [
        [d('Hörrr. Bir set daha mı?'), m('Yarım set yaptım, ödül ver.')],
        [m('Çay bitti. Moral de biraz bitti.')],
        [a('Bağlantı koptu. Tekrar dener misin?')],
        [a('Memduh pes etmez. Set arası verir.')],
        [m('Bunu yarın hallederiz. Mesai bitti.')],
    ],
    endless: [
        [m('Hâlâ buradayız. Çöl bitmiyor, ben de.')],
        [d('Bu bölüm değil, huy oldu.')],
        [m('Kaçıncı gün bu? İzin hakkım doldu bence.')],
        [a('Telsizde yeni haber yok, sadece kum.')],
    ],
    // reactions to what the Pompa-team friends just did for Memduh
    friendAnesthesia: [
        [m('Hepsi yattı. Melike nöbette, sessiz olun.')],
        [m('Gece vardiyası kazandı. Teşekkürler Melike.')],
        [d('Uyuttular. Ben de uyusam fena olmaz.')],
    ],
    friendHack: [
        [m('Tunç ekranı sildi. Kodu anlamadım ama iş bitti.')],
        [m('Enter\'a basıp çıktı. Adam sanatçı.')],
        [c('Tunç\'un kodu kötü yazılmış ama çalışıyor. Sinirlendim.')],
    ],
    friendSlap: [
        [m('Deniz vurdu, ben hızlandım. Aaah belim.')],
        [m('Deniz\'in şaplağı protein gibi. Etki geç ama sert.')],
        [a('Deniz şaplak attı, hız geldi. Bilimsel.')],
    ],
    friendLesson: [
        [m('Tuğçe düzeltti: "dahi" ayrı yazılır. Öğrendim.')],
        [m('De da ayrı, ki de ayrı, ben ise yorgunum.')],
        [m('Tuğçe imla düzeltti, iyileştim. Garip ama güzel.')],
    ],
    friendPatso: [
        [m('Gökten patso yağıyor! Çölde ilk iyi haber.')],
        [a('Kantinci uçak kiralamış. Hesap Memduh\'a.')],
        [m('Uçaktan patso. Kantinci iş bilir.')],
        [d('Patso yağıyor, bahşiş yok. Adalet nerede?')],
    ],
    patsoCatch: [
        [m('Havada kaptım. Sosis, patates, protein.')],
        [m('Yere düşmeden aldım. Antrenman gibi.')],
        [d('Bir lokma da bana. Yük taşıdım ben.')],
    ],
    patsoLand: [
        [m('Yere düştü ama beş saniye kuralı.')],
        [a('Yerden yedi. Hijyen raporunu ben yazmam.')],
        [m('Kum biraz fazla ama sosu seviyorum.')],
    ],
    paraDrop: [
        [a('Gökten Jelibon Avcıları iniyor! Paraşütle!')],
        [m('Ayıcık şeker askerler. Rüya sanıyordum.')],
        [m('Havadayken vurmak kolay mı? Kolay mı?')],
        [c('Paraşüt açıldı. İniş hesabı onlarda.')],
        [d('Şeker yağıyor. Şeker kimde?')],
    ],
    camelDrop: [
        [d('Teslimat. Bahşiş istemiyorum.'), d('Aslında istiyorum.')],
        [d('Kargo geldi. İmza yok, pişmanlık var.')],
        [d('Sırtımdaki yükü kimse sormuyor.')],
        [m('Hacı Deve! Tam zamanında!'), d('Mesai bitmeden.')],
        [d('Gelsin, gitsin. Ben taşıyıcıyım.')],
    ],
    enemyKilled: [
        [m('Bir tekrar daha. Set bitsin.')],
        [m('Bu da ağırlık plakası için.')],
        [m('Mesai dışı yaptım, fazla mesai yaz.')],
        [m('Biri daha. Kalan on dört tekrar.')],
    ],
};

export const LINE_COUNT = Object.values(DIALOGUE).reduce((n, ex) => n + ex.reduce((k, e) => k + e.length, 0), 0);
