/**
 * Главный компонент TV Display
 * Отображение заказов на телевизоре
 */

import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import io from 'socket.io-client';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    overflow: hidden;
  }

  #root {
    height: 100vh;
    width: 100vw;
  }
`;

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  opacity: 0.9;
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  padding: 10px;
`;

const OrderCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: slideIn 0.5s ease-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const OrderNumber = styled.h2`
  font-size: 2.5rem;
  font-weight: bold;
  color: #FFD700;
`;

const TableNumber = styled.div`
  font-size: 1.8rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
`;

const StatusBadge = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'new': return '#2196F3';
      case 'accepted': return '#FF9800';
      case 'preparing': return '#FF5722';
      case 'ready': return '#4CAF50';
      default: return '#9E9E9E';
    }
  }};
  color: white;
  margin-top: 10px;
`;

const OrderItems = styled.div`
  margin-bottom: 20px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1.3rem;

  &:last-child {
    border-bottom: none;
  }
`;

const ItemName = styled.span`
  flex: 1;
`;

const ItemQuantity = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 10px;
  border-radius: 15px;
  margin-right: 15px;
  font-weight: bold;
`;

const OrderTime = styled.div`
  text-align: center;
  font-size: 1.1rem;
  opacity: 0.8;
  margin-top: 15px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 8rem;
  margin-bottom: 30px;
  opacity: 0.5;
`;

const EmptyText = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 15px;
  opacity: 0.8;
`;

const EmptySubtext = styled.p`
  font-size: 1.5rem;
  opacity: 0.6;
`;

const ConnectionStatus = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  background: ${props => props.connected ? '#4CAF50' : '#F44336'};
  color: white;
  z-index: 1000;
`;

const App = () => {
  const [orders, setOrders] = useState([]);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Подключение к WebSocket
    const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('order:new', (data) => {
      console.log('New order:', data);
      setOrders(prev => [data, ...prev]);
    });

    newSocket.on('order:updated', (data) => {
      console.log('Order updated:', data);
      setOrders(prev => {
        const updated = prev.map(order =>
          (order.orderId || order.id) === data.orderId
            ? { ...order, status: data.status }
            : order
        );
        // Если заказ стал ready — убираем его с экрана TV
        return updated.filter(o => o.status !== 'ready');
      });
    });

    newSocket.on('order:cancelled', (data) => {
      console.log('Order cancelled:', data);
      setOrders(prev => 
        prev.filter(order => order.orderId !== data.orderId)
      );
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'accepted': return 'Принят';
      case 'preparing': return 'Готовится';
      case 'ready': return 'Готов';
      default: return 'Неизвестно';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Фильтрация только активных статусов и группировка по столикам
  const activeOrders = orders.filter(o => ['new', 'accepted', 'preparing'].includes(o.status));
  const ordersByTable = activeOrders.reduce((acc, order) => {
    const tableNum = order.tableNumber || order.table_number;
    if (!acc[tableNum]) {
      acc[tableNum] = [];
    }
    acc[tableNum].push(order);
    return acc;
  }, {});

  return (
    <>
      <GlobalStyle />
      <Container>
        <ConnectionStatus connected={connected}>
          {connected ? 'Подключено' : 'Отключено'}
        </ConnectionStatus>

        <Header>
          <Title>PectoranAPP</Title>
          <Subtitle>Система управления рестораном</Subtitle>
        </Header>

        {orders.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🍽️</EmptyIcon>
            <EmptyText>Нет активных заказов</EmptyText>
            <EmptySubtext>Ожидайте новых заказов от официантов</EmptySubtext>
          </EmptyState>
        ) : (
          <OrdersGrid>
            {Object.entries(ordersByTable).map(([tableNum, tableOrders]) => (
              <OrderCard key={tableNum}>
                <OrderHeader>
                  <TableNumber>Столик {tableNum}</TableNumber>
                  <OrderNumber>{tableOrders.length} {tableOrders.length === 1 ? 'заказ' : 'заказа'}</OrderNumber>
                </OrderHeader>

                {tableOrders.map((order, index) => (
                  <div key={order.orderId || order.id} style={{marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.2)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                      <span style={{fontSize: '1.5rem'}}>Заказ #{index + 1} (ID: {order.orderId || order.id})</span>
                      <StatusBadge status={order.status}>
                        {getStatusText(order.status)}
                      </StatusBadge>
                    </div>

                    <OrderItems>
                      {order.items && order.items.map((item, index) => (
                        <OrderItem key={index}>
                          <ItemName>{item.name}</ItemName>
                          <ItemQuantity>{item.quantity}x</ItemQuantity>
                        </OrderItem>
                      ))}
                    </OrderItems>

                    <OrderTime>
                      Создан: {formatTime(order.timestamp || order.created_at)}
                    </OrderTime>
                  </div>
                ))}
              </OrderCard>
            ))}
          </OrdersGrid>
        )}
      </Container>
    </>
  );
};

export default App;
