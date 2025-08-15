import type { StrapiApp } from '@strapi/strapi/admin';
import React from 'react';

console.log('=== Correct app.tsx loaded ===');

// Native Strapi drag-and-drop component using injectComponent
const DragDropToggle = () => {
  const [isDragMode, setIsDragMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [targetType, setTargetType] = React.useState('menu-items');

  // Check if current page is relevant
  const isRelevantPage = () => {
    const path = window.location.pathname;
    return path.includes('api::menu-item.menu-item') || path.includes('api::category.category');
  };

  // Fetch items from API
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const endpoint = targetType === 'menu-items' 
        ? '/api/menu-items?populate=*&sort=displayOrder:asc'
        : '/api/categories?populate=*&sort=displayOrder:asc';
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.data) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
    setIsLoading(false);
  };

  // Save new order
  const saveOrder = async () => {
    setIsLoading(true);
    try {
      const endpoint = targetType === 'menu-items' ? 'menu-items' : 'categories';
      let successCount = 0;
      
      for (let i = 0; i < items.length; i++) {
        const response = await fetch(`/api/${endpoint}/${items[i].id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              displayOrder: i + 1
            }
          })
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      alert(`${successCount}件の順序を保存しました`);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('保存エラーが発生しました');
    }
    setIsLoading(false);
  };

  // Drag handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex) {
      const newItems = [...items];
      const draggedItem = newItems[dragIndex];
      newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      setItems(newItems);
    }
  };

  if (!isRelevantPage()) {
    return null;
  }

  return React.createElement('div', {
    style: {
      backgroundColor: '#f6f6f9',
      border: '1px solid #dcdce4',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  }, [
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }
    }, [
      React.createElement('h3', {
        key: 'title',
        style: {
          margin: 0,
          color: '#32324d',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      }, 'ドラッグ&ドロップ並び替え'),
      React.createElement('button', {
        key: 'toggle',
        onClick: () => setIsDragMode(!isDragMode),
        style: {
          backgroundColor: isDragMode ? '#007bff' : '#6c757d',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }
      }, isDragMode ? 'ドラッグモード ON' : 'ドラッグモード OFF')
    ]),

    isDragMode && React.createElement('div', {
      key: 'controls',
      style: { marginBottom: '16px' }
    }, [
      React.createElement('div', {
        key: 'select-wrapper',
        style: { marginBottom: '12px' }
      }, [
        React.createElement('label', {
          key: 'label',
          style: {
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#32324d'
          }
        }, '対象選択:'),
        React.createElement('select', {
          key: 'select',
          value: targetType,
          onChange: (e) => setTargetType(e.target.value),
          style: {
            width: '200px',
            padding: '8px',
            border: '1px solid #dcdce4',
            borderRadius: '4px'
          }
        }, [
          React.createElement('option', { key: 'menu', value: 'menu-items' }, 'メニューアイテム'),
          React.createElement('option', { key: 'cat', value: 'categories' }, 'カテゴリ')
        ])
      ]),
      React.createElement('div', {
        key: 'buttons'
      }, [
        React.createElement('button', {
          key: 'fetch',
          onClick: fetchItems,
          disabled: isLoading,
          style: {
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginRight: '8px'
          }
        }, isLoading ? '読み込み中...' : 'リスト取得'),
        React.createElement('button', {
          key: 'save',
          onClick: saveOrder,
          disabled: isLoading || items.length === 0,
          style: {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: (isLoading || items.length === 0) ? 'not-allowed' : 'pointer'
          }
        }, isLoading ? '保存中...' : '順序保存')
      ])
    ]),

    isDragMode && items.length > 0 && React.createElement('div', {
      key: 'items',
      style: {
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #dcdce4',
        borderRadius: '4px',
        backgroundColor: 'white'
      }
    }, items.map((item, index) => {
      const name = item.name || item.title || '名称なし';
      return React.createElement('div', {
        key: item.id,
        draggable: true,
        onDragStart: (e) => handleDragStart(e, index),
        onDragOver: handleDragOver,
        onDrop: (e) => handleDrop(e, index),
        style: {
          padding: '12px',
          borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none',
          cursor: 'move',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'white',
          transition: 'background-color 0.2s'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = '#f8f9fa';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'white';
        }
      }, [
        React.createElement('span', {
          key: 'name',
          style: { fontWeight: 'bold', color: '#32324d' }
        }, `${index + 1}. ${name}`),
        React.createElement('span', {
          key: 'order',
          style: {
            backgroundColor: '#e9ecef',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#666'
          }
        }, `順序: ${item.displayOrder || index + 1}`)
      ]);
    }))
  ]);
};

const config = {
  config: {
    locales: ['ja'],
  },
  bootstrap(app: StrapiApp) {
    console.log('=== Admin panel bootstrap starting ===');
    
    // Component injection removed due to poor usability
    console.log('✓ Component injection disabled');
    
    // Add menu links
    app.addMenuLink({
      to: '/content-manager/collection-types/api::menu-item.menu-item',
      icon: 'Restaurant',
      intlLabel: {
        id: 'menu-order.title',
        defaultMessage: 'Menu Items',
      },
      permissions: [],
    });
    
    app.addMenuLink({
      to: '/content-manager/collection-types/api::category.category',
      icon: 'Category',
      intlLabel: {
        id: 'categories.title',
        defaultMessage: 'Categories',
      },
      permissions: [],
    });
  },
};

export default config;
