// Tiny reactive i18n (English / Khmer). Instant switch, no reload, persisted in localStorage.
import { ref } from 'vue'
import { storage } from './storage'

const messages = {
  en: {
    colId: 'ID', colBrand: 'Brand', colPrice: 'Price', colDiscount: 'Discount', colStock: 'Stock', colSold: 'Sold', colShort: 'Description', colFeatured: 'Featured', colIcon: 'Icon',
    colCustomer: 'Customer', colSubtotal: 'Subtotal', colShipping: 'Shipping', colTotal: 'Total', colPayment: 'Payment', colDate: 'Date', colUser: 'User',
    overview: 'Overview', health: 'System status', khqrCheck: 'KHQR check', reviews: 'Reviews', store: 'Store data', users: 'Users', profile: 'Profile',
    login: 'Login', register: 'Register', logout: 'Logout', menu: 'Menu', modules: 'Modules', backHome: 'Back to home', mainSite: 'Main website',
    welcomeBack: 'Welcome back', loginDesc: 'Login to continue to your account.', createAccount: 'Create account', registerDesc: 'Join VK_ETN and enjoy exclusive offers.',
    email: 'Email', password: 'Password', confirmPassword: 'Confirm password', name: 'Name', phone: 'Phone', remember: 'Remember me', forgot: 'Forgot password?',
    noAccount: "Don't have an account?", haveAccount: 'Already have an account?', demoAdmin: 'Demo admin', agreeTerms: 'I agree to the terms & privacy policy',
    tagline: 'Your technology universe', authTitle: 'Your technology universe', authDesc: 'Smartphones, laptops, audio and accessories — delivered fast across Cambodia.',
    loginOk: 'Login successful', registerOk: 'Account created', wrongCreds: 'Wrong email or password', emailExists: 'Email already registered', passMismatch: 'Passwords do not match', passShort: 'Password must be at least 6 characters',
    adminOnly: 'Please login with an admin account', search: 'Search', all: 'All', refresh: 'Refresh', save: 'Save', saved: 'Saved', cancel: 'Cancel', delete: 'Delete', deleted: 'Deleted',
    table: 'Table', cards: 'Cards', exportJson: 'Export JSON', results: 'results', noData: 'No data found', loading: 'Loading…', retry: 'Retry', error: 'Something went wrong',
    operational: 'Operational', degraded: 'Degraded', down: 'Down', latency: 'Latency', lastCheck: 'Last check', autoRefresh: 'Auto refresh', uptime: 'Uptime', endpoint: 'Endpoint', status: 'Status', checks: 'checks',
    amount: 'Amount', currency: 'Currency', billNumber: 'Bill number', generate: 'Generate KHQR', checkPayment: 'Check payment', downloadQr: 'Download QR', expiresIn: 'Expires in',
    paid: 'Paid', notPaid: 'Not paid yet', demoMode: 'Demo mode (no Bakong token configured)', scanToPay: 'Scan with any Bakong member banking app', merchant: 'Merchant', payload: 'KHQR payload',
    writeReview: 'Write a review', yourRating: 'Your rating', yourReview: 'Your comment', post: 'Post', product: 'Product', rating: 'Rating', loginToReview: 'Login to write a review', reviewPosted: 'Review posted',
    collection: 'Collection', items: 'items', fields: 'fields', role: 'Role', joined: 'Joined', selected: 'selected', deleteSelected: 'Delete selected', confirmDelete: 'Delete the selected items?',
    updateProfile: 'Update profile', newPassword: 'New password', leaveBlank: 'Leave blank to keep current', changePhoto: 'Change photo',
    hello: 'Hello', overviewDesc: 'Vue 3 + Vite frontend for the VK_ETN store — no backend, data is saved in this browser.', products: 'Products', orders: 'Orders', categories: 'Categories', settings: 'Settings',
    notFound: 'Page not found', open: 'Open', theme: 'Theme', language: 'Language',
  },
  km: {
    colId: 'លេខសម្គាល់', colBrand: 'ម៉ាក', colPrice: 'តម្លៃ', colDiscount: 'បញ្ចុះតម្លៃ', colStock: 'ស្តុក', colSold: 'បានលក់', colShort: 'ការពិពណ៌នា', colFeatured: 'ពិសេស', colIcon: 'រូបតំណាង',
    colCustomer: 'អតិថិជន', colSubtotal: 'សរុបរង', colShipping: 'ថ្លៃដឹក', colTotal: 'សរុប', colPayment: 'ការទូទាត់', colDate: 'កាលបរិច្ឆេទ', colUser: 'អ្នកប្រើ',
    overview: 'ទិដ្ឋភាពទូទៅ', health: 'ស្ថានភាពប្រព័ន្ធ', khqrCheck: 'ពិនិត្យ KHQR', reviews: 'មតិយោបល់', store: 'ទិន្នន័យហាង', users: 'អ្នកប្រើប្រាស់', profile: 'ប្រវត្តិរូប',
    login: 'ចូលគណនី', register: 'ចុះឈ្មោះ', logout: 'ចាកចេញ', menu: 'ម៉ឺនុយ', modules: 'ម៉ូឌុល', backHome: 'ត្រឡប់ទៅទំព័រដើម', mainSite: 'គេហទំព័រមេ',
    welcomeBack: 'សូមស្វាគមន៍ការត្រឡប់មកវិញ', loginDesc: 'ចូលគណនីដើម្បីបន្ត។', createAccount: 'បង្កើតគណនី', registerDesc: 'ចូលរួមជាមួយ VK_ETN និងរីករាយជាមួយការផ្ដល់ជូនពិសេស។',
    email: 'អ៊ីមែល', password: 'ពាក្យសម្ងាត់', confirmPassword: 'បញ្ជាក់ពាក្យសម្ងាត់', name: 'ឈ្មោះ', phone: 'លេខទូរស័ព្ទ', remember: 'ចងចាំខ្ញុំ', forgot: 'ភ្លេចពាក្យសម្ងាត់?',
    noAccount: 'មិនទាន់មានគណនី?', haveAccount: 'មានគណនីរួចហើយ?', demoAdmin: 'គណនីសាកល្បង', agreeTerms: 'ខ្ញុំយល់ព្រមលើលក្ខខណ្ឌ និងគោលការណ៍ឯកជនភាព',
    tagline: 'ពិភពបច្ចេកវិទ្យារបស់អ្នក', authTitle: 'ពិភពបច្ចេកវិទ្យារបស់អ្នក', authDesc: 'ស្មាតហ្វូន កុំព្យូទ័រ សំឡេង និងគ្រឿងបន្លាស់ — ដឹកជញ្ជូនរហ័សទូទាំងកម្ពុជា។',
    loginOk: 'ចូលគណនីជោគជ័យ', registerOk: 'បានបង្កើតគណនី', wrongCreds: 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ', emailExists: 'អ៊ីមែលនេះបានចុះឈ្មោះរួចហើយ', passMismatch: 'ពាក្យសម្ងាត់មិនដូចគ្នា', passShort: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួ',
    adminOnly: 'សូមចូលគណនីអ្នកគ្រប់គ្រង (admin)', search: 'ស្វែងរក', all: 'ទាំងអស់', refresh: 'ផ្ទុកឡើងវិញ', save: 'រក្សាទុក', saved: 'បានរក្សាទុក', cancel: 'បោះបង់', delete: 'លុប', deleted: 'បានលុប',
    table: 'តារាង', cards: 'កាត', exportJson: 'នាំចេញ JSON', results: 'លទ្ធផល', noData: 'រកមិនឃើញទិន្នន័យ', loading: 'កំពុងផ្ទុក…', retry: 'ព្យាយាមម្ដងទៀត', error: 'មានបញ្ហាកើតឡើង',
    operational: 'ដំណើរការធម្មតា', degraded: 'យឺត', down: 'មិនដំណើរការ', latency: 'ល្បឿនឆ្លើយតប', lastCheck: 'ពិនិត្យចុងក្រោយ', autoRefresh: 'ផ្ទុកស្វ័យប្រវត្តិ', uptime: 'ពេលដំណើរការ', endpoint: 'ចំណុចបញ្ចប់', status: 'ស្ថានភាព', checks: 'ដង',
    amount: 'ចំនួនទឹកប្រាក់', currency: 'រូបិយប័ណ្ណ', billNumber: 'លេខវិក្កយបត្រ', generate: 'បង្កើត KHQR', checkPayment: 'ពិនិត្យការបង់ប្រាក់', downloadQr: 'ទាញយក QR', expiresIn: 'ផុតកំណត់ក្នុង',
    paid: 'បានបង់', notPaid: 'មិនទាន់បង់', demoMode: 'របៀបសាកល្បង (មិនទាន់កំណត់តូខឹនបាគង)', scanToPay: 'ស្កេនជាមួយកម្មវិធីធនាគារសមាជិកបាគងណាមួយ', merchant: 'អ្នកលក់', payload: 'ទិន្នន័យ KHQR',
    writeReview: 'សរសេរមតិ', yourRating: 'ការវាយតម្លៃរបស់អ្នក', yourReview: 'មតិរបស់អ្នក', post: 'បញ្ចេញ', product: 'ផលិតផល', rating: 'ការវាយតម្លៃ', loginToReview: 'ចូលគណនីដើម្បីសរសេរមតិ', reviewPosted: 'បានបញ្ចេញមតិ',
    collection: 'បណ្ដុំទិន្នន័យ', items: 'ធាតុ', fields: 'វាល', role: 'តួនាទី', joined: 'ចូលរួម', selected: 'បានជ្រើស', deleteSelected: 'លុបដែលបានជ្រើស', confirmDelete: 'លុបធាតុដែលបានជ្រើស?',
    updateProfile: 'ធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូប', newPassword: 'ពាក្យសម្ងាត់ថ្មី', leaveBlank: 'ទុកទទេដើម្បីរក្សាដដែល', changePhoto: 'ប្ដូររូបថត',
    hello: 'សួស្តី', overviewDesc: 'ផ្នែកខាងមុខ Vue 3 + Vite សម្រាប់ហាង VK_ETN — គ្មានម៉ាស៊ីនមេ ទិន្នន័យរក្សាទុកក្នុងកម្មវិធីរុករកនេះ។', products: 'ផលិតផល', orders: 'ការបញ្ជាទិញ', categories: 'ប្រភេទ', settings: 'ការកំណត់',
    notFound: 'រកមិនឃើញទំព័រ', open: 'បើក', theme: 'រូបរាង', language: 'ភាសា',
  },
}

const saved = storage.get('vk_lang')
export const lang = ref(saved === 'km' ? 'km' : 'en')

export function t(key) {
  return messages[lang.value]?.[key] ?? messages.en[key] ?? key
}

export function setLang(l) {
  if (l !== 'en' && l !== 'km') return
  lang.value = l
  storage.set('vk_lang', l)
  document.documentElement.lang = l
}

export function initI18n() {
  document.documentElement.lang = lang.value
}

export function useI18n() {
  return { t, lang, setLang }
}
