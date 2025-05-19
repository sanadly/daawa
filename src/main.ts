// Create test users if in development environment
if (process.env.NODE_ENV !== 'production') {
  await createTestUsers();
}

const port = process.env.PORT || 3005; // Changed from 3002 to avoid conflicts
await app.listen(port);
console.log(`Application is running on: ${await app.getUrl()}`); 