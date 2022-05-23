const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

process.env.JWT = 'secret-pass';

const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: STRING,
})

Note.belongsTo(User);
User.hasMany(Note);

User.byToken = async (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(payload.id);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  const compare = await bcrypt.compare(password, user.password);
  if (compare) {
    return jwt.sign({ id: user.id }, process.env.JWT);
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];


  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );


  const notes = [ { text: 'hello world'}, { text: 'reminder to buy groceries'}, { text: 'reminder to do laundry'} ];
  const [note1, note2, note3] = await Promise.all(notes.map( note => Note.create(note)));
  await lucy.setNotes(note1);
  await moe.setNotes([note2, note3]);


  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

User.beforeCreate(async (user) => {
  const hashed = await bcrypt.hash(user.password, 5);
  user.password = hashed;
});

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
