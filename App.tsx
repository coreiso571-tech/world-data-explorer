import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, AppView } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/home/HeroSection';
import { DidYouKnowCard } from './components/home/DidYouKnowCard';
import { AdvancedSearchFilterBar, SearchFilterState } from './components/home/AdvancedSearchFilterBar';
import { TrendingRankingsSection } from './components/home/TrendingRankingsSection';
import { CategoryExplorer } from './components/home/CategoryExplorer';
import { RegionalMapSection } from './components/home/RegionalMapSection';
import { ArticlesGrid } from './components/home/ArticlesGrid';
import { DataTable } from './components/common/DataTable';
import { SearchModal } from './components/common/SearchModal';
import { StatDetailModal } from './components/common/StatDetailModal';
import { ArticleDetailModal } from './components/article/ArticleDetailModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { WeatherWidget } from './components/home/WeatherWidget';
import { DailyEssentials } from './components/home/DailyEssentials';
import { DeveloperModal } from './components/home/DeveloperModal';
import { InteractiveStudio } from './components/interactive/InteractiveStudio';
import { QuizApp } from './components/quiz/QuizApp';
import { UserProfileDashboard } from './components/profile/UserProfileDashboard';
import { InternationalHub } from './components/international/InternationalHub';
import { InternationalTeaserSection } from './components/home/InternationalTeaserSection';
import { AIChatbotWidget } from './components/ai/AIChatbotWidget';
import { dataService } from './services/dataService';
import { Statistic, Article, Category } from './types';
import { INITIAL_CATEGORIES } from './data/seedData';

function MainAppContent() {
  const { isAdmin, loading: authLoading } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Category filter for CategoryExplorer tab clicks
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Advanced Global Search & Filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilterState>({
    searchQuery: '',
    category: 'all',
    datePeriod: 'all',
    region: 'all',
    contentType: 'all',
  });

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<Statistic | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Initial load and URL routing detection
  useEffect(() => {
    async function loadPublicData() {
      setLoading(true);
      try {
        const [statsData, articlesData, catsData] = await Promise.all([
          dataService.getPublishedStatistics(),
          dataService.getPublishedArticles(),
          dataService.getCategories(),
        ]);
        setStatistics(statsData);
        setArticles(articlesData);
        if (catsData.length > 0) setCategories(catsData);

        // Check deep-linking from hash or pathname
        const path = window.location.pathname;
        const hash = window.location.hash;

        if (path === '/quiz' || hash === '#quiz') {
          setCurrentView('quiz');
        } else if (path === '/interaktiv' || hash === '#interaktiv' || hash === '#statistika') {
          setCurrentView('interactive');
        } else if (path === '/profil' || hash === '#profil') {
          setCurrentView('profile');
        } else if (path === '/xalqaro' || hash === '#xalqaro') {
          setCurrentView('international');
        } else if (hash.startsWith('#statistika/')) {
          const slug = hash.replace('#statistika/', '');
          const found = statsData.find((s) => s.slug === slug);
          if (found) setSelectedStat(found);
        } else if (hash.startsWith('#maqola/')) {
          const slug = hash.replace('#maqola/', '');
          const found = articlesData.find((a) => a.slug === slug);
          if (found) setSelectedArticle(found);
        } else if (hash === '#admin') {
          setCurrentView('admin');
        } else if (hash === '#jadval') {
          setCurrentView('table');
        }
      } catch (err) {
        console.error('Error fetching public data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPublicData();
  }, []);

  // Listen for browser navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/quiz' || hash === '#quiz') {
        setCurrentView('quiz');
      } else if (path === '/interaktiv' || hash === '#interaktiv' || hash === '#statistika') {
        setCurrentView('interactive');
      } else if (path === '/profil' || hash === '#profil') {
        setCurrentView('profile');
      } else if (path === '/xalqaro' || hash === '#xalqaro') {
        setCurrentView('international');
      } else if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#jadval') {
        setCurrentView('table');
      } else if (!hash) {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update hash when opening deep detail modals or switching views
  useEffect(() => {
    if (selectedStat) {
      window.location.hash = `statistika/${selectedStat.slug}`;
    } else if (selectedArticle) {
      window.location.hash = `maqola/${selectedArticle.slug}`;
    } else if (currentView === 'admin') {
      window.location.hash = 'admin';
    } else if (currentView === 'table') {
      window.location.hash = 'jadval';
    } else if (currentView === 'interactive') {
      window.location.hash = 'interaktiv';
    } else if (currentView === 'quiz') {
      window.location.hash = 'quiz';
    } else if (currentView === 'profile') {
      window.location.hash = 'profil';
    } else if (currentView === 'international') {
      window.location.hash = 'xalqaro';
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [selectedStat, selectedArticle, currentView]);

  // Synchronize category filter between CategoryExplorer tabs and AdvancedSearchFilterBar
  const handleCategoryExplorerSelect = (slug: string) => {
    setSelectedCategory(slug);
    setSearchFilters((prev) => ({
      ...prev,
      category: slug,
    }));
  };

  // Filtered statistics for homepage based on AdvancedSearchFilterBar
  const filteredStatistics = useMemo(() => {
    if (searchFilters.contentType === 'articles') return [];
    const q = searchFilters.searchQuery.trim().toLowerCase();

    return statistics.filter((s) => {
      // Category filter
      if (searchFilters.category !== 'all' && s.category !== searchFilters.category) {
        return false;
      }
      // Date period filter
      if (searchFilters.datePeriod === '2026' && !s.verificationDate?.startsWith('2026')) return false;
      if (searchFilters.datePeriod === '2025' && !s.verificationDate?.startsWith('2025')) return false;
      if (searchFilters.datePeriod === '2024' && !s.verificationDate?.startsWith('2024')) return false;
      if (
        searchFilters.datePeriod === 'recent5' &&
        !s.dataSeries?.some((d) => ['2022', '2023', '2024', '2025', '2026'].includes(d.label))
      ) {
        return false;
      }
      if (
        searchFilters.datePeriod === 'historical' &&
        !s.dataSeries?.some((d) => Number(d.label) <= 2019)
      ) {
        return false;
      }

      // Region filter
      if (searchFilters.region !== 'all') {
        const targetRegion = searchFilters.region.toLowerCase();
        const matchesRegion =
          (s.region && s.region.toLowerCase().includes(targetRegion)) ||
          s.title.toLowerCase().includes(targetRegion) ||
          s.description.toLowerCase().includes(targetRegion) ||
          s.dataSeries?.some((d) => d.label.toLowerCase().includes(targetRegion));
        if (!matchesRegion) return false;
      }

      // Text query
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.sourceName.toLowerCase().includes(q)
      );
    });
  }, [statistics, searchFilters]);

  // Filtered articles for homepage based on AdvancedSearchFilterBar
  const filteredArticles = useMemo(() => {
    if (searchFilters.contentType === 'stats') return [];
    const q = searchFilters.searchQuery.trim().toLowerCase();

    return articles.filter((a) => {
      // Category filter
      if (searchFilters.category !== 'all' && a.category !== searchFilters.category) {
        return false;
      }
      // Date filter
      if (searchFilters.datePeriod === '2026' && !a.createdAt?.startsWith('2026')) return false;
      if (searchFilters.datePeriod === '2025' && !a.createdAt?.startsWith('2025')) return false;

      // Region filter
      if (searchFilters.region !== 'all') {
        const targetRegion = searchFilters.region.toLowerCase();
        const matchesRegion =
          a.title.toLowerCase().includes(targetRegion) ||
          a.excerpt.toLowerCase().includes(targetRegion) ||
          a.content.toLowerCase().includes(targetRegion) ||
          a.tags.some((t) => t.toLowerCase().includes(targetRegion));
        if (!matchesRegion) return false;
      }

      // Text query
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [articles, searchFilters]);

  const totalFilteredResultsCount = filteredStatistics.length + filteredArticles.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenDeveloperModal={() => setDeveloperModalOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <main className="flex-1">
        {/* View 1: Admin CMS */}
        {currentView === 'admin' ? (
          authLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isAdmin ? (
            <AdminDashboard />
          ) : (
            <AdminLogin onBackToPublic={() => setCurrentView('home')} />
          )
        ) : currentView === 'table' ? (
          /* View 2: Full Data Table */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                Ma'lumotlar Registri
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                O'zbekiston Davlat Ko'rsatkichlari Umumiy Jadvali
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Barcha sohalar bo'yicha saralanadigan, qidiriladigan va CSV formatida yuklab olinadigan rasmiy ma'lumotlar.
              </p>
            </div>
            <DataTable
              data={statistics}
              onSelectStat={(stat) => setSelectedStat(stat)}
            />
          </div>
        ) : currentView === 'interactive' ? (
          /* View 3: Interactive Statistics Studio */
          <InteractiveStudio
            statistics={statistics}
            categories={categories}
            onSelectStat={(stat) => setSelectedStat(stat)}
          />
        ) : currentView === 'quiz' ? (
          /* View 4: Quiz & Trivia System */
          <QuizApp onBackToHome={() => setCurrentView('home')} />
        ) : currentView === 'profile' ? (
          /* View 5: Personal Profile Dashboard */
          <UserProfileDashboard
            statistics={statistics}
            articles={articles}
            onSelectStat={(stat) => setSelectedStat(stat)}
            onSelectArticle={(article) => setSelectedArticle(article)}
            onBackToHome={() => setCurrentView('home')}
          />
        ) : currentView === 'international' ? (
          /* View 6: International Data Hub (Xalqaro ma'lumotlar markazi) */
          <InternationalHub
            onBackToHome={() => setCurrentView('home')}
            onSelectStat={(stat) => setSelectedStat(stat)}
          />
        ) : (
          /* View 7: Home Page */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero with Search Trigger & 4 Key Featured Metrics */}
            <HeroSection
              onOpenSearch={() => setSearchOpen(true)}
              featuredStats={statistics}
              onSelectStat={(stat) => setSelectedStat(stat)}
            />

            {/* "Bilarmidingiz?" (Did you know?) Daily Trivia Card */}
            <DidYouKnowCard />

            {/* Prominent Advanced Search & Filter Bar */}
            <AdvancedSearchFilterBar
              filters={searchFilters}
              onFilterChange={setSearchFilters}
              categories={categories}
              totalResultsCount={totalFilteredResultsCount}
              statsCount={filteredStatistics.length}
              articlesCount={filteredArticles.length}
              onOpenFullModal={() => setSearchOpen(true)}
            />

            {/* Trends & Rankings Section (Most Viewed, Popular, Newly Added) */}
            <TrendingRankingsSection
              statistics={statistics}
              articles={articles}
              onSelectStat={(stat) => setSelectedStat(stat)}
              onSelectArticle={(article) => setSelectedArticle(article)}
            />

            {/* Daily Essentials: Currency, Prayer Times, Air Quality Index */}
            <DailyEssentials />

            {/* Real-time Uzbekistan Weather Widget */}
            <WeatherWidget />

            {/* Core Categories Explorer with Filtered Statistics */}
            <CategoryExplorer
              categories={categories}
              selectedCategory={searchFilters.category !== 'all' ? searchFilters.category : selectedCategory}
              onSelectCategory={handleCategoryExplorerSelect}
              statistics={filteredStatistics}
              onSelectStat={(stat) => setSelectedStat(stat)}
              loading={loading}
            />

            {/* Regional Analysis Section (14 regions of Uzbekistan - Primary Focus) */}
            <RegionalMapSection />

            {/* International Data Hub Teaser (O'zbekiston Global Kontekstda - Complements, Not Replaces) */}
            <InternationalTeaserSection
              onNavigateToInternational={() => {
                setCurrentView('international');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Data Journalism Stories with Filtered Articles */}
            <ArticlesGrid
              articles={filteredArticles}
              onSelectArticle={(art) => setSelectedArticle(art)}
              loading={loading}
            />
          </div>
        )}
      </main>

      {/* Floating 'UzData AI' Chatbot Widget (Bottom Right) */}
      <AIChatbotWidget
        statistics={statistics}
        articles={articles}
        onNavigateHash={(h) => {
          window.location.hash = h;
          if (h.startsWith('#statistika/')) {
            const slug = h.replace('#statistika/', '');
            const found = statistics.find((s) => s.slug === slug);
            if (found) setSelectedStat(found);
          } else if (h.startsWith('#maqola/')) {
            const slug = h.replace('#maqola/', '');
            const found = articles.find((a) => a.slug === slug);
            if (found) setSelectedArticle(found);
          } else if (h === '#quiz') {
            setCurrentView('quiz');
          } else if (h === '#interaktiv') {
            setCurrentView('interactive');
          } else if (h === '#profil') {
            setCurrentView('profile');
          } else if (h === '#xalqaro') {
            setCurrentView('international');
          }
        }}
      />

      <Footer onOpenDeveloperModal={() => setDeveloperModalOpen(true)} />

      {/* Global Modals */}
      <DeveloperModal
        isOpen={developerModalOpen}
        onClose={() => setDeveloperModalOpen(false)}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        statistics={statistics}
        articles={articles}
        onSelectStat={(stat) => setSelectedStat(stat)}
        onSelectArticle={(art) => setSelectedArticle(art)}
      />

      <StatDetailModal
        stat={selectedStat}
        onClose={() => setSelectedStat(null)}
        categoryName={categories.find((c) => c.slug === selectedStat?.category)?.name}
      />

      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
