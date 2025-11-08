/**
 * Экран выбора столика для официанта
 * Отображение доступных столиков в виде сетки
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Title, Paragraph, Badge } from 'react-native-paper';
import { LinearGradient } from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { selectActiveOrders } from '../../store/slices/ordersSlice';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, TABLE_LAYOUT } from '../../constants';

const { width } = Dimensions.get('window');
const tableSize = (width - SPACING.MD * 2 - SPACING.SM * (TABLE_LAYOUT.GRID_COLUMNS - 1)) / TABLE_LAYOUT.GRID_COLUMNS;

const TableSelectionScreen = () => {
  const navigation = useNavigation();
  const activeOrders = useSelector(selectActiveOrders);
  const [selectedTable, setSelectedTable] = useState(null);

  // Генерируем список столиков (1-20)
  const tables = Array.from({ length: 20 }, (_, i) => i + 1);

  // Получаем столики с активными заказами
  const tablesWithOrders = activeOrders.reduce((acc, order) => {
    acc[order.table_number] = (acc[order.table_number] || 0) + 1;
    return acc;
  }, {});

  const getTableStatus = (tableNumber) => {
    const orderCount = tablesWithOrders[tableNumber] || 0;
    if (orderCount === 0) {
      return { status: 'free', color: COLORS.SUCCESS, text: 'Свободен' };
    } else if (orderCount === 1) {
      return { status: 'occupied', color: COLORS.WARNING, text: '1 заказ' };
    } else {
      return { status: 'busy', color: COLORS.ERROR, text: `${orderCount} заказов` };
    }
  };

  const handleTablePress = (tableNumber) => {
    setSelectedTable(tableNumber);
    // Навигация на экран меню с номером столика
    navigation.navigate('MenuScreen', { tableNumber });
  };

  const renderTable = ({ item: tableNumber }) => {
    const tableStatus = getTableStatus(tableNumber);
    const isSelected = selectedTable === tableNumber;

    return (
      <TouchableOpacity
        style={[
          styles.tableContainer,
          { width: tableSize, height: tableSize },
          isSelected && styles.selectedTable,
        ]}
        onPress={() => handleTablePress(tableNumber)}
        activeOpacity={0.7}
      >
        <Card
          style={[
            styles.tableCard,
            { backgroundColor: tableStatus.color },
            isSelected && styles.selectedTableCard,
          ]}
        >
          <Card.Content style={styles.tableContent}>
            <Text style={styles.tableNumber}>{tableNumber}</Text>
            <Text style={styles.tableStatus}>{tableStatus.text}</Text>
            
            {tablesWithOrders[tableNumber] && (
              <Badge
                style={[
                  styles.tableBadge,
                  { backgroundColor: COLORS.WHITE }
                ]}
                size={20}
              >
                {tablesWithOrders[tableNumber]}
              </Badge>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.LIGHT, COLORS.WHITE]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Title style={styles.title}>Выбор столика</Title>
          <Paragraph style={styles.subtitle}>
            Нажмите на столик для создания заказа
          </Paragraph>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.SUCCESS }]} />
            <Text style={styles.legendText}>Свободен</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.WARNING }]} />
            <Text style={styles.legendText}>1 заказ</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.ERROR }]} />
            <Text style={styles.legendText}>Много заказов</Text>
          </View>
        </View>

        <FlatList
          data={tables}
          renderItem={renderTable}
          keyExtractor={(item) => item.toString()}
          numColumns={TABLE_LAYOUT.GRID_COLUMNS}
          contentContainerStyle={styles.tablesGrid}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: SPACING.MD,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.H2,
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.DARK_GRAY,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.MD,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.SM,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.XS,
  },
  legendText: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.DARK_GRAY,
  },
  tablesGrid: {
    padding: SPACING.MD,
  },
  tableContainer: {
    margin: SPACING.XS,
  },
  selectedTable: {
    transform: [{ scale: 1.05 }],
  },
  tableCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.MD,
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectedTableCard: {
    elevation: 8,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tableContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tableNumber: {
    ...TYPOGRAPHY.H2,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  tableStatus: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.WHITE,
    textAlign: 'center',
    marginTop: SPACING.XS,
  },
  tableBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});

export default TableSelectionScreen;
