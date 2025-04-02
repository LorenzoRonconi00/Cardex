import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Aggiungi la pagina di errore alle eccezioni
  const isAuthPage = pathname.startsWith('/auth');
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicFile = pathname.startsWith('/_next') || 
                       pathname.includes('/images/') || 
                       pathname.includes('/fonts/') ||
                       pathname.endsWith('.svg') || 
                       pathname.endsWith('.ico');
  
  // Se è una pagina di autenticazione o una route API di autenticazione, consenti
  if (isAuthPage || isApiAuthRoute || isPublicFile) {
    return NextResponse.next();
  }
  
  try {
    // Ottieni il token dalla richiesta
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Se non c'è token, reindirizza alla pagina di login
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      // Importante: salva l'URL originale come callbackUrl per tornare dopo il login
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    // Se c'è un token, consenti la richiesta
    return NextResponse.next();
  } catch (error) {
    // In caso di errore, log e consenti comunque la richiesta per evitare loop
    console.error('Middleware auth error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};