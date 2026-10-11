import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import NewsNavbar from './components/NewsNavbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/admin/AdminLayout.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { useAuthStore } from './store/authStore'

// News Website pages (code split)
const NewsHomePage = lazy(() => import('./pages/NewsHomePage'))
const NewsArticlePage = lazy(() => import('./pages/NewsArticlePage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const CareersPage = lazy(() => import('./pages/CareersPage'))
const PolicyPage = lazy(() => import('./pages/PolicyPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))

// Admin pages (code split)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminNews = lazy(() => import('./pages/admin/AdminNews'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminReporters = lazy(() => import('./pages/admin/AdminReporters'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminWhatsApp = lazy(() => import('./pages/admin/AdminWhatsApp'))

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#1B2B5E] border-t-transparent rounded-full animate-spin" />
  </div>
)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const { initialize, user } = useAuthStore()

  useEffect(() => { initialize() }, [])

  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Admin Login (no layout) */}
          <Route path="/admin/login" element={
            <Suspense fallback={<PageLoader />}>
              <AdminLogin />
            </Suspense>
          } />

          {/* Admin routes — own layout, no news navbar/footer */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="news" element={<AdminNews />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="reporters" element={<AdminReporters />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="whatsapp" element={<AdminWhatsApp />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </AdminLayout>
            </AdminRoute>
          } />

          {/* News Website routes */}
          <Route path="/*" element={
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <NewsNavbar />
              <main className="flex-1">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<NewsHomePage />} />
                      <Route path="/news/:slug" element={<NewsArticlePage />} />
                      <Route path="/category/:slug" element={<CategoryPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/team" element={<TeamPage />} />
                      <Route path="/careers" element={<CareersPage />} />
                      <Route path="/privacy-policy" element={<PolicyPage />} />
                      <Route path="/terms" element={<PolicyPage />} />
                      <Route path="/disclaimer" element={<PolicyPage />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </main>
              <Footer />
            </div>
          } />
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#1A1A2E',
              border: '1px solid #E8E0D5',
              boxShadow: '0 8px 32px rgba(27,43,94,0.18)',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '500',
              padding: '14px 20px',
              maxWidth: '420px',
              textAlign: 'center',
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
              },
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              style: {
                background: '#fff1f2',
                color: '#9f1239',
                border: '1px solid #fecdd3',
              },
              iconTheme: { primary: '#e11d48', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  )
}
