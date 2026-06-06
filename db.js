import { Sequelize, DataTypes } from 'sequelize';

const connectionString = process.env.DATABASE_URL;
let sequelize;

if (connectionString) {
  console.log('Database: Connecting to PostgreSQL database...');
  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: connectionString.includes('localhost') ? false : {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  });
} else {
  console.log('Database: DATABASE_URL not set. Falling back to local SQLite database (aeropdf_dev.sqlite) for local development...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './aeropdf_dev.sqlite',
    logging: false
  });
}

// Model: User
export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_blog: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stripe_customer_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Model: BlogPost
export const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  author_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  author_email: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Sync Database helper
export async function syncDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Automatically updates tables without losing data
    console.log('Database: Synchronized tables successfully.');
  } catch (error) {
    console.error('Database: Failed to connect or sync tables:', error);
  }
}

export default sequelize;
