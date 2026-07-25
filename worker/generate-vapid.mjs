import {createECDH} from 'node:crypto';

const ecdh=createECDH('prime256v1');
ecdh.generateKeys();
const base64url=value=>Buffer.from(value).toString('base64url');
console.log(`VAPID_PUBLIC_KEY=${base64url(ecdh.getPublicKey(undefined,'uncompressed'))}`);
console.log(`VAPID_PRIVATE_KEY=${base64url(ecdh.getPrivateKey())}`);
console.log('VAPID_SUBJECT=mailto:DEINE-ADRESSE@example.com');
