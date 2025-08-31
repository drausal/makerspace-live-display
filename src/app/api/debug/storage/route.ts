// app/api/debug/storage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LocalStorage } from '@/lib/local-storage';

// GET /api/debug/storage - Get storage info
export async function GET() {
  const storage = new LocalStorage();
  
  try {
    const storageInfo = await storage.getStorageInfo();
    const systemHealth = await storage.getSystemHealth();
    
    return NextResponse.json({
      info: storageInfo,
      health: systemHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/debug/storage - Clear all localStorage (requires admin password)
export async function DELETE(request: NextRequest) {
  const storage = new LocalStorage();
  
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    
    // Basic password check (same as admin routes)
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      console.log('❌ Invalid admin password for storage clear');
      return NextResponse.json({
        success: false,
        error: 'Invalid admin password'
      }, { status: 401 });
    }
    
    await storage.clearAll();
    console.log('🗑️ Admin cleared all localStorage data');
    
    return NextResponse.json({
      success: true,
      message: 'All localStorage data cleared',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear localStorage',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
