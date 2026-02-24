// List of free/personal email domains to block
const freeEmailDomains = [
    'gmail.com', 'googlemail.com', 'google.com',
    'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'yahoo.ca', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it', 'yahoo.com.br', 'yahoo.com.au', 'ymail.com', 'rocketmail.com',
    'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.es', 'hotmail.it',
    'outlook.com', 'outlook.co.uk', 'outlook.fr', 'outlook.de', 'outlook.es', 'outlook.it',
    'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.nl',
    'msn.com', 'passport.com',
    'aol.com', 'aim.com',
    'icloud.com', 'me.com', 'mac.com',
    'mail.com', 'email.com', 'usa.com', 'post.com',
    'protonmail.com', 'proton.me', 'pm.me',
    'zoho.com', 'zohomail.com',
    'yandex.com', 'yandex.ru',
    'gmx.com', 'gmx.net', 'gmx.de',
    'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru',
    'rediffmail.com',
    'qq.com', '163.com', '126.com', 'sina.com',
    'web.de', 'freenet.de', 't-online.de',
    'libero.it', 'virgilio.it', 'alice.it',
    'orange.fr', 'wanadoo.fr', 'laposte.net', 'sfr.fr', 'free.fr',
    'btinternet.com', 'sky.com', 'talktalk.net', 'ntlworld.com',
    'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'cox.net', 'charter.net',
    'bellsouth.net', 'earthlink.net', 'juno.com', 'netzero.net',
    'tutanota.com', 'tutamail.com', 'tuta.io',
    'fastmail.com', 'fastmail.fm',
    'hushmail.com', 'runbox.com', 'mailfence.com',
    'temp-mail.org', 'guerrillamail.com', '10minutemail.com', 'mailinator.com'
];

export const isWorkEmail = (email) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !freeEmailDomains.includes(domain);
};