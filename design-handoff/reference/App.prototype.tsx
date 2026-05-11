import { useState } from 'react';
import { TabBar } from './components/TabBar';
import { NavigationHeader } from './components/NavigationHeader';
import { SalonSwitcherSheet } from './components/SalonSwitcherSheet';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { BookingsScreen } from './screens/BookingsScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ServiceDetailScreen } from './screens/ServiceDetailScreen';
import { SalonDetailScreen } from './screens/SalonDetailScreen';
import { QuickRebookScreen } from './screens/QuickRebookScreen';
import { StylistSelectionScreen } from './screens/StylistSelectionScreen';
import { DateTimeSelectionScreen } from './screens/DateTimeSelectionScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { BookingConfirmationScreen } from './screens/BookingConfirmationScreen';
import { MySalonsScreen } from './screens/MySalonsScreen';
import { MyVibeMoodBoardScreen } from './screens/MyVibeMoodBoardScreen';
import { WaitlistScreen } from './screens/placeholders/WaitlistScreen';
import { ReferralScreen } from './screens/placeholders/ReferralScreen';
import { MessagesInboxScreen } from './screens/MessagesInboxScreen';
import { ConversationThreadScreen } from './screens/ConversationThreadScreen';
import { MessageNotificationSettingsScreen } from './screens/MessageNotificationSettingsScreen';
import { MessagingDisabledScreen } from './screens/MessagingDisabledScreen';
import { QuickRepliesSheet } from './components/QuickRepliesSheet';
import { WalkInQueueScreen } from './screens/WalkInQueueScreen';
import { ClientLookupScreen } from './screens/ClientLookupScreen';
import { ClientDetailScreen } from './screens/ClientDetailScreen';

type AppView =
  | 'welcome'
  | 'onboarding'
  | 'home'
  | 'explore'
  | 'bookings'
  | 'rewards'
  | 'profile'
  | 'service-detail'
  | 'salon-detail'
  | 'quick-rebook'
  | 'stylist-selection'
  | 'datetime-selection'
  | 'payment'
  | 'booking-confirmation'
  | 'my-salons'
  | 'my-vibe-mood-board'
  | 'waitlist'
  | 'referral'
  | 'messages-inbox'
  | 'conversation-thread'
  | 'message-settings'
  | 'messaging-disabled'
  | 'walk-in-queue'
  | 'client-lookup'
  | 'client-detail';

const mockSalons = [
  { id: '1', name: 'Bloom Beauty Studio', points: 340, tier: 'Silver', upcomingBookings: 2 },
  { id: '2', name: 'Lush Lash Lounge', points: 580, tier: 'Gold', upcomingBookings: 1 },
  { id: '3', name: 'Glow Spa & Wellness', points: 125, tier: 'Bronze', upcomingBookings: 0 },
];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeSalonId, setActiveSalonId] = useState<string>('1');
  const [showSalonSwitcher, setShowSalonSwitcher] = useState(false);
  const [selectedSalonId, setSelectedSalonId] = useState<string>('1');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [currentConversationSalon, setCurrentConversationSalon] = useState<string>('');
  const [unreadMessageCount] = useState(3);
  const [selectedClientId, setSelectedClientId] = useState<string>('c3');

  // Booking flow state
  const [bookingData, setBookingData] = useState({
    serviceId: '',
    serviceName: '',
    servicePrice: 0,
    serviceDuration: '',
    stylistId: '',
    stylistName: '',
    date: '',
    time: '',
  });

  const activeSalon = mockSalons.find(s => s.id === activeSalonId);
  const activeSalonName = activeSalon?.name || null;

  const handleGetStarted = () => {
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = () => {
    setCurrentView('home');
    setActiveTab('home');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentView(tab as AppView);
  };

  const handleServiceClick = (serviceId: string) => {
    setSelectedSalonId(serviceId); // In real app, map serviceId to salonId
    setCurrentView('salon-detail');
  };

  const handleSalonClick = (salonId: string) => {
    setSelectedSalonId(salonId);
    setCurrentView('salon-detail');
  };

  const handleQuickRebook = (serviceId: string) => {
    setSelectedSalonId(serviceId);
    setCurrentView('quick-rebook');
  };

  const handleBookNow = () => {
    setCurrentView('booking-confirmation');
  };

  const handleBookingComplete = () => {
    setCurrentView('home');
    setActiveTab('home');
  };

  const handleBackToExplore = () => {
    setCurrentView('explore');
    setActiveTab('explore');
  };

  const handleBackFromSalon = () => {
    setCurrentView(activeTab as AppView);
  };

  const handleNavigateToRewardsFromSalon = (salonId: string) => {
    setActiveSalonId(salonId);
    setActiveTab('rewards');
    setCurrentView('rewards');
  };

  const handleQuickRebookConfirm = () => {
    setCurrentView('booking-confirmation');
  };

  const handleBackFromQuickRebook = () => {
    setCurrentView(activeTab as AppView);
  };

  // Full booking flow handlers
  const handleBookService = (serviceId: string, serviceName: string, price: number, duration: string) => {
    setBookingData({
      serviceId,
      serviceName,
      servicePrice: price,
      serviceDuration: duration,
      stylistId: '',
      stylistName: '',
      date: '',
      time: '',
    });
    setCurrentView('stylist-selection');
  };

  const handleStylistSelected = (stylistId: string) => {
    const stylistNames: Record<string, string> = {
      'any': 'Any Available Stylist',
      '1': 'Maya Chen',
      '2': 'Sara Kim',
      '3': 'Emma Rose',
    };
    setBookingData(prev => ({
      ...prev,
      stylistId,
      stylistName: stylistNames[stylistId] || 'Unknown',
    }));
    setCurrentView('datetime-selection');
  };

  const handleDateTimeSelected = (date: string, time: string) => {
    setBookingData(prev => ({ ...prev, date, time }));
    setCurrentView('payment');
  };

  const handlePaymentConfirm = () => {
    setCurrentView('booking-confirmation');
  };

  const handleBackFromBookingFlow = () => {
    setCurrentView('salon-detail');
  };

  const handleSelectSalon = (salonId: string) => {
    setActiveSalonId(salonId);
  };

  const handleNavigateToMySalons = () => {
    setCurrentView('my-salons');
  };

  const handleNavigateToMyVibeMoodBoard = () => {
    setCurrentView('my-vibe-mood-board');
  };

  const handleBackFromProfileScreens = () => {
    setCurrentView('profile');
  };

  const handleMySalonsSelectSalon = (salonId: string) => {
    setActiveSalonId(salonId);
    setActiveTab('rewards');
    setCurrentView('rewards');
  };

  const handleNavigateToWaitlist = (serviceName: string) => {
    setBookingData(prev => ({ ...prev, serviceName }));
    setCurrentView('waitlist');
  };

  const handleNavigateToReferral = () => {
    setCurrentView('referral');
  };

  const handleNavigateToWalkInQueue = () => {
    setCurrentView('walk-in-queue');
  };

  const handleNavigateToClientLookup = () => {
    setCurrentView('client-lookup');
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentView('client-detail');
  };

  const handleNavigateToMessagesInbox = () => {
    setCurrentView('messages-inbox');
  };

  const handleNavigateToConversation = (messageId: string, salonName: string) => {
    setCurrentConversationSalon(salonName);
    setCurrentView('conversation-thread');
  };

  const handleNavigateToMessageSettings = () => {
    setCurrentView('message-settings');
  };

  const handleMessageSalon = (bookingId: string, salonName: string) => {
    setCurrentConversationSalon(salonName);
    setCurrentView('conversation-thread');
  };

  const showTabBar = ['home', 'explore', 'bookings', 'rewards', 'profile'].includes(currentView);
  const showSalonSelector = ['home', 'bookings', 'rewards'].includes(currentView);
  const headerTitle = {
    home: undefined,
    explore: 'Explore',
    bookings: 'Bookings',
    rewards: 'Rewards',
    profile: 'Profile',
  }[currentView];

  return (
    <div className="size-full max-w-md mx-auto bg-background relative">
      {currentView === 'welcome' && <WelcomeScreen onGetStarted={handleGetStarted} />}

      {currentView === 'onboarding' && (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}

      {/* Header for main tabs */}
      {showTabBar && currentView !== 'home' && (
        <NavigationHeader
          title={headerTitle}
          showSalonSelector={showSalonSelector}
          activeSalonName={activeSalonName}
          onSalonSelectorClick={() => setShowSalonSwitcher(true)}
          showMessages={true}
          messageCount={unreadMessageCount}
          onMessagesClick={handleNavigateToMessagesInbox}
        />
      )}

      {currentView === 'home' && (
        <HomeScreen
          activeSalonName={activeSalonName}
          onSalonSelectorClick={() => setShowSalonSwitcher(true)}
          onServiceClick={handleServiceClick}
          onSalonClick={handleSalonClick}
          onQuickRebook={handleQuickRebook}
          onMessagesClick={handleNavigateToMessagesInbox}
          unreadMessageCount={unreadMessageCount}
        />
      )}

      {currentView === 'explore' && <ExploreScreen onServiceClick={handleServiceClick} />}

      {currentView === 'bookings' && (
        <BookingsScreen
          activeSalonName={activeSalonName}
          onQuickRebook={handleQuickRebook}
          onMessageSalon={handleMessageSalon}
        />
      )}

      {currentView === 'rewards' && (
        <RewardsScreen
          activeSalonName={activeSalonName}
          onNavigateToReferral={handleNavigateToReferral}
        />
      )}

      {currentView === 'profile' && (
        <ProfileScreen
          onNavigateToMySalons={handleNavigateToMySalons}
          onNavigateToMyVibeMoodBoard={handleNavigateToMyVibeMoodBoard}
          onNavigateToMessages={handleNavigateToMessagesInbox}
          onNavigateToWalkInQueue={handleNavigateToWalkInQueue}
          onNavigateToClientLookup={handleNavigateToClientLookup}
        />
      )}

      {currentView === 'my-salons' && (
        <MySalonsScreen
          onBack={handleBackFromProfileScreens}
          salons={mockSalons}
          activeSalonId={activeSalonId}
          onSelectSalon={handleMySalonsSelectSalon}
          onNavigateToExplore={() => {
            setActiveTab('explore');
            setCurrentView('explore');
          }}
        />
      )}

      {currentView === 'my-vibe-mood-board' && (
        <MyVibeMoodBoardScreen onBack={handleBackFromProfileScreens} />
      )}

      {currentView === 'waitlist' && (
        <WaitlistScreen
          onBack={() => setCurrentView('salon-detail')}
          serviceName={bookingData.serviceName || 'Service'}
          salonName={activeSalon?.name || 'Salon'}
        />
      )}

      {currentView === 'referral' && (
        <ReferralScreen onBack={() => setCurrentView('rewards')} />
      )}

      {currentView === 'walk-in-queue' && (
        <WalkInQueueScreen onBack={() => setCurrentView('profile')} />
      )}

      {currentView === 'client-lookup' && (
        <ClientLookupScreen
          onBack={() => setCurrentView('profile')}
          onClientSelect={handleClientSelect}
        />
      )}

      {currentView === 'client-detail' && (
        <ClientDetailScreen
          clientId={selectedClientId}
          onBack={() => setCurrentView('client-lookup')}
          onBookForClient={() => setCurrentView('stylist-selection')}
        />
      )}

      {currentView === 'messages-inbox' && (
        <MessagesInboxScreen
          onBack={handleBackFromProfileScreens}
          onThreadClick={handleNavigateToConversation}
          onNewMessage={() => alert('New message feature coming soon')}
          onSettings={handleNavigateToMessageSettings}
        />
      )}

      {currentView === 'conversation-thread' && (
        <ConversationThreadScreen
          onBack={() => setCurrentView('messages-inbox')}
          salonName={currentConversationSalon}
          bookingRef="ZRK-4729"
          onQuickReplies={() => setShowQuickReplies(true)}
        />
      )}

      {currentView === 'message-settings' && (
        <MessageNotificationSettingsScreen
          onBack={() => setCurrentView('messages-inbox')}
        />
      )}

      {currentView === 'messaging-disabled' && (
        <MessagingDisabledScreen
          onBack={() => setCurrentView('bookings')}
          salonName={currentConversationSalon}
        />
      )}

      {currentView === 'service-detail' && (
        <ServiceDetailScreen onBack={handleBackToExplore} onBookNow={handleBookNow} />
      )}

      {currentView === 'salon-detail' && (
        <SalonDetailScreen
          onBack={handleBackFromSalon}
          salonId={selectedSalonId}
          onNavigateToRewards={handleNavigateToRewardsFromSalon}
          onBookService={handleBookService}
          onNavigateToWaitlist={handleNavigateToWaitlist}
        />
      )}

      {currentView === 'stylist-selection' && (
        <StylistSelectionScreen
          onBack={handleBackFromBookingFlow}
          onNext={handleStylistSelected}
          serviceName={bookingData.serviceName}
        />
      )}

      {currentView === 'datetime-selection' && (
        <DateTimeSelectionScreen
          onBack={() => setCurrentView('stylist-selection')}
          onNext={handleDateTimeSelected}
          serviceName={bookingData.serviceName}
          stylistName={bookingData.stylistName}
        />
      )}

      {currentView === 'payment' && (
        <PaymentScreen
          onBack={() => setCurrentView('datetime-selection')}
          onConfirm={handlePaymentConfirm}
          bookingDetails={{
            serviceName: bookingData.serviceName,
            stylistName: bookingData.stylistName,
            dateTime: `${bookingData.date} at ${bookingData.time}`,
            price: bookingData.servicePrice,
            duration: bookingData.serviceDuration,
            salonName: activeSalon?.name || 'Salon',
          }}
        />
      )}

      {currentView === 'quick-rebook' && (
        <QuickRebookScreen
          onBack={handleBackFromQuickRebook}
          onConfirm={handleQuickRebookConfirm}
          serviceId={selectedSalonId}
        />
      )}

      {currentView === 'booking-confirmation' && (
        <BookingConfirmationScreen onClose={handleBookingComplete} />
      )}

      {showTabBar && (
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} bookingsBadge={2} />
      )}

      {/* Salon Switcher Sheet */}
      <SalonSwitcherSheet
        isOpen={showSalonSwitcher}
        onClose={() => setShowSalonSwitcher(false)}
        salons={mockSalons}
        activeSalonId={activeSalonId}
        onSelectSalon={handleSelectSalon}
      />

      {/* Quick Replies Sheet */}
      <QuickRepliesSheet
        isOpen={showQuickReplies}
        onClose={() => setShowQuickReplies(false)}
        onSelectReply={(text) => {
          // In real app, this would insert the text into the message input
          console.log('Selected reply:', text);
        }}
      />
    </div>
  );
}