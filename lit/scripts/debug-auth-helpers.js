const helpers = require('@lit-protocol/auth-helpers');
console.log('Keys:', Object.keys(helpers));
if (helpers.LIT_ABILITY) console.log('LIT_ABILITY:', helpers.LIT_ABILITY);
if (helpers.LitAbility) console.log('LitAbility:', helpers.LitAbility);
