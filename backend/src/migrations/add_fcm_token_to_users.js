/**
 * Миграция: добавление поля fcm_token в таблицу users
 */

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'fcm_token', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'FCM токен для push-уведомлений'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'fcm_token');
  }
};
