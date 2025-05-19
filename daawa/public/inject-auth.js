// This script can be loaded in the browser console to inject authentication tokens

(function() {
  const TOKEN_STORAGE_KEY = 'daawa_auth_tokens';
  
  // The test login response with tokens and user data
  const testLoginData = {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "USER"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQ3NjEwOTEzLCJleHAiOjE3NDc2OTczMTN9.cZeHJARu-Y_NHU9FZ5Oh6AKuFZ_Zt1hp8RzNSFGJkBk",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQ3NjEwOTEzLCJleHAiOjE3NDgyMTU3MTN9.BzAeVgWdzmGFbdC7mR-F6gb2ekUpKsMryv-pYv4sJM0"
    }
  };
  
  // Store the tokens in localStorage
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(testLoginData.tokens));
  
  // Simulate auth context update - optional, depends on how your frontend is designed
  // If you have a global event for auth state:
  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('auth-state-change', { detail: testLoginData }));
  }
  
  console.log("Authentication tokens injected into localStorage.");
  console.log("User information:", testLoginData.user);
  console.log("You should now be able to access authenticated routes.");
  console.log("If you need to refresh the page, please run this script again.");
})(); 