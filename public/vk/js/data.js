/* VK_ETN — default data & helpers */
(function () {
  // All store images live in local folders: /vk/img/products, /vk/img/categories, /vk/img/banners, /vk/img/uploads

  const categories = [
    { id: 'phones', name: { en: 'Smartphones', km: 'ស្មាតហ្វូន' }, icon: 'fa-mobile-screen-button', image: '/vk/img/categories/phones.jpg' },
    { id: 'laptops', name: { en: 'Laptops', km: 'កុំព្យូទ័រយួរដៃ' }, icon: 'fa-laptop', image: '/vk/img/categories/laptops.jpg' },
    { id: 'audio', name: { en: 'Audio', km: 'សំឡេង' }, icon: 'fa-headphones', image: '/vk/img/categories/audio.jpg' },
    { id: 'watches', name: { en: 'Smartwatches', km: 'នាឡិកាឆ្លាតវៃ' }, icon: 'fa-clock', image: '/vk/img/categories/watches.jpg' },
    { id: 'gaming', name: { en: 'Gaming', km: 'ហ្គេម' }, icon: 'fa-gamepad', image: '/vk/img/categories/gaming.jpg' },
    { id: 'tablets', name: { en: 'Tablets', km: 'ថេប្លេត' }, icon: 'fa-tablet-screen-button', image: '/vk/img/categories/tablets.jpg' },
    { id: 'accessories', name: { en: 'Accessories', km: 'គ្រឿងបន្លាស់' }, icon: 'fa-plug', image: '/vk/img/categories/accessories.jpg' }
  ];

  const P = (o) => Object.assign({ discount: 0, sold: 0, rating: 4.7, reviews: 50, featured: false, inBox: [], features: [], specs: [] }, o);

  const products = [
    P({ id: 'p1', name: 'iPhone 15 Pro', brand: 'Apple', category: 'phones', price: 1099, discount: 15, stock: 24, sold: 124, rating: 4.9, reviews: 124, featured: true,
      images: ['/vk/img/products/p1-1.jpg', '/vk/img/products/p1-2.jpg', '/vk/img/products/p1-3.jpg', '/vk/img/products/p1-4.jpg'],
      short: 'Titanium design, A17 Pro chip and a pro camera system with 5x telephoto zoom.',
      details: 'iPhone 15 Pro is the first iPhone with an aerospace-grade titanium design, making it the lightest Pro model ever. The A17 Pro chip delivers a huge leap in GPU performance, enabling console-quality gaming right on your phone.\n\nThe pro camera system features a 48MP main camera that captures stunning detail, a new 5x telephoto camera on the Pro Max, and next-generation portraits with focus and depth control. The customizable Action button gives quick access to your favourite feature.\n\nWith USB‑C supporting USB 3 speeds, all‑day battery life and iOS, iPhone 15 Pro is built to last and designed to impress.',
      features: ['Aerospace-grade titanium design', 'A17 Pro chip with 6-core GPU', '48MP Main camera, 3x Telephoto', 'Customizable Action button', 'USB‑C with USB 3 speeds', 'All-day battery life'],
      specs: [{ k: 'Display', v: '6.1" Super Retina XDR, 120Hz' }, { k: 'Chip', v: 'A17 Pro' }, { k: 'Storage', v: '256GB' }, { k: 'Camera', v: '48MP + 12MP + 12MP' }, { k: 'Battery', v: 'Up to 23h video' }, { k: 'Weight', v: '187 g' }],
      inBox: ['iPhone 15 Pro', 'USB‑C Charge Cable (1 m)', 'Documentation'] }),
    P({ id: 'p2', name: 'MacBook Air M2', brand: 'Apple', category: 'laptops', price: 1299, discount: 10, stock: 15, sold: 98, rating: 4.8, reviews: 98, featured: true,
      images: ['/vk/img/products/p2-1.jpg', '/vk/img/products/p2-2.jpg', '/vk/img/products/p2-3.jpg', '/vk/img/products/p2-4.jpg'],
      short: 'Strikingly thin design with the M2 chip, 13.6" Liquid Retina display and 18h battery.',
      details: 'Redesigned around the next-generation M2 chip, MacBook Air is strikingly thin and brings exceptional speed and power efficiency within its durable all‑aluminium enclosure.\n\nThe 13.6-inch Liquid Retina display supports one billion colours, and the 1080p FaceTime HD camera, four-speaker sound system and three-mic array make every call look and sound great.\n\nWith up to 18 hours of battery life and a fanless design, it stays silent no matter how hard you work.',
      features: ['Apple M2 chip with 8-core CPU', '13.6" Liquid Retina display', 'Up to 18 hours battery', 'Fanless, silent design', 'MagSafe charging', '1080p FaceTime HD camera'],
      specs: [{ k: 'Display', v: '13.6" 2560×1664' }, { k: 'Chip', v: 'Apple M2' }, { k: 'Memory', v: '8GB unified' }, { k: 'Storage', v: '256GB SSD' }, { k: 'Weight', v: '1.24 kg' }],
      inBox: ['MacBook Air', '30W USB‑C Power Adapter', 'USB‑C to MagSafe 3 Cable'] }),
    P({ id: 'p3', name: 'AirPods Pro (2nd gen)', brand: 'Apple', category: 'audio', price: 249, discount: 20, stock: 40, sold: 76, rating: 4.8, reviews: 76, featured: true,
      images: ['/vk/img/products/p3-1.jpg', '/vk/img/products/p3-2.jpg', '/vk/img/products/p3-3.jpg'],
      short: 'Active Noise Cancellation, Adaptive Audio and personalised spatial audio.',
      details: 'AirPods Pro feature up to 2x more Active Noise Cancellation, plus Adaptive Transparency and Personalised Spatial Audio with dynamic head tracking for immersive sound.\n\nThe H2 chip powers smarter noise cancellation and three-dimensional sound. Touch control lets you swipe to adjust volume, and the MagSafe charging case now has a speaker and lanyard loop.',
      features: ['2x more Active Noise Cancellation', 'Adaptive Transparency', 'Personalised Spatial Audio', 'Up to 6h listening time', 'MagSafe USB‑C case'],
      specs: [{ k: 'Chip', v: 'Apple H2' }, { k: 'Battery', v: '6h (30h with case)' }, { k: 'Water resistance', v: 'IP54' }, { k: 'Connectivity', v: 'Bluetooth 5.3' }],
      inBox: ['AirPods Pro', 'MagSafe Charging Case', 'Ear tips (XS, S, M, L)', 'USB‑C cable'] }),
    P({ id: 'p4', name: 'Galaxy Watch 6', brand: 'Samsung', category: 'watches', price: 299, discount: 12, stock: 18, sold: 63, rating: 4.6, reviews: 63, featured: true,
      images: ['/vk/img/products/p4-1.jpg', '/vk/img/products/p4-2.jpg', '/vk/img/products/p4-3.jpg', '/vk/img/products/p4-4.jpg'],
      short: 'Advanced sleep coaching, heart monitoring and a larger, brighter display.',
      details: 'Galaxy Watch6 helps you understand your body with advanced health insights. Sleep coaching, body composition, heart rhythm notifications and personalised heart rate zones keep you on track.\n\nThe display is 20% larger with slimmer bezels, and the sapphire crystal glass is built to withstand daily life.',
      features: ['Personalised sleep coaching', 'BIA body composition', 'ECG & blood pressure', 'Sapphire crystal glass', 'Up to 40h battery'],
      specs: [{ k: 'Display', v: '1.5" Super AMOLED' }, { k: 'Size', v: '44 mm' }, { k: 'Battery', v: '425 mAh' }, { k: 'Water resistance', v: '5ATM + IP68' }],
      inBox: ['Galaxy Watch6', 'Fast wireless charger', 'Strap'] }),
    P({ id: 'p5', name: 'Sony WH‑1000XM5', brand: 'Sony', category: 'audio', price: 399, discount: 0, stock: 12, sold: 51, rating: 4.9, reviews: 210,
      images: ['/vk/img/products/p5-1.jpg', '/vk/img/products/p5-2.jpg', '/vk/img/products/p5-3.jpg', '/vk/img/products/p5-4.jpg'],
      short: 'Industry-leading noise cancelling headphones with 30 hours battery.',
      details: 'The WH-1000XM5 rewrites the rules for distraction-free listening. Two processors control eight microphones for unprecedented noise cancelling, and Auto NC Optimizer adjusts automatically to your environment.\n\nA specially designed 30mm driver unit delivers natural, rich sound, and crystal clear hands-free calling uses precise voice pickup technology.',
      features: ['Industry-leading noise cancelling', '30mm carbon fibre drivers', '30 hours battery, quick charge', 'Multipoint connection', 'Speak-to-chat'],
      specs: [{ k: 'Driver', v: '30 mm' }, { k: 'Battery', v: '30 h' }, { k: 'Weight', v: '250 g' }, { k: 'Codec', v: 'LDAC, AAC, SBC' }],
      inBox: ['Headphones', 'Carrying case', 'USB‑C cable', 'Audio cable'] }),
    P({ id: 'p6', name: 'Xbox Wireless Controller', brand: 'Microsoft', category: 'gaming', price: 69, discount: 5, stock: 35, sold: 88, rating: 4.7, reviews: 88,
      images: ['/vk/img/products/p6-1.jpg', '/vk/img/products/p6-2.jpg', '/vk/img/products/p6-3.jpg', '/vk/img/products/p6-4.jpg'],
      short: 'Hybrid D-pad, textured grip and Bluetooth for Xbox, PC and mobile.',
      details: 'Experience the modernised design of the Xbox Wireless Controller, featuring sculpted surfaces and refined geometry for enhanced comfort during gameplay.\n\nStay on target with textured grip on the triggers, bumpers and back case, and a hybrid D-pad for accurate, yet familiar input.',
      features: ['Hybrid D-pad', 'Textured grip', 'Share button', 'Bluetooth & USB‑C', 'Works with PC, Android, iOS'],
      specs: [{ k: 'Connectivity', v: 'Xbox Wireless, Bluetooth' }, { k: 'Battery', v: '2× AA (up to 40h)' }, { k: 'Port', v: 'USB‑C, 3.5mm' }],
      inBox: ['Controller', '2× AA batteries'] }),
    P({ id: 'p7', name: 'Galaxy S24 Ultra', brand: 'Samsung', category: 'phones', price: 1299, discount: 8, stock: 9, sold: 47, rating: 4.8, reviews: 140, featured: true,
      images: ['/vk/img/products/p7-1.jpg', '/vk/img/products/p7-2.jpg', '/vk/img/products/p7-3.jpg'],
      short: 'Galaxy AI, titanium frame, 200MP camera and built-in S Pen.',
      details: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra you can unleash whole new levels of creativity, productivity and possibility, starting with the most important device in your life.\n\nThe 200MP camera with ProVisual Engine captures incredible detail in any light, while the titanium frame and Corning Gorilla Armor keep it protected.',
      features: ['Galaxy AI features', '200MP wide camera', 'Built-in S Pen', 'Titanium frame', '5000 mAh battery'],
      specs: [{ k: 'Display', v: '6.8" QHD+ 120Hz' }, { k: 'Chip', v: 'Snapdragon 8 Gen 3' }, { k: 'Storage', v: '256GB' }, { k: 'Battery', v: '5000 mAh' }],
      inBox: ['Phone', 'USB‑C cable', 'Ejection pin'] }),
    P({ id: 'p8', name: 'iPad Pro 11"', brand: 'Apple', category: 'tablets', price: 999, discount: 0, stock: 14, sold: 33, rating: 4.8, reviews: 66,
      images: ['/vk/img/products/p8-1.jpg', '/vk/img/products/p8-2.jpg', '/vk/img/products/p8-3.jpg'],
      short: 'Ultra Retina XDR display, M4 chip and Apple Pencil Pro support.',
      details: 'The thinnest Apple product ever, iPad Pro features the breakthrough Ultra Retina XDR display and the outrageous performance of the M4 chip.\n\nWith Apple Pencil Pro and the Magic Keyboard, it becomes the ultimate creative and productivity machine.',
      features: ['M4 chip', 'Ultra Retina XDR OLED', 'Apple Pencil Pro support', 'Face ID', 'Thunderbolt / USB 4'],
      specs: [{ k: 'Display', v: '11" Tandem OLED' }, { k: 'Chip', v: 'Apple M4' }, { k: 'Storage', v: '256GB' }, { k: 'Weight', v: '444 g' }],
      inBox: ['iPad Pro', 'USB‑C Charge Cable'] }),
    P({ id: 'p9', name: 'Apple Watch Ultra 2', brand: 'Apple', category: 'watches', price: 799, discount: 0, stock: 4, sold: 21, rating: 4.9, reviews: 45,
      images: ['/vk/img/products/p9-1.jpg', '/vk/img/products/p9-2.jpg', '/vk/img/products/p9-3.jpg'],
      short: 'The most rugged and capable Apple Watch, with a 3000-nit display.',
      details: 'Apple Watch Ultra 2 is designed for endurance, exploration and adventure. A 49mm titanium case, precision dual-frequency GPS and up to 36 hours of battery life.\n\nThe brightest Apple display ever reaches 3000 nits, and the new double tap gesture lets you control your watch without touching the screen.',
      features: ['49mm titanium case', '3000-nit display', 'Precision dual-frequency GPS', 'Up to 36h battery', 'Dive computer'],
      specs: [{ k: 'Case', v: '49 mm titanium' }, { k: 'Chip', v: 'S9 SiP' }, { k: 'Water', v: 'WR100, EN13319' }],
      inBox: ['Apple Watch Ultra 2', 'Band', 'Magnetic fast charger'] }),
    P({ id: 'p10', name: 'Dell XPS 13', brand: 'Dell', category: 'laptops', price: 1199, discount: 0, stock: 7, sold: 19, rating: 4.6, reviews: 38,
      images: ['/vk/img/products/p10-1.jpg', '/vk/img/products/p10-2.jpg', '/vk/img/products/p10-3.jpg'],
      short: 'Premium ultrabook with InfinityEdge display and Intel Core Ultra.',
      details: 'The XPS 13 is precision-crafted from machined aluminium with a stunning edge-to-edge InfinityEdge display.\n\nPowered by Intel Core Ultra processors with built-in AI acceleration, it delivers smooth performance and long battery life in an incredibly compact form.',
      features: ['Intel Core Ultra 7', '13.4" FHD+ InfinityEdge', 'Zero-lattice keyboard', 'Wi‑Fi 7', '1.19 kg'],
      specs: [{ k: 'Display', v: '13.4" 1920×1200' }, { k: 'CPU', v: 'Core Ultra 7 155H' }, { k: 'Memory', v: '16GB LPDDR5x' }, { k: 'Storage', v: '512GB SSD' }],
      inBox: ['Laptop', '60W USB‑C adapter'] }),
    P({ id: 'p11', name: '65W GaN Charger Kit', brand: 'Anker', category: 'accessories', price: 49, discount: 10, stock: 60, sold: 140, rating: 4.7, reviews: 140,
      images: ['/vk/img/products/p11-1.jpg', '/vk/img/products/p11-2.jpg', '/vk/img/products/p11-3.jpg'],
      short: '3-port fast charger with braided USB‑C cable for phone and laptop.',
      details: 'Charge your laptop, phone and earbuds simultaneously with this compact 65W GaN charger. Advanced gallium nitride technology keeps it small and cool.\n\nIncludes a durable braided 1.5m USB‑C to USB‑C cable.',
      features: ['65W total output', '2× USB‑C + 1× USB‑A', 'GaN technology', 'Foldable plug', 'Braided cable included'],
      specs: [{ k: 'Output', v: '65W max' }, { k: 'Ports', v: '2C + 1A' }, { k: 'Cable', v: '1.5 m braided' }],
      inBox: ['Charger', 'USB‑C cable'] }),
    P({ id: 'p12', name: 'DualSense Controller', brand: 'Sony', category: 'gaming', price: 75, discount: 0, stock: 0, sold: 70, rating: 4.8, reviews: 70,
      images: ['/vk/img/products/p12-1.jpg', '/vk/img/products/p12-2.jpg', '/vk/img/products/p12-3.jpg'],
      short: 'Haptic feedback, adaptive triggers and built-in microphone.',
      details: 'Discover a deeper gaming experience with the innovative PS5 controller, featuring haptic feedback and dynamic trigger effects.\n\nA built-in microphone and headset jack let you chat with friends, while the Create button lets you capture and share your best moments.',
      features: ['Haptic feedback', 'Adaptive triggers', 'Built-in microphone', 'Create button', 'USB‑C charging'],
      specs: [{ k: 'Connectivity', v: 'Bluetooth, USB‑C' }, { k: 'Battery', v: 'Built-in Li-ion' }],
      inBox: ['Controller', 'USB cable'] })
  ];

  const settings = {
    siteName: 'VK_ETN', tagline: 'Your technology universe', logo: '',
    phone: '+855 12 345 678', email: 'support@vketn.com', address: 'No. 168, Monivong Blvd, Phnom Penh, Cambodia',
    facebook: 'https://facebook.com', telegram: 'https://t.me', tiktok: 'https://tiktok.com', youtube: 'https://youtube.com',
    shippingFee: 2, freeShippingOver: 100, lowStock: 5, storeLat: 11.5564, storeLng: 104.9282,
    khqr: { accountId: 'vk_etn@aclb', merchantName: 'VK ETN', city: 'Phnom Penh', currency: 'USD', token: '', expire: 180 },
    discount: { active: false, percent: 10, label: 'Mega Sale' },
    coupons: [{ code: 'WELCOME10', percent: 10, active: true }, { code: 'VK20', percent: 20, active: true }],
    hero: [
      { id: 'h1', active: true, image: '/vk/img/banners/hero.jpg', link: '/shop',
        title1: { en: 'Technology', km: 'បច្ចេកវិទ្យា' }, title2: { en: 'within your reach', km: 'នៅក្បែរដៃអ្នក' },
        desc: { en: 'Discover the latest smartphones, laptops and accessories with exceptional quality and unbeatable prices.', km: 'ស្វែងរកស្មាតហ្វូន កុំព្យូទ័រយួរដៃ និងគ្រឿងបន្លាស់ចុងក្រោយ ជាមួយគុណភាពល្អឥតខ្ចោះ និងតម្លៃសមរម្យបំផុត។' },
        button: { en: 'Discover the collection', km: 'ស្វែងរកការប្រមូលផ្ដុំ' } },
      { id: 'h2', active: true, image: '/vk/img/banners/promo.jpg', link: '/shop?cat=audio',
        title1: { en: 'Sound that', km: 'សំឡេងដែល' }, title2: { en: 'moves you', km: 'ធ្វើឲ្យអ្នករំភើប' },
        desc: { en: 'Premium headphones and earbuds with noise cancelling for every moment.', km: 'កាស និងកាសត្រចៀកកម្រិតខ្ពស់ ជាមួយមុខងារកាត់សំឡេងរំខាន។' },
        button: { en: 'Shop audio', km: 'ទិញឧបករណ៍សំឡេង' } },
      { id: 'h3', active: true, image: '/vk/img/banners/auth.jpg', link: '/shop?cat=watches',
        title1: { en: 'Smart life', km: 'ជីវិតឆ្លាតវៃ' }, title2: { en: 'on your wrist', km: 'នៅលើកដៃអ្នក' },
        desc: { en: 'Smartwatches that track your health, fitness and notifications.', km: 'នាឡិកាឆ្លាតវៃ តាមដានសុខភាព ហាត់ប្រាណ និងការជូនដំណឹង។' },
        button: { en: 'Shop watches', km: 'ទិញនាឡិកា' } }
    ],
    promo: { active: true, image: '/vk/img/banners/promo.jpg', link: '/shop?sale=1',
      label: { en: 'Special offer', km: 'ការផ្ដល់ជូនពិសេស' }, title: { en: 'Up to -20%', km: 'បញ្ចុះរហូតដល់ -20%' },
      subtitle: { en: 'on a selection of products', km: 'លើផលិតផលដែលបានជ្រើសរើស' },
      desc: { en: 'Equip yourself with the best brands and enjoy our limited offers!', km: 'បំពាក់ខ្លួនអ្នកជាមួយម៉ាកល្អបំផុត និងរីករាយជាមួយការផ្ដល់ជូនមានកំណត់!' },
      button: { en: 'See the offer', km: 'មើលការផ្ដល់ជូន' } },
    about: { en: '', km: '' }
  };

  // Deterministic seeded orders for a nice looking dashboard
  function seedOrders() {
    let s = 20261007;
    const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const names = ['Sok Dara', 'Chan Sophea', 'Kim Rithy', 'Lim Srey Leak', 'Heng Visal', 'Meas Bopha', 'Touch Pisey', 'Ly Chenda', 'Phan Vuthy', 'Nhem Sreymom', 'Keo Sambath', 'Seng Rotha'];
    const statuses = ['completed', 'completed', 'completed', 'processing', 'pending', 'cancelled'];
    const orders = [];
    const now = Date.now();
    for (let i = 0; i < 190; i++) {
      const daysAgo = Math.floor(Math.pow(rnd(), 1.6) * 420);
      const d = new Date(now - daysAgo * 864e5 - Math.floor(rnd() * 864e5 * 0.9));
      const n = 1 + Math.floor(rnd() * 3);
      const items = [];
      for (let j = 0; j < n; j++) {
        const p = products[Math.floor(rnd() * products.length)];
        if (items.find((x) => x.id === p.id)) continue;
        const price = +(p.price * (1 - p.discount / 100)).toFixed(2);
        items.push({ id: p.id, name: p.name, image: p.images[0], price, qty: 1 + Math.floor(rnd() * 2), category: p.category });
      }
      const subtotal = +items.reduce((a, b) => a + b.price * b.qty, 0).toFixed(2);
      const shipping = subtotal > 100 ? 0 : 2;
      const status = daysAgo < 2 ? (rnd() > .5 ? 'pending' : 'processing') : statuses[Math.floor(rnd() * statuses.length)];
      const payment = rnd() > 0.35 ? 'khqr' : 'cod';
      const name = names[Math.floor(rnd() * names.length)];
      orders.push({
        id: 'VK' + String(260000 + 190 - i), userId: null,
        customer: { name, phone: '0' + (10 + Math.floor(rnd() * 89)) + ' ' + (100 + Math.floor(rnd() * 899)) + ' ' + (100 + Math.floor(rnd() * 899)), address: 'Phnom Penh, Cambodia', lat: 11.55 + rnd() * 0.04, lng: 104.89 + rnd() * 0.05 },
        items, subtotal, discount: 0, shipping, total: +(subtotal + shipping).toFixed(2),
        payment, paid: status === 'completed' || (payment === 'khqr' && status !== 'cancelled'), status, createdAt: d.toISOString()
      });
    }
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }


  function seedReviews() {
    const people = [['Sok Dara', 5, 'Original product, fast delivery in Phnom Penh. Very happy!'], ['Chan Sophea', 5, 'ផលិតផលល្អណាស់ ដឹកជញ្ជូនលឿន សេវាកម្មល្អ។ អរគុណ VK_ETN!'], ['Kim Rithy', 4, 'Good quality and nice packaging. KHQR payment was super easy.'], ['Lim Srey Leak', 5, 'Exactly as described. Will buy again.'], ['Heng Visal', 4, 'តម្លៃសមរម្យ គុណភាពល្អ។ ណែនាំឲ្យទិញ។'], ['Meas Bopha', 5, 'Customer service answered quickly on Telegram. Recommended!']];
    const out = []; let k = 0;
    products.forEach((p, i) => {
      for (let j = 0; j < 3; j++) {
        const x = people[(i + j * 2) % people.length]; k++;
        out.push({ id: 'seed' + k, seed: true, productId: p.id, userId: null, name: x[0], avatar: '', rating: x[1], text: x[2], createdAt: new Date(Date.now() - (k * 3 + 1) * 864e5).toISOString() });
      }
    });
    return out;
  }

  // ===== KHQR (EMVCo merchant presented QR, Bakong individual) =====
  function tlv(tag, value) { value = String(value); return tag + String(value.length).padStart(2, '0') + value; }
  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  function khqrPayload({ accountId, merchantName, city, currency, amount, billNumber, phone, storeLabel }) {
    const cur = currency === 'KHR' ? '116' : '840';
    const amt = currency === 'KHR' ? String(Math.round(amount)) : Number(amount).toFixed(2);
    let s = tlv('00', '01') + tlv('01', amount ? '12' : '11');
    s += tlv('29', tlv('00', (accountId || 'vk_etn@aclb').slice(0, 32)));
    s += tlv('52', '5999') + tlv('53', cur);
    if (amount) s += tlv('54', amt);
    s += tlv('58', 'KH') + tlv('59', (merchantName || 'VK ETN').slice(0, 25)) + tlv('60', (city || 'Phnom Penh').slice(0, 15));
    let add = '';
    if (billNumber) add += tlv('01', String(billNumber).slice(0, 25));
    if (phone) add += tlv('02', String(phone).replace(/\D/g, '').slice(0, 25));
    if (storeLabel) add += tlv('03', String(storeLabel).slice(0, 25));
    if (add) s += tlv('62', add);
    s += tlv('99', tlv('00', String(Date.now())));
    s += '6304';
    return s + crc16(s);
  }

  // ===== Date ranges =====
  const DAY = 864e5;
  const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const eod = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const weekStart = (d) => { const x = sod(d); const day = (x.getDay() + 6) % 7; return addDays(x, -day); };
  function getRange(preset, custom) {
    const now = new Date();
    const t = sod(now);
    const q = Math.floor(now.getMonth() / 3);
    switch (preset) {
      case 'today': return { from: t, to: eod(t) };
      case 'yesterday': return { from: addDays(t, -1), to: eod(addDays(t, -1)) };
      case 'tomorrow': return { from: addDays(t, 1), to: eod(addDays(t, 1)) };
      case 'thisWeek': return { from: weekStart(now), to: eod(addDays(weekStart(now), 6)) };
      case 'lastWeek': return { from: addDays(weekStart(now), -7), to: eod(addDays(weekStart(now), -1)) };
      case 'thisMonth': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
      case 'lastMonth': return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: eod(new Date(now.getFullYear(), now.getMonth(), 0)) };
      case 'thisQuarter': return { from: new Date(now.getFullYear(), q * 3, 1), to: eod(new Date(now.getFullYear(), q * 3 + 3, 0)) };
      case 'lastQuarter': return { from: new Date(now.getFullYear(), q * 3 - 3, 1), to: eod(new Date(now.getFullYear(), q * 3, 0)) };
      case 'thisYear': return { from: new Date(now.getFullYear(), 0, 1), to: eod(new Date(now.getFullYear(), 11, 31)) };
      case 'lastYear': return { from: new Date(now.getFullYear() - 1, 0, 1), to: eod(new Date(now.getFullYear() - 1, 11, 31)) };
      case 'wtd': return { from: weekStart(now), to: eod(t) };
      case 'mtd': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: eod(t) };
      case 'ytd': return { from: new Date(now.getFullYear(), 0, 1), to: eod(t) };
      case 'last7': return { from: addDays(t, -6), to: eod(t) };
      case 'last14': return { from: addDays(t, -13), to: eod(t) };
      case 'last30': return { from: addDays(t, -29), to: eod(t) };
      case 'last60': return { from: addDays(t, -59), to: eod(t) };
      case 'last90': return { from: addDays(t, -89), to: eod(t) };
      case 'custom': return { from: sod(new Date(custom.from)), to: eod(new Date(custom.to)) };
      default: return { from: new Date(2000, 0, 1), to: eod(addDays(t, 3650)) };
    }
  }
  const PRESETS = ['today', 'yesterday', 'tomorrow', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisQuarter', 'lastQuarter', 'thisYear', 'lastYear', 'wtd', 'mtd', 'ytd', 'last7', 'last14', 'last30', 'last60', 'last90'];

  window.VK_DATA = { categories, products, settings, seedOrders, seedReviews };
  window.VK_UTIL = { khqrPayload, crc16, getRange, PRESETS, sod, eod, addDays, DAY };
})();
