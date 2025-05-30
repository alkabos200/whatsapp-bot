const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox']
    }
});

// ✅ الكلمات المفتاحية + اختصاراتها
const keywords = {
    "تسريع": "تسريع",
    "سرع": "تسريع",
    "تعويض": "تعويض",
    "عوض": "تعويض",
    "إلغاء": "إلغاء",
    "الغاء": "إلغاء",
    "الغ": "إلغاء",
    "الغِ": "إلغاء",
    "تجزئة": "تجزئة",
    "جزء": "تجزئة",
    "جزئ": "تجزئة",
    "جزاء": "تجزئة"
};

// ✅ رسالة استلام الطلب
function generateReply(action) {
    return `✅ *تم استلام طلبك الخاص بـ: ${action}*
📨 تم توجيهه إلى القسم المختص
⏳ سنقوم بالانتهاء منه في أقرب وقت ممكن

📌 يمكنك إرسال أكثر من رقم هكذا:
12345,67890,11223

تحياتي لك 🌸
alkabos.com`;
}

// ✅ تأخير عشوائي
function randomDelay(min = 5000, max = 7000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ✅ حفظ رقم الطلب في ملف
function saveOrderNumber(action, orderNumber) {
    const filePath = path.join(__dirname, `${action}.txt`);
    fs.appendFile(filePath, `${orderNumber},`, (err) => {
        if (err) {
            console.error(`❌ خطأ أثناء حفظ رقم الطلب في ملف ${action}:`, err);
        } else {
            console.log(`💾 تم حفظ رقم الطلب ${orderNumber} في ${action}.txt`);
        }
    });
}

// ✅ كود QR
client.on('qr', (qr) => {
    console.log("📱 امسح هذا الكود من واتساب:");
    qrcode.generate(qr, { small: true });
});

// ✅ جاهزية البوت
client.on('ready', () => {
    console.log('✅ البوت شغال!');
});

// ✅ معالجة الرسائل
client.on('message', async (msg) => {
    const text = msg.body.trim();

    for (const key in keywords) {
        if (text.toLowerCase().startsWith(key)) {
            const action = keywords[key];

            // ✅ رسالة ترحيب
            const welcome = `👋 مرحبًا بك!
أنا بوت ذكي للرد التلقائي من سيرفر الكابوس 🧠

🔍 جاري مراجعة رقم الطلب الخاص بك...`;
            await msg.reply(welcome);

            setTimeout(() => {
                // استخراج النص بعد الكلمة المفتاحية
                const remainingText = text.slice(key.length).trim();

                // استخراج الأرقام مهما كانت الصيغة
                const orderNumbers = remainingText
                    .split(/[\s,،]+/) // يفصل بين مسافات أو فواصل
                    .map(n => n.trim())
                    .filter(n => /^\d+$/.test(n)); // يحتفظ فقط بالأرقام

                if (orderNumbers.length === 0) {
                    msg.reply(`❌ لم يتم العثور على رقم الطلب.
📌 برجاء إرسال رقم الطلب + نوع العملية، مثل:

تسريع 12345
إلغاء 67890

📌 وإذا لديك أكثر من طلب يمكنك إرسالهم بنفس الصيغة كالتالي:

تسريع 12345,45654,643673
إلغاء 24425,12334,423553`);
                    return;
                }

                // ✅ التحقق من الحد الأقصى
                if (orderNumbers.length > 5) {
                    msg.reply(`⚠️ لقد قمت بإدخال أكثر من 5 أرقام طلب.
🚫 رقم الطلب هذا ليس خاص بنا، برجاء التأكد والمحاولة مرة أخرى.`);
                    return;
                }

                // ✅ متابعة المعالجة
                msg.reply(generateReply(action));

                const adminNumber = "201030769583@c.us";
                let adminMsg = `📥 *تم استلام طلب جديد*:\n\n• النوع: *${action}*\n• من العميل: *${msg.from}*\n• الأرقام:\n`;

                orderNumbers.forEach(orderNumber => {
                    saveOrderNumber(action, orderNumber);
                    adminMsg += `- ${orderNumber}\n`;
                });

                client.sendMessage(adminNumber, adminMsg);
            }, randomDelay());

            break; // أول تطابق كفاية
        }
    }
});

client.initialize();
