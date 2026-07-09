import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

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
  console.log('Database: DATABASE_URL not set. Falling back to local SQLite database (pixelpdf_dev.sqlite) for local development...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './pixelpdf_dev.sqlite',
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
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profile_pic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  can_blog: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripe_customer_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subscription_plan: {
    type: DataTypes.STRING,
    defaultValue: 'free'
  },
  subscription_seats: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  subscription_interval: {
    type: DataTypes.STRING,
    defaultValue: 'month'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  cumulative_bytes_processed: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  custom_features: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ai_credits_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Model: CollaborationEmail
export const CollaborationEmail = sequelize.define('CollaborationEmail', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
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
  },
  author_name: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Model: NewsletterSubscriber
export const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
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
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // 'pending', 'active', 'cancelled'
  },
  stripe_customer_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripe_subscription_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

export const ContactInquiry = sequelize.define('ContactInquiry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  business_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // 'pending', 'contacted', 'resolved'
  }
});

export async function syncDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Automatically updates tables without losing data
    console.log('Database: Synchronized tables successfully.');

    // Seed default admin user
    const adminEmail = 'admin@pixelpdf.com';
    const adminUser = await User.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        first_name: 'System',
        last_name: 'Administrator',
        display_name: 'PixelPDF Admin',
        role: 'admin',
        subscription_plan: 'premium',
        subscription_seats: 999,
        is_premium: true
      });
      console.log('Database Seeding: Created default administrator account (admin@pixelpdf.com / admin123).');
    }
  } catch (error) {
    console.error('Database: Failed to connect or sync tables:', error);
  }
}

export default sequelize;
