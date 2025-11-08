/**
 * Модель пользователя системы
 * Определяет роли: waiter, cook, admin, director
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('./database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true, // Для официантов и поваров может быть null
    field: 'password_hash'
  },
  role: {
    type: DataTypes.ENUM('waiter', 'cook', 'admin', 'director'),
    allowNull: false,
    defaultValue: 'waiter',
    validate: {
      isIn: [['waiter', 'cook', 'admin', 'director']]
    }
  },
  waiter_number: {
    type: DataTypes.INTEGER,
    allowNull: true, // Только для официантов и поваров
    unique: true,
    validate: {
      min: 1,
      max: 999
    }
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [2, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/ // Простая валидация телефона
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fcm_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'FCM токен для push-уведомлений'
  }
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['waiter_number'],
      where: {
        waiter_number: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    // Хук перед созданием/обновлением - хэширование пароля
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    }
  }
});

/**
 * Метод для проверки пароля
 * @param {string} password - Пароль для проверки
 * @returns {boolean} - Результат проверки
 */
User.prototype.checkPassword = async function(password) {
  if (!this.password_hash) return false;
  return await bcrypt.compare(password, this.password_hash);
};

/**
 * Метод для обновления времени последнего входа
 */
User.prototype.updateLastLogin = async function() {
  this.last_login = new Date();
  await this.save();
};

/**
 * Статический метод для поиска пользователя по номеру официанта/повара
 * @param {number} waiterNumber - Номер официанта/повара
 * @returns {User|null} - Найденный пользователь или null
 */
User.findByWaiterNumber = async function(waiterNumber) {
  return await this.findOne({
    where: {
      waiter_number: waiterNumber,
      is_active: true
    }
  });
};

/**
 * Статический метод для поиска пользователя по username
 * @param {string} username - Имя пользователя
 * @returns {User|null} - Найденный пользователь или null
 */
User.findByUsername = async function(username) {
  return await this.findOne({
    where: {
      username: username,
      is_active: true
    }
  });
};

/**
 * Статический метод для получения всех активных пользователей по роли
 * @param {string} role - Роль пользователя
 * @returns {Array<User>} - Массив пользователей
 */
User.findByRole = async function(role) {
  return await this.findAll({
    where: {
      role: role,
      is_active: true
    },
    order: [['created_at', 'ASC']]
  });
};

/**
 * Метод для получения публичной информации о пользователе (без пароля)
 * @returns {Object} - Публичная информация
 */
User.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    username: this.username,
    role: this.role,
    waiter_number: this.waiter_number,
    full_name: this.full_name,
    phone: this.phone,
    is_active: this.is_active,
    last_login: this.last_login,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

module.exports = User;
