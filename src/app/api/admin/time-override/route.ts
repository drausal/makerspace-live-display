// app/api/admin/time-override/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/kv-storage';

export async function POST(request: NextRequest) {
  const storage = new KVStorage();
  
  try {
    const body = await request.json();
    const { mockTime, password } = body;
    
    // Basic password check (in production, use proper auth)
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      console.log('❌ Invalid admin password');
      return NextResponse.json({
        success: false,
        error: 'Invalid admin password'
      }, { status: 401 });
    }
    
    console.log(`⚙️ Admin time override request: ${mockTime || 'CLEAR'}`);
    
    // Validate mockTime if provided
    if (mockTime && isNaN(new Date(mockTime).getTime())) {
      console.log(`❌ Invalid date format: ${mockTime}`);
      return NextResponse.json({
        success: false,
        error: 'Invalid date format - use ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)'
      }, { status: 400 });
    }
    
    await storage.setTimeOverride(mockTime || null);
    
    const response = {
      success: true,
      mockTime: mockTime || null,
      message: mockTime ? `Time override set to ${mockTime}` : 'Time override cleared - using real time',
      currentRealTime: new Date().toISOString()
    };
    
    console.log(`✅ Time override ${mockTime ? 'set' : 'cleared'} successfully`);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Time override error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to set time override',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  const storage = new KVStorage();
  
  try {
    const mockTime = await storage.getTimeOverride();
    
    console.log(`⚙️ Admin time override status: ${mockTime || 'NONE'}`);
    
    return NextResponse.json({
      mockTime: mockTime || null,
      isActive: Boolean(mockTime),
      currentRealTime: new Date().toISOString(),
      message: mockTime ? `Active override: ${mockTime}` : 'Using real time'
    });
    
  } catch (error) {
    console.error('❌ Get time override error:', error);
    return NextResponse.json({
      error: 'Failed to get time override status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
