import { useState, useEffect, useCallback } from 'react';
import { FunctionType, MenuGroup, getMenuGroupForFunction } from '../components/Sidebar/menuItems';

export function useAppNavigation() {
  const [currentLevel, setCurrentLevel] = useState<string>(() => 
    localStorage.getItem('hsk_currentLevel') || 'hsk1'
  );
  
  const [currentFunction, setCurrentFunction] = useState<FunctionType>(() => 
    (localStorage.getItem('hsk_currentFunction') as FunctionType) || 'vocabulary'
  );
  
  const [expandedMenu, setExpandedMenu] = useState<MenuGroup>(() => {
    const saved = localStorage.getItem('hsk_expandedMenu');
    return saved ? (saved as MenuGroup) : 'vocab';
  });
  
  const [currentTopic, setCurrentTopic] = useState<string>(() => 
    localStorage.getItem('hsk_currentTopic') || ''
  );

  // Persist navigation state
  useEffect(() => {
    localStorage.setItem('hsk_currentLevel', currentLevel);
  }, [currentLevel]);

  useEffect(() => {
    localStorage.setItem('hsk_currentFunction', currentFunction);
  }, [currentFunction]);

  useEffect(() => {
    if (expandedMenu) {
      localStorage.setItem('hsk_expandedMenu', expandedMenu);
    }
  }, [expandedMenu]);

  useEffect(() => {
    localStorage.setItem('hsk_currentTopic', currentTopic);
  }, [currentTopic]);

  // Tự động chọn "Tất cả chủ đề" khi chuyển sang sentence mode
  useEffect(() => {
    const isSentenceMode = currentFunction.startsWith('sentence-');
    if (isSentenceMode) {
      if (!currentTopic) {
        setCurrentTopic('');
      }
    }
  }, [currentFunction, currentLevel, currentTopic]);

  const handleFunctionChange = useCallback((func: FunctionType, onMobileAction?: () => void) => {
    setCurrentFunction(func);
    // Tự động mở menu tương ứng
    const targetGroup = getMenuGroupForFunction(func);
    setExpandedMenu(targetGroup);
    
    if (onMobileAction) {
      onMobileAction();
    }
  }, []);

  return {
    currentLevel,
    setCurrentLevel,
    currentFunction,
    handleFunctionChange,
    expandedMenu,
    setExpandedMenu,
    currentTopic,
    setCurrentTopic
  };
}
