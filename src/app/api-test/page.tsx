// app/api-test/page.tsx - Simple API testing page
export default function ApiTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>API Test Page</h1>
      <p>Test the API endpoints directly:</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Health Check</h3>
        <a href="/api/health" target="_blank" style={{ color: 'blue', textDecoration: 'underline' }}>
          /api/health
        </a>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Display Status</h3>
        <a href="/api/display/status" target="_blank" style={{ color: 'blue', textDecoration: 'underline' }}>
          /api/display/status
        </a>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Admin Time Override</h3>
        <p>POST to /api/admin/time-override with password and time data</p>
      </div>
    </div>
  );
}
