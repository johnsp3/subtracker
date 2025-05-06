Set up the frontend according to the following prompt:
  <frontend-prompt>
  Create detailed components with these requirements:
  1. Use 'use client' directive for client-side components
  2. Make sure to concatenate strings correctly using backslash
  3. Style with Tailwind CSS utility classes for responsive design
  4. Use Lucide React for icons (from lucide-react package). Do NOT use other UI libraries unless requested
  5. Use stock photos from picsum.photos where appropriate, only valid URLs you know exist
  6. Configure next.config.js image remotePatterns to enable stock photos from picsum.photos
  7. Create root layout.tsx page that wraps necessary navigation items to all pages
  8. MUST implement the navigation elements items in their rightful place i.e. Left sidebar, Top header
  9. Accurately implement necessary grid layouts
  10. Follow proper import practices:
     - Use @/ path aliases
     - Keep component imports organized
     - Update current src/app/page.tsx with new comprehensive code
     - Don't forget root route (page.tsx) handling
     - You MUST complete the entire prompt before stopping
  </frontend-prompt>

  <summary_title>
Financial Dashboard with Transaction Overview and Card Management
</summary_title>

<image_analysis>
1. Navigation Elements:
- Primary navigation: Overview, Subscriptions, Statistics, Settings
- Left sidebar navigation with 60px height icons
- Search bar in header (full width)
- Notifications icon and profile avatar in top right
- "Savemoney" logo with icon in top left (40x40px)

2. Layout Components:
- Left sidebar: 280px width, purple background (#6C5DD3)
- Main content area: Flexible width with 32px padding
- Top stats cards: 3-column grid, equal width
- Transaction list: Full width container
- Right sidebar: 320px width for card details

3. Content Sections:
- Welcome header with user greeting
- Overview statistics cards (Income/Expenses/Savings)
- Transaction history list with date grouping
- Credit card display section
- Quick send contacts section

4. Interactive Controls:
- Search input field with search icon
- Transaction item expansion controls
- "view all" and "change" text buttons
- Quick send contact buttons
- Transaction filtering options

5. Colors:
- Primary Purple: #6C5DD3
- Background: #F7F6FB
- Text Dark: #1B1C31
- Success Green: #7FBA7A
- Error Red: #FF4B55
- Card Background: #FFFFFF

6. Grid/Layout Structure:
- 12-column grid system
- 24px gutters between columns
- Responsive breakpoints at 768px, 1024px, 1440px
- Nested grid for statistics cards
</image_analysis>

<development_planning>
1. Project Structure:
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Dashboard.tsx
│   ├── features/
│   │   ├── statistics/
│   │   ├── transactions/
│   │   └── card/
│   └── shared/
├── assets/
├── styles/
├── hooks/
└── utils/
```

2. Key Features:
- Real-time transaction tracking
- Statistics visualization
- Card management
- Quick transfer functionality
- Search and filtering
- Responsive layout system

3. State Management:
```typescript
interface AppState {
  user: {
    name: string;
    avatar: string;
    balance: number;
  };
  transactions: {
    items: Transaction[];
    loading: boolean;
    error: string | null;
  };
  statistics: {
    income: number;
    expenses: number;
    savings: number;
  };
  card: {
    balance: number;
    number: string;
    holder: string;
  };
}
```

4. Component Architecture:
- DashboardLayout (container)
  - Sidebar
  - MainContent
    - StatisticsGrid
    - TransactionList
  - CardSection
    - CardDisplay
    - QuickSend

5. Responsive Breakpoints:
```scss
$breakpoints: (
  'mobile': 320px,
  'tablet': 768px,
  'desktop': 1024px,
  'wide': 1440px
);
```
</development_planning>