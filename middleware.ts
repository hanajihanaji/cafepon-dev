import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // 開発環境では認証をスキップ
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // ベーシック認証が無効の場合はスキップ
  if (process.env.ENABLE_BASIC_AUTH !== 'true') {
    return NextResponse.next();
  }

  // ベーシック認証の設定
  const basicAuth = request.headers.get('authorization');
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // 環境変数から認証情報を取得
    const validUser = process.env.BASIC_AUTH_USER || 'cafepon';
    const validPassword = process.env.BASIC_AUTH_PASSWORD || 'cafeponpass';

    // 認証情報の確認
    if (user === validUser && pwd === validPassword) {
      return NextResponse.next();
    }
  }

  // 認証が必要な場合の処理
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}