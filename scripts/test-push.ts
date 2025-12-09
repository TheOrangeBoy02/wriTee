// scripts/test-push.ts
// Usage: Replace YOUR_TOKEN_HERE with actual Expo push token from app logs
// Run with: npx ts-node scripts/test-push.ts

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

async function sendTestPush(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Test Push Notification',
    body: 'This is a test from your development environment!',
    data: { type: 'test' },
  };

  console.log('Sending test push notification...');
  console.log('Token:', expoPushToken);

  try {
    const response = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Success! Result:', JSON.stringify(result, null, 2));

    // Check for errors in response
    if (result.data && result.data[0]?.status === 'error') {
      console.error('Push notification error:', result.data[0].message);
    } else {
      console.log('✅ Push notification sent successfully!');
      console.log('Receipt ID:', result.data[0]?.id);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Replace with actual token from app logs
const token = 'ExponentPushToken[YOUR_TOKEN_HERE]';

if (token === 'ExponentPushToken[YOUR_TOKEN_HERE]') {
  console.error('❌ Please replace YOUR_TOKEN_HERE with an actual Expo push token');
  console.log('\nTo get your push token:');
  console.log('1. Run the app: npm run dev');
  console.log('2. Look for "Expo Push Token:" in the console logs');
  console.log('3. Copy the token (e.g., ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx])');
  console.log('4. Replace YOUR_TOKEN_HERE in this script');
  console.log('5. Run: npx ts-node scripts/test-push.ts');
} else {
  sendTestPush(token);
}
