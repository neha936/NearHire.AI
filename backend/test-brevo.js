import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testBrevo() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const mockMode = process.env.AWS_SES_MOCK;

  console.log('====================================');
  console.log('       BREVO API DIAGNOSTIC        ');
  console.log('====================================');
  console.log(`AWS_SES_MOCK:       ${mockMode}`);
  console.log(`BREVO_SENDER_EMAIL: ${senderEmail || '(Not set)'}`);
  console.log(`BREVO_API_KEY:      ${apiKey ? (apiKey.substring(0, 12) + '...') : '(Not set)'}`);
  console.log('------------------------------------\n');

  if (!apiKey || apiKey.includes('your_') || apiKey.includes('YOUR_')) {
    console.error('❌ STATUS: Brevo API Key is missing or using placeholder value in backend/.env!');
    console.log('\nTo fix this:');
    console.log('1. Open backend/.env');
    console.log('2. Replace BREVO_API_KEY=your_brevo_api_key with your actual Brevo API Key (starts with xkeysib-)');
    console.log('3. Set BREVO_SENDER_EMAIL to your verified Brevo sender email address');
    console.log('4. Set AWS_SES_MOCK=false to enable live email sending');
    return;
  }

  console.log('📡 Testing connection to Brevo API (GET https://api.brevo.com/v3/account)...');

  try {
    const res = await axios.get('https://api.brevo.com/v3/account', {
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    console.log('\n✅ SUCCESS: Brevo API Key is VALID!');
    console.log(`   Account Email: ${res.data.email}`);
    console.log(`   Account Name:  ${res.data.firstName} ${res.data.lastName}`);
    console.log(`   Plan Type:     ${res.data.plan?.[0]?.type || 'N/A'}`);
    console.log(`   Credits Left:  ${res.data.plan?.[0]?.credits ?? 'N/A'}`);

    if (mockMode === 'true') {
      console.log('\n⚠️ NOTE: AWS_SES_MOCK=true is enabled in backend/.env.');
      console.log('   The application will bypass actual email sending and use MOCK MODE.');
      console.log('   Set AWS_SES_MOCK=false in backend/.env if you want real emails delivered to inbox.');
    } else {
      console.log('\n🚀 Live mode is ACTIVE. Emails will be delivered via Brevo SMTP API.');
    }
  } catch (error) {
    console.error('\n❌ ERROR: Failed to authenticate with Brevo API!');
    if (error.response) {
      console.error(`   HTTP Status: ${error.response.status}`);
      console.error(`   Message:     ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Error:       ${error.message}`);
    }
  }
}

testBrevo();
