import React, { useState, useEffect } from 'react';
import {
  Page,
  Layouts,
  Button,
  Box,
  Stack,
  Typography,
  Alert,
} from '@strapi/design-system';
import { useFetchClient } from '@strapi/admin/strapi-admin';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface MenuItem {
  id: number;
  documentId: string;
  name: string;
  category?: {
    name: string;
  };
  displayOrder: number;
}

interface Category {
  id: number;
  documentId: string;
  name: string;
  displayOrder: number;
}

const MenuOrderPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { get, put } = useFetchClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        get('/api/menu-items', {
          params: {
            populate: ['category'],
            sort: 'displayOrder:asc',
            pagination: { pageSize: 100 }
          }
        }),
        get('/api/categories', {
          params: {
            sort: 'displayOrder:asc',
            pagination: { pageSize: 100 }
          }
        })
      ]);

      setMenuItems(itemsResponse.data.data || []);
      setCategories(categoriesResponse.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order
    const updatedItems = items.map((item, index) => ({
      ...item,
      displayOrder: (index + 1) * 10
    }));

    setMenuItems(updatedItems);
    setSaving(true);

    try {
      await Promise.all(
        updatedItems.map(item =>
          put(`/api/menu-items/${item.documentId}`, {
            data: { displayOrder: item.displayOrder }
          })
        )
      );
      setMessage('メニューアイテムの順序を更新しました');
    } catch (error) {
      console.error('Failed to update menu item order:', error);
      setMessage('更新に失敗しました');
      fetchData(); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order
    const updatedItems = items.map((item, index) => ({
      ...item,
      displayOrder: (index + 1) * 10
    }));

    setCategories(updatedItems);
    setSaving(true);

    try {
      await Promise.all(
        updatedItems.map(item =>
          put(`/api/categories/${item.documentId}`, {
            data: { displayOrder: item.displayOrder }
          })
        )
      );
      setMessage('カテゴリの順序を更新しました');
    } catch (error) {
      console.error('Failed to update category order:', error);
      setMessage('更新に失敗しました');
      fetchData(); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Page.Loading />;
  }

  return (
    <Layouts.Root>
      <Page.Title>メニュー表示順管理</Page.Title>
      <Layouts.Header
        title="メニュー表示順管理"
        subtitle="ドラッグ&ドロップでメニューの表示順を変更できます"
        as="h1"
      />
      <Layouts.Content>
        <Box padding={8}>
          <Stack spacing={6}>
            {message && (
              <Alert variant="success" onClose={() => setMessage('')}>
                {message}
              </Alert>
            )}

            {/* Categories Section */}
            <Box>
              <Typography variant="alpha" marginBottom={4}>
                カテゴリ順序管理
              </Typography>
              
              <DragDropContext onDragEnd={handleCategoryDragEnd}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <Stack spacing={2}>
                        {categories.map((category, index) => (
                          <Draggable
                            key={category.documentId}
                            draggableId={category.documentId}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                padding={4}
                                background={snapshot.isDragging ? 'primary100' : 'neutral0'}
                                borderStyle="solid"
                                borderWidth="1px"
                                borderColor="neutral200"
                                borderRadius="4px"
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <Typography fontWeight="semiBold">
                                  {index + 1}. {category.name} (順序: {category.displayOrder})
                                </Typography>
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Stack>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </Box>

            {/* Menu Items Section */}
            <Box>
              <Typography variant="alpha" marginBottom={4}>
                メニューアイテム順序管理
              </Typography>
              
              <DragDropContext onDragEnd={handleMenuItemDragEnd}>
                <Droppable droppableId="menu-items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <Stack spacing={2}>
                        {menuItems.map((item, index) => (
                          <Draggable
                            key={item.documentId}
                            draggableId={item.documentId}
                            index={index}
                            isDragDisabled={saving}
                          >
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                padding={4}
                                background={snapshot.isDragging ? 'primary100' : 'neutral0'}
                                borderStyle="solid"
                                borderWidth="1px"
                                borderColor="neutral200"
                                borderRadius="4px"
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <Typography fontWeight="semiBold">
                                  {index + 1}. {item.name}
                                </Typography>
                                <Typography textColor="neutral600" fontSize={1}>
                                  カテゴリ: {item.category?.name || '未分類'} | 順序: {item.displayOrder}
                                </Typography>
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Stack>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </Box>
          </Stack>
        </Box>
      </Layouts.Content>
    </Layouts.Root>
  );
};

export default MenuOrderPage;