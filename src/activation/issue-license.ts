// issue-license.ts - أداة توليد التراخيص للمطور
const MASTER_SECRET = 'MARO_HARDWARE_SECRET_2026_MASTER_KEY';

function generateActivationKeyForSerial(deviceSerial: string): string {
    const cleanSerial = deviceSerial.trim().toUpperCase();
    const secretSeed = `${cleanSerial}::${MASTER_SECRET}::2026::MARO_KEY_GEN`;
    
    let hash = 5381;
    for (let i = 0; i < secretSeed.length; i++) {
        hash = (hash * 33) ^ secretSeed.charCodeAt(i);
    }
    
    const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    const p1 = hexHash.substring(0, 4);
    const p2 = hexHash.substring(4, 8);
    const p3 = cleanSerial.replace(/MARO-HW-|-/g, '').substring(0, 4) || '9999';

    return `MARO-KEY-${p1}-${p2}-${p3}`;
}

// ---------------------------------------------------------
// ضع هنا سيريال العميل
const clientSerial = "87f372c6-6666-47df-a66a-2f730b03e9ae";
// ---------------------------------------------------------

console.log("-----------------------------------------");
console.log(`Activation Key for ${clientSerial}:`);
console.log(generateActivationKeyForSerial(clientSerial));
console.log("-----------------------------------------");
