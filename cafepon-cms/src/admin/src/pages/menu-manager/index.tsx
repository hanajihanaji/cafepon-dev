import React, { useState, useEffect } from 'react';
import {
  Page,
  Layouts,
  Button,
  Box,
  Stack,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@strapi/design-system';
import { useFetchClient } from '@strapi/admin/strapi-admin';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface MenuItem {
  id: number;
  name: string;
  category?: {
    name: string;
  };
  displayOrder: number;
}

const MenuManagerPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { get, put } = useFetchClient();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await get('/api/menu-items', {
        params: {
          populate: ['category'],
          sort: 'displayOrder:asc'
        }
      });
      setMenuItems(response.data.data);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
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

    // Save to backend
    try {
      await Promise.all(
        updatedItems.map(item =>
          put(`/api/menu-items/${item.id}`, {
            data: { displayOrder: item.displayOrder }
          })
        )
      );
    } catch (error) {
      console.error('Failed to update order:', error);
      // Revert on error
      fetchMenuItems();
    }
  };

  if (loading) {
    return (
      <Page.Loading />
    );
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
          <Stack spacing={4}>
            <Typography variant="alpha">
              メニューアイテム一覧
            </Typography>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menu-items">
                {(provided) => (
                  <Box {...provided.droppableProps} ref={provided.innerRef}>
                    <Table colCount={4} rowCount={menuItems.length}>
                      <Thead>
                        <Tr>
                          <Th>順番</Th>
                          <Th>メニュー名</Th>
                          <Th>カテゴリ</Th>
                          <Th>表示順</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {menuItems.map((item, index) => (
                          <Draggable
                            key={item.id}
                            draggableId={String(item.id)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Tr
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                ref={provided.innerRef}
                                style={{
                                  ...provided.draggableProps.style,
                                  backgroundColor: snapshot.isDragging
                                    ? '#f0f0ff'
                                    : 'transparent'
                                }}
                              >
                                <Td>{index + 1}</Td>
                                <Td>{item.name}</Td>
                                <Td>{item.category?.name || '未分類'}</Td>
                                <Td>{item.displayOrder}</Td>
                              </Tr>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          </Stack>
        </Box>
      </Layouts.Content>
    </Layouts.Root>
  );
};

export default MenuManagerPage;
