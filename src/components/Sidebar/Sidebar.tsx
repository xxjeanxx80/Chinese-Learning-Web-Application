import React from 'react';
import { 
  FunctionType, 
  MenuGroup, 
  vocabMenuGroup, 
  sentenceMenuGroup, 
  standaloneItems, 
  MenuItem, 
  MenuGroupDef 
} from './menuItems';

interface SidebarProps {
  currentFunction: FunctionType;
  expandedMenu: MenuGroup;
  onFunctionChange: (func: FunctionType) => void;
  onToggleMenu: (menu: MenuGroup) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentFunction,
  expandedMenu,
  onFunctionChange,
  onToggleMenu,
}) => {
  const renderIcon = (pathData: string) => (
    <span className="menu-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {pathData.split('M').slice(1).map((pathInfo, i) => (
          <path key={i} d={`M${pathInfo}`} />
        ))}
      </svg>
    </span>
  );

  const renderMenuItem = (item: MenuItem | import('./menuItems').StandaloneMenuItem, isStandalone: boolean = false) => (
    <button
      key={item.id}
      className={`menu-item ${isStandalone ? 'menu-item-standalone' : ''} ${currentFunction === item.id ? 'active' : ''}`}
      onClick={() => onFunctionChange(item.id)}
    >
      {renderIcon(item.iconPath)}
      <span className="menu-text">{item.label}</span>
    </button>
  );

  const renderGroup = (group: MenuGroupDef) => {
    const isExpanded = expandedMenu === group.id;
    return (
      <div className="menu-group" key={group.id}>
        <button
          className="menu-group-header"
          onClick={() => onToggleMenu(isExpanded ? null : group.id)}
        >
          {renderIcon(group.iconPath)}
          <span className="menu-text">{group.label}</span>
          <span className="menu-arrow">{isExpanded ? '▼' : '▶'}</span>
        </button>
        <div className={`menu-submenu ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {group.items.map(item => renderMenuItem(item))}
        </div>
      </div>
    );
  };

  return (
    <div className="sidebar-section">
      <h3 className="sidebar-title">Chức năng</h3>
      <nav className="sidebar-menu">
        {renderGroup(vocabMenuGroup)}
        {renderGroup(sentenceMenuGroup)}
        <div className="menu-group">
          {standaloneItems.map(item => renderMenuItem(item, true))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
