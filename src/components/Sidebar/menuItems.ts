export type FunctionType = 
  | 'vocabulary' | 'writing' | 'meaning' | 'random' | 'manage' 
  | 'sentence-pinyin' | 'sentence-writing' | 'sentence-meaning' | 'sentence-random' | 'sentence-manage' 
  | 'translate' | 'statistics';

export type MenuGroup = 'vocab' | 'sentence' | null;

export interface MenuItem {
  id: FunctionType;
  label: string;
  iconPath: string;
}

export interface MenuGroupDef {
  id: 'vocab' | 'sentence';
  label: string;
  iconPath: string;
  items: MenuItem[];
}

export interface StandaloneMenuItem {
  id: FunctionType;
  label: string;
  iconPath: string;
}

// SVG path data — reused across sidebar, mobile drawer, bottom nav
const ICON = {
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  editSquare: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  shuffle: 'M16 3l5 0 0 5M4 20L21 3M21 16l0 5-5 0M15 15l6 6M4 4l5 5',
  chatBubble: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  barChart: 'M18 20V10M12 20V4M6 20v-6',
};

export const vocabMenuGroup: MenuGroupDef = {
  id: 'vocab',
  label: 'Học từ',
  iconPath: ICON.book,
  items: [
    { id: 'vocabulary', label: 'Viết Pinyin', iconPath: ICON.editSquare },
    { id: 'writing', label: 'Viết Hán Tự', iconPath: ICON.type },
    { id: 'meaning', label: 'Viết Nghĩa', iconPath: ICON.chat },
    { id: 'random', label: 'Luyện tập ngẫu nhiên', iconPath: ICON.shuffle },
    { id: 'manage', label: 'Quản lý từ vựng', iconPath: ICON.editSquare },
  ],
};

export const sentenceMenuGroup: MenuGroupDef = {
  id: 'sentence',
  label: 'Học câu',
  iconPath: ICON.chatBubble,
  items: [
    { id: 'sentence-pinyin', label: 'Viết Pinyin', iconPath: ICON.editSquare },
    { id: 'sentence-writing', label: 'Viết Hán Tự', iconPath: ICON.type },
    { id: 'sentence-meaning', label: 'Viết Nghĩa', iconPath: ICON.chat },
    { id: 'sentence-random', label: 'Luyện tập ngẫu nhiên', iconPath: ICON.shuffle },
    { id: 'sentence-manage', label: 'Quản lý câu', iconPath: ICON.editSquare },
  ],
};

export const standaloneItems: StandaloneMenuItem[] = [
  { id: 'translate', label: 'Dịch thuật', iconPath: ICON.globe },
  { id: 'statistics', label: 'Thống kê', iconPath: ICON.barChart },
];

export function getMenuGroupForFunction(func: FunctionType): MenuGroup {
  if (['vocabulary', 'writing', 'meaning', 'random', 'manage'].includes(func)) {
    return 'vocab';
  }
  if (func.startsWith('sentence-')) {
    return 'sentence';
  }
  return null;
}
